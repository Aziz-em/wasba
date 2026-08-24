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
    /// بعد انتهاء الباقة + السماحية: يُحسب سعر باقة إجمالي الساعات
    /// (1 / 2 / 3 / يوم كامل) ويُخصم ما دُفع عند الدخول على الباقة فقط.
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
        var graceEnd = expected.AddMinutes(s.GraceMinutes);
        if (checkOutUtc <= graceEnd)
            return (0, 0);

        var minutesOver = (checkOutUtc - expected).TotalMinutes;
        var extraHours = (int)Math.Ceiling(minutesOver / 60.0);
        if (extraHours < 1) extraHours = 1;

        var totalHours = visit.PackageHours + extraHours;

        DurationPackage targetPackage =
    totalHours <= 1 ? DurationPackage.OneHour :
    totalHours <= 2 ? DurationPackage.TwoHours :
    totalHours <= 3 ? DurationPackage.ThreeHours :
    totalHours <= 4 ? DurationPackage.FourHours :
    DurationPackage.FullDay;

        var newPackagePrice = GetPackagePrice(
            s, siblingPrices, visit.PricingMode, visit.SiblingsCount, targetPackage);

        // الفرق عن سعر الباقة المدفوعة عند الدخول فقط (بدون مرافقين/مرن)
        var amount = Math.Max(0, Math.Round(newPackagePrice - visit.PackageAmount, 2));
        return (extraHours, amount);
    }
}