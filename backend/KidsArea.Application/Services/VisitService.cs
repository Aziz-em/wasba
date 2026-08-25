using KidsArea.Application.DTOs;
using KidsArea.Domain.Entities;
using KidsArea.Domain.Enums;
using KidsArea.Domain.Interfaces;
using KidsArea.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace KidsArea.Application.Services;

public class VisitService
{
    private readonly AppDbContext _db;
    private readonly PricingEngine _pricing;

    public VisitService(AppDbContext db, PricingEngine pricing)
    {
        _db = db;
        _pricing = pricing;
    }

    private async Task<SystemSettings> Settings() =>
        await _db.SystemSettings.FirstAsync(x => x.Id == 1);

    private async Task<CashShift> RequireOpenShift(int cashierId)
{
    // وردية واحدة مفتوحة للمحل — لأي مستخدم
    var shift = await _db.CashShifts.FirstOrDefaultAsync(s =>
        s.Status == ShiftStatus.Open && !s.IsDeleted);
    if (shift == null) throw new InvalidOperationException("يجب فتح وردية أولاً");
    return shift;
}

    public async Task<CheckInResultDto> CheckInAsync(CheckInDto dto, int cashierId)
    {
        if (string.IsNullOrWhiteSpace(dto.Phone)) throw new InvalidOperationException("رقم الهاتف إلزامي");
        if (string.IsNullOrWhiteSpace(dto.ChildName)) throw new InvalidOperationException("اسم الطفل إلزامي");
        if (dto.ChildAge < 1) throw new InvalidOperationException("عمر الطفل إلزامي");

        var shift = await RequireOpenShift(cashierId);
        var settings = await Settings();
        var siblingPrices = await _db.SiblingPrices.Where(x => !x.IsDeleted).ToListAsync();

        var phone = dto.Phone.Trim();
        var customer = await _db.Customers.Include(c => c.Children).FirstOrDefaultAsync(c => c.Phone == phone && !c.IsDeleted);
        if (customer == null)
        {
            var nameParts = dto.ChildName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var derivedCustomerName = nameParts.Length > 1 ? nameParts[1] : nameParts[0];
            customer = new Customer { Phone = phone, Name = string.IsNullOrWhiteSpace(dto.CustomerName) ? derivedCustomerName : dto.CustomerName.Trim() };
            _db.Customers.Add(customer);
            await _db.SaveChangesAsync();
        }

        var child = customer.Children.FirstOrDefault(ch => ch.Name == dto.ChildName.Trim() && !ch.IsDeleted);
        if (child == null)
        {
            child = new Child { CustomerId = customer.Id, Name = dto.ChildName.Trim(), Age = dto.ChildAge };
            _db.Children.Add(child);
            await _db.SaveChangesAsync();
        }
        else
        {
            child.Age = dto.ChildAge;
            child.UpdatedAt = DateTime.UtcNow;
        }

        var package = (DurationPackage)dto.Package;
        var siblingsCount = dto.SiblingsCount >= 2 ? dto.SiblingsCount : 0;
        var mode = siblingsCount >= 2 ? PricingMode.Siblings : PricingMode.Individual;

        Membership? membership = null;
        bool usedMembership = false;
        decimal packageAmount = 0;

        if (dto.UseMembership && dto.MembershipId.HasValue)
        {
            membership = await _db.Memberships.Include(m => m.MembershipType)
                .FirstOrDefaultAsync(m => m.Id == dto.MembershipId && m.IsActive && !m.IsDeleted);
            if (membership == null) throw new InvalidOperationException("العضوية غير موجودة");
            if (membership.EndDate.Date < DateTime.UtcNow.Date)
                throw new InvalidOperationException("العضوية منتهية — يجب التجديد أولاً");
            if (membership.CustomerId != customer.Id)
                throw new InvalidOperationException("العضوية لا تخص هذا العميل");

            // Membership is individual only
            if (mode == PricingMode.Siblings)
                throw new InvalidOperationException("العضوية للفرد فقط — لا تُطبّق على مجموعة أخوة");

            var needHours = _pricing.PackageToHours(package);
            if (membership.MembershipType.Kind == MembershipKind.HoursBalance)
            {
                if (package == DurationPackage.FullDay)
                    throw new InvalidOperationException("اليوم الكامل غير مدعوم على عضوية رصيد الساعات");
                if (membership.RemainingHours < needHours)
                    throw new InvalidOperationException($"رصيد الساعات غير كافٍ (المتبقي: {membership.RemainingHours})");
                membership.RemainingHours -= needHours;
                membership.UpdatedAt = DateTime.UtcNow;
                usedMembership = true;
                packageAmount = 0;
            }
            else // Unlimited monthly
            {
                usedMembership = true;
                packageAmount = 0;
            }
        }
        else
        {
            packageAmount = _pricing.GetPackagePrice(settings, siblingPrices, mode, siblingsCount, package);
        }

        var companionsAmount = _pricing.GetCompanionsAmount(settings, dto.CompanionsCount);
        var extraCompanions = Math.Max(0, dto.CompanionsCount - 2);
        var flexAmount = (settings.FlexibleFieldEnabled && dto.UseFlexibleField) ? settings.FlexibleFieldPrice : 0;
        var total = packageAmount + companionsAmount + flexAmount;

        var paidSum = dto.PaidCash + dto.PaidInstaPay + dto.PaidOther;
        if (!usedMembership && Math.Round(paidSum, 2) < Math.Round(total, 2))
            throw new InvalidOperationException($"المبلغ المدفوع ({paidSum}) أقل من المطلوب ({total})");

        var now = DateTime.UtcNow;
        var receipt = await NextReceiptAsync();
        var expected = _pricing.ExpectedCheckout(now, package, settings.ClosingTime);

        var visit = new Visit
        {
            ReceiptNumber = receipt,
            CustomerId = customer.Id,
            ChildId = child.Id,
            ChildName = child.Name,
            ChildAge = child.Age,
            SiblingNames = dto.Siblings == null ? null : JsonSerializer.Serialize(dto.Siblings.Select(x => x.Name).ToList()),
            SiblingAges = dto.Siblings == null ? null : JsonSerializer.Serialize(dto.Siblings.Select(x => x.Age).ToList()),
            CompanionsCount = dto.CompanionsCount,
            SiblingWristbands = dto.Siblings == null ? null : JsonSerializer.Serialize(
    dto.Siblings.Select(x => x.Wristband ?? "").ToList()),
                        ChildWristband = string.IsNullOrWhiteSpace(dto.ChildWristband) ? null : dto.ChildWristband.Trim(),
            CompanionWristbands = dto.CompanionWristbands == null || dto.CompanionWristbands.Count == 0
                ? null
                : string.Join(",", dto.CompanionWristbands.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim())),
            ExtraCompanionsCount = extraCompanions,
            PricingMode = mode,
            SiblingsCount = siblingsCount,
            Package = package,
            PackageHours = _pricing.PackageToHours(package),
            CheckInTime = now,
            ExpectedCheckOutTime = expected,
            Status = VisitStatus.Active,
            MembershipId = membership?.Id,
            UsedMembership = usedMembership,
            PackageAmount = packageAmount,
            CompanionsAmount = companionsAmount,
            FlexibleFieldAmount = flexAmount,
            FlexibleFieldLabel = settings.FlexibleFieldEnabled ? settings.FlexibleFieldLabel : null,
            TotalAmount = total,
            PaidCash = dto.PaidCash,
            PaidInstaPay = dto.PaidInstaPay,
            PaidOther = dto.PaidOther,
            InstaPayReference = dto.InstaPayReference,
            Notes = dto.Notes,
            CashierId = cashierId,
            ShiftId = shift.Id
        };
        _db.Visits.Add(visit);
        await _db.SaveChangesAsync();

