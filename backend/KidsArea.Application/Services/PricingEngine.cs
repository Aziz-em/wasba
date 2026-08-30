using KidsArea.Domain.Entities;
using KidsArea.Domain.Enums;

namespace KidsArea.Application.Services;

public class PricingEngine
{
    public decimal GetPackagePrice(SystemSettings s, List<SiblingPrice> siblingPrices, PricingMode mode, int siblingsCount, DurationPackage package)
    {
        if (mode == PricingMode.Individual || siblingsCount < 2)
        {
            return package switch
            {
                DurationPackage.OneHour => s.Price1Hour,
DurationPackage.TwoHours => s.Price2Hours,
DurationPackage.ThreeHours => s.Price3Hours,
DurationPackage.FourHours => s.Price4Hours,
DurationPackage.FullDay => s.PriceFullDay,
                _ => 0
            };
        }

        var row = siblingPrices.FirstOrDefault(x => x.SiblingsCount == siblingsCount && x.DurationPackage == (int)package);
        return row?.Price ?? 0;
    }

    public decimal GetCompanionsAmount(SystemSettings s, int companionsCount)
    {
        // 2 free per invoice; each extra charged
        var extra = Math.Max(0, companionsCount - 2);
        return extra * s.ExtraCompanionPrice;
    }

    public int PackageToHours(DurationPackage package) => package switch
    {
        DurationPackage.OneHour => 1,
DurationPackage.TwoHours => 2,
DurationPackage.ThreeHours => 3,
DurationPackage.FourHours => 4,
DurationPackage.FullDay => 0,
        _ => 1
    };

    public DateTime? ExpectedCheckout(DateTime checkIn, DurationPackage package, string closingTimeHHmm)
    {
        if (package == DurationPackage.FullDay)
        {
            if (TimeSpan.TryParse(closingTimeHHmm, out var close))
            {
                var d = checkIn.Date.Add(close);
                if (d <= checkIn) d = d.AddDays(1);
                return d;
            }
            return checkIn.Date.AddHours(23);
        }
        var h = PackageToHours(package);
        return checkIn.AddHours(h);
    }

         /// <summary>
    /// السماح يُطبَّق على نهاية الباقة وعلى كسر الساعة في إجمالي المدة.
    /// مثال: 3س و6د مع سماح 15د → يُحاسب كـ 3 ساعات فقط.
    /// </summary>
    public (int overageHours, decimal amount) CalculateOverage(
        SystemSettings s,
        List<SiblingPrice> siblingPrices,
        Visit visit,
        DateTime checkOutUtc)
    {
        if (visit.Package == DurationPackage.FullDay)
            return (0, 0);

        var expected = visit.ExpectedCheckOutTime ?? visit.CheckInTime.AddHours(visit.PackageHours);
        var graceMinutes = Math.Max(0, s.GraceMinutes);

        // داخل الباقة + السماح من نهاية الباقة → لا تجاوز
        if (checkOutUtc <= expected.AddMinutes(graceMinutes))
            return (0, 0);

        // إجمالي مدة البقاء من الدخول للخروج
        var totalMinutes = (checkOutUtc - visit.CheckInTime).TotalMinutes;
        if (totalMinutes < 0) totalMinutes = 0;

        var wholeHours = (int)Math.Floor(totalMinutes / 60.0);
        var remainderMinutes = totalMinutes - (wholeHours * 60.0);

        // كسر الساعة ≤ السماح → لا نرفع للساعة التالية
        int billableHours = remainderMinutes <= graceMinutes
            ? wholeHours
            : wholeHours + 1;

        if (billableHours < 1) billableHours = 1;

        // لا نحاسب أقل من باقة الدخول
        if (billableHours <= visit.PackageHours)
            return (0, 0);

        var extraHours = billableHours - visit.PackageHours;

        DurationPackage targetPackage =
            billableHours <= 1 ? DurationPackage.OneHour :
            billableHours <= 2 ? DurationPackage.TwoHours :
            billableHours <= 3 ? DurationPackage.ThreeHours :
            billableHours <= 4 ? DurationPackage.FourHours :
            DurationPackage.FullDay;

        var newPackagePrice = GetPackagePrice(
            s, siblingPrices, visit.PricingMode, visit.SiblingsCount, targetPackage);

        var amount = Math.Max(0, Math.Round(newPackagePrice - visit.PackageAmount, 2));
        return (extraHours, amount);
    }
}