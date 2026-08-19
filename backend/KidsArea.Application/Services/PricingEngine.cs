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
        DurationPackage.FullDay => 0, // special
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
    /// Overage after package end: 15 min grace then full hours.
    /// Full day: never overage.
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
        // After grace, charge full hours from end of package (ceil)
        var hours = (int)Math.Ceiling(minutesOver / 60.0);
        if (hours < 1) hours = 1;

        decimal perHour;
        if (visit.PricingMode == PricingMode.Siblings && visit.SiblingsCount >= 2)
        {
            // use 1-hour sibling price for that count
            var row = siblingPrices.FirstOrDefault(x => x.SiblingsCount == visit.SiblingsCount && x.DurationPackage == (int)DurationPackage.OneHour);
            perHour = row?.Price ?? s.Price1Hour;
        }
        else
        {
            perHour = s.Price1Hour;
        }

        return (hours, Math.Round(hours * perHour, 2));
    }
}