        return new CheckInResultDto(visit.Id, visit.ReceiptNumber, visit.TotalAmount, visit.CheckInTime, visit.ExpectedCheckOutTime, visit.ReceiptNumber);
    }

    public async Task<List<ActiveVisitDto>> GetActiveAsync()
    {
        var list = await _db.Visits.Include(v => v.Customer)
            .Where(v => v.Status == VisitStatus.Active && !v.IsDeleted)
            .OrderBy(v => v.ExpectedCheckOutTime ?? DateTime.MaxValue).ThenBy(v => v.CheckInTime).ToListAsync();
        return list.Select(v => new ActiveVisitDto(
            v.Id, v.ReceiptNumber, v.ChildName, v.ChildAge, v.Customer.Phone,
            v.CheckInTime, PackageName(v.Package), v.CompanionsCount, v.SiblingsCount,
            (DateTime.UtcNow - v.CheckInTime).TotalMinutes, v.TotalAmount, v.ExpectedCheckOutTime,
            ChildNames(v), ChildAges(v), ChildNames(v).Count
        )).ToList();
    }

    public async Task<List<ActiveVisitDto>> SearchActiveReceiptAsync(string q)
    {
        q = (q ?? "").Trim();
        if (q.Length == 0) return new List<ActiveVisitDto>();
        var list = await _db.Visits.Include(v => v.Customer)
            .Where(v => v.Status == VisitStatus.Active && !v.IsDeleted && v.ReceiptNumber.Contains(q))
            .OrderByDescending(v => v.CheckInTime).Take(20).ToListAsync();
        return list.Select(v => new ActiveVisitDto(
            v.Id, v.ReceiptNumber, v.ChildName, v.ChildAge, v.Customer.Phone,
            v.CheckInTime, PackageName(v.Package), v.CompanionsCount, v.SiblingsCount,
            (DateTime.UtcNow - v.CheckInTime).TotalMinutes, v.TotalAmount, v.ExpectedCheckOutTime,
            ChildNames(v), ChildAges(v), ChildNames(v).Count
        )).ToList();
    }

    private static List<string> ChildNames(Visit visit)
    {
        var names = new List<string> { visit.ChildName };
        if (!string.IsNullOrWhiteSpace(visit.SiblingNames))
            names.AddRange(JsonSerializer.Deserialize<List<string>>(visit.SiblingNames) ?? new List<string>());
        return names;
    }

    private static List<int> ChildAges(Visit visit)
    {
        var ages = new List<int> { visit.ChildAge };
        if (!string.IsNullOrWhiteSpace(visit.SiblingAges))
            ages.AddRange(JsonSerializer.Deserialize<List<int>>(visit.SiblingAges) ?? new List<int>());
        while (ages.Count < ChildNames(visit).Count) ages.Add(0);
        return ages;
    }

    public async Task<CheckOutPreviewDto> PreviewCheckOutAsync(string receipt)
    {
        var visit = await _db.Visits.Include(v => v.Customer)
            .FirstOrDefaultAsync(v => v.ReceiptNumber == receipt.Trim() && v.Status == VisitStatus.Active && !v.IsDeleted)
            ?? throw new InvalidOperationException("الزيارة غير موجودة أو تم الخروج مسبقاً");

        var settings = await Settings();
        var siblingPrices = await _db.SiblingPrices.Where(x => !x.IsDeleted).ToListAsync();
        var now = DateTime.UtcNow;
        var (hours, amount) = _pricing.CalculateOverage(settings, siblingPrices, visit, now);

        return new CheckOutPreviewDto(
    visit.Id,
    visit.ReceiptNumber,
    visit.ChildName,
    visit.Customer.Phone,
    visit.CheckInTime,
    visit.ExpectedCheckOutTime,
    PackageName(visit.Package),
    visit.Package == DurationPackage.FullDay,
    hours,
    amount,
    visit.TotalAmount,
    amount,
    ChildNames(visit),
    ChildAges(visit)
);
    }

    public async Task<CheckOutResultDto> CheckOutAsync(CheckOutDto dto, int cashierId)
    {
        var visit = await _db.Visits
            .FirstOrDefaultAsync(v => v.ReceiptNumber == dto.ReceiptNumber.Trim() && v.Status == VisitStatus.Active && !v.IsDeleted)
            ?? throw new InvalidOperationException("الزيارة غير موجودة أو تم الخروج مسبقاً");

        await RequireOpenShift(cashierId);
        var settings = await Settings();
        var siblingPrices = await _db.SiblingPrices.Where(x => !x.IsDeleted).ToListAsync();
        var now = DateTime.UtcNow;
        var (hours, overage) = _pricing.CalculateOverage(settings, siblingPrices, visit, now);

        if (overage > 0)
        {
            var paid = dto.PaidCash + dto.PaidInstaPay + dto.PaidOther;
            if (Math.Round(paid, 2) < Math.Round(overage, 2))
                throw new InvalidOperationException($"مبلغ التجاوز المطلوب {overage} والمدفوع {paid}");
            visit.OverageAmount = overage;
            visit.PaidCash += dto.PaidCash;
            visit.PaidInstaPay += dto.PaidInstaPay;
            visit.PaidOther += dto.PaidOther;
            visit.TotalAmount += overage;
            if (!string.IsNullOrWhiteSpace(dto.InstaPayReference))
                visit.InstaPayReference = dto.InstaPayReference;
        }

        visit.CheckOutTime = now;
        visit.Status = VisitStatus.CheckedOut;
        visit.UpdatedAt = now;
        await _db.SaveChangesAsync();

        return new CheckOutResultDto(visit.Id, visit.ReceiptNumber, overage, visit.TotalAmount, overage > 0);
    }

    private async Task<string> NextReceiptAsync()
    {
        var prefix = "VIS-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-";
        var last = await _db.Visits.Where(v => v.ReceiptNumber.StartsWith(prefix))
            .OrderByDescending(v => v.ReceiptNumber).Select(v => v.ReceiptNumber).FirstOrDefaultAsync();
        int n = 1;
        if (last != null && last.Length > prefix.Length && int.TryParse(last[prefix.Length..], out var x)) n = x + 1;
        return prefix + n.ToString("D4");
    }

    private static string PackageName(DurationPackage p) => p switch
    {
        DurationPackage.OneHour => "ساعة",
        DurationPackage.TwoHours => "ساعتان",
        DurationPackage.ThreeHours => "3 ساعات",
        DurationPackage.FullDay => "يوم كامل",
        _ => p.ToString()
    };
        public async Task<object> GetReceiptAsync(string receiptNumber)
    {
        var visit = await _db.Visits.Include(v => v.Customer)
            .FirstOrDefaultAsync(v => v.ReceiptNumber == receiptNumber.Trim() && !v.IsDeleted)
            ?? throw new InvalidOperationException("الإيصال غير موجود");

        var settings = await Settings();
        var names = ChildNames(visit);
        var ages = ChildAges(visit);
        var wristbands = new List<string>();
        if (!string.IsNullOrWhiteSpace(visit.SiblingWristbands))
            wristbands = System.Text.Json.JsonSerializer.Deserialize<List<string>>(visit.SiblingWristbands) ?? new List<string>();

        // سوار الطفل الأول + أسورة الأخوة
        var childBands = new List<string> { visit.ChildWristband ?? "" };
        childBands.AddRange(wristbands);
        while (childBands.Count < names.Count) childBands.Add("");

        var hoursLabel = visit.Package switch
        {
            DurationPackage.OneHour => "1",
            DurationPackage.TwoHours => "2",
            DurationPackage.ThreeHours => "3",
            DurationPackage.FullDay => "يوم كامل",
            _ => ""
        };

        var pay = new List<string>();
        if (visit.PaidCash > 0) pay.Add("نقدي");
        if (visit.PaidInstaPay > 0) pay.Add("InstaPay");
        if (visit.PaidOther > 0) pay.Add("أخرى");

        return new
        {
            receiptNumber = visit.ReceiptNumber,
            phone = visit.Customer.Phone,
            centerName = settings.CenterName,
            centerPhone = settings.CenterPhone,
            logoPath = settings.LogoPath,
            checkInTime = visit.CheckInTime,
            checkOutTime = visit.ExpectedCheckOutTime,
            totalAmount = visit.TotalAmount,
            packageAmount = visit.PackageAmount,
            companionsCount = visit.CompanionsCount,
            companionsAmount = visit.CompanionsAmount,
            companionWristbands = visit.CompanionWristbands,
            flexibleLabel = visit.FlexibleFieldLabel,
            flexibleAmount = visit.FlexibleFieldAmount,
            hoursLabel,
            payText = pay.Count > 0 ? string.Join(" + ", pay) : "—",
            children = names.Select((n, i) => new
            {
                name = n,
                age = i < ages.Count ? ages[i] : 0,
                wristband = i < childBands.Count ? childBands[i] : ""
            }).ToList()
        };
    }
}
