using KidsArea.Application.DTOs;
using KidsArea.Domain.Entities;
using KidsArea.Domain.Enums;
using KidsArea.Domain.Interfaces;
using KidsArea.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

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
        var shift = await _db.CashShifts.FirstOrDefaultAsync(s => s.CashierId == cashierId && s.Status == ShiftStatus.Open && !s.IsDeleted);
        if (shift == null) throw new InvalidOperationException("يجب فتح وردية أولاً");
        return shift;
    }

    public async Task<CheckInResultDto> CheckInAsync(CheckInDto dto, int cashierId)
    {
        if (string.IsNullOrWhiteSpace(dto.Phone)) throw new InvalidOperationException("رقم الجوال إلزامي");
        if (string.IsNullOrWhiteSpace(dto.ChildName)) throw new InvalidOperationException("اسم الطفل إلزامي");
        if (dto.ChildAge < 1) throw new InvalidOperationException("عمر الطفل إلزامي");

        var shift = await RequireOpenShift(cashierId);
        var settings = await Settings();
        var siblingPrices = await _db.SiblingPrices.Where(x => !x.IsDeleted).ToListAsync();

        var phone = dto.Phone.Trim();
        var customer = await _db.Customers.Include(c => c.Children).FirstOrDefaultAsync(c => c.Phone == phone && !c.IsDeleted);
        if (customer == null)
        {
            customer = new Customer { Phone = phone, Name = string.IsNullOrWhiteSpace(dto.CustomerName) ? phone : dto.CustomerName.Trim() };
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
            CompanionsCount = dto.CompanionsCount,
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
            .OrderByDescending(v => v.CheckInTime).ToListAsync();
        return list.Select(v => new ActiveVisitDto(
            v.Id, v.ReceiptNumber, v.ChildName, v.ChildAge, v.Customer.Phone,
            v.CheckInTime, PackageName(v.Package), v.CompanionsCount, v.SiblingsCount,
            (DateTime.UtcNow - v.CheckInTime).TotalMinutes, v.TotalAmount
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
            (DateTime.UtcNow - v.CheckInTime).TotalMinutes, v.TotalAmount
        )).ToList();
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
            visit.Id, visit.ReceiptNumber, visit.ChildName, visit.CheckInTime, visit.ExpectedCheckOutTime,
            PackageName(visit.Package), visit.Package == DurationPackage.FullDay,
            hours, amount, visit.TotalAmount, amount
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
}
