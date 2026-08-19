using KidsArea.Application.DTOs;
using KidsArea.Domain.Entities;
using KidsArea.Domain.Enums;
using KidsArea.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KidsArea.Application.Services;

public class ShiftService
{
    private readonly AppDbContext _db;
    public ShiftService(AppDbContext db) => _db = db;

    public async Task OpenAsync(OpenShiftDto dto, int cashierId)
    {
        var open = await _db.CashShifts.AnyAsync(s => s.CashierId == cashierId && s.Status == ShiftStatus.Open && !s.IsDeleted);
        if (open) throw new InvalidOperationException("لديك وردية مفتوحة بالفعل");
        _db.CashShifts.Add(new CashShift
        {
            CashierId = cashierId,
            OpenedAt = DateTime.UtcNow,
            OpeningBalance = dto.OpeningBalance,
            Status = ShiftStatus.Open
        });
        await _db.SaveChangesAsync();
    }

    public async Task<CashShift?> GetCurrentAsync(int cashierId) =>
        await _db.CashShifts.Include(s => s.Cashier)
            .FirstOrDefaultAsync(s => s.CashierId == cashierId && s.Status == ShiftStatus.Open && !s.IsDeleted);

    public async Task<DayReportDto> CloseAsync(CloseShiftDto dto, int cashierId)
    {
        var shift = await GetCurrentAsync(cashierId) ?? throw new InvalidOperationException("لا توجد وردية مفتوحة");
        var summary = await BuildTreasuryAsync(shift.Id, shift.OpeningBalance);
        shift.ClosedAt = DateTime.UtcNow;
        shift.ExpectedCash = summary.ExpectedCash;
        shift.ActualCash = dto.ActualCash;
        shift.Difference = dto.ActualCash - summary.ExpectedCash;
        shift.EmergencyNotes = dto.EmergencyNotes;
        shift.Status = ShiftStatus.Closed;
        shift.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await BuildReportAsync(shift);
    }

    public async Task<TreasurySummaryDto> TreasuryForCurrentAsync(int cashierId)
    {
        var shift = await GetCurrentAsync(cashierId) ?? throw new InvalidOperationException("لا توجد وردية مفتوحة");
        return await BuildTreasuryAsync(shift.Id, shift.OpeningBalance);
    }

    public async Task<List<CashShift>> ClosedShiftsAsync() =>
        await _db.CashShifts.Include(s => s.Cashier)
            .Where(s => s.Status == ShiftStatus.Closed && !s.IsDeleted)
            .OrderByDescending(s => s.ClosedAt).Take(60).ToListAsync();

    public async Task<DayReportDto> ReportForShiftAsync(int shiftId)
    {
        var shift = await _db.CashShifts.Include(s => s.Cashier).FirstOrDefaultAsync(s => s.Id == shiftId)
            ?? throw new InvalidOperationException("الوردية غير موجودة");
        return await BuildReportAsync(shift);
    }

    private async Task<TreasurySummaryDto> BuildTreasuryAsync(int shiftId, decimal opening)
    {
        var visits = await _db.Visits.Where(v => v.ShiftId == shiftId && !v.IsDeleted).ToListAsync();
        var memSales = await _db.MembershipSales.Where(m => m.ShiftId == shiftId && !m.IsDeleted).ToListAsync();
        var parties = await _db.PartySales.Where(p => p.ShiftId == shiftId && !p.IsDeleted).ToListAsync();

        decimal cash = visits.Sum(v => v.PaidCash) + memSales.Sum(m => m.PaidCash) + parties.Sum(p => p.PaidCash);
        decimal insta = visits.Sum(v => v.PaidInstaPay) + memSales.Sum(m => m.PaidInstaPay) + parties.Sum(p => p.PaidInstaPay);
        decimal other = visits.Sum(v => v.PaidOther) + memSales.Sum(m => m.PaidOther) + parties.Sum(p => p.PaidOther);

        return new TreasurySummaryDto(
            cash + insta + other, cash, insta, other,
            visits.Sum(v => v.PackageAmount + v.OverageAmount + v.CompanionsAmount + v.FlexibleFieldAmount),
            memSales.Sum(m => m.Amount), parties.Sum(p => p.Amount),
            visits.Sum(v => v.OverageAmount), visits.Sum(v => v.CompanionsAmount),
            opening, opening + cash
        );
    }

    private async Task<DayReportDto> BuildReportAsync(CashShift shift)
    {
        var settings = await _db.SystemSettings.FirstAsync(x => x.Id == 1);
        var visits = await _db.Visits.Where(v => v.ShiftId == shift.Id && !v.IsDeleted).ToListAsync();
        var memSales = await _db.MembershipSales.Include(m => m.Membership).ThenInclude(m => m.MembershipType)
            .Where(m => m.ShiftId == shift.Id && !m.IsDeleted).ToListAsync();
        var parties = await _db.PartySales.Where(p => p.ShiftId == shift.Id && !p.IsDeleted).ToListAsync();
        var summary = await BuildTreasuryAsync(shift.Id, shift.OpeningBalance);

        };

        var individual = new List<ReportLineDto>();
        foreach (var (pkg, label) in new[] {
            (DurationPackage.OneHour, "ساعة واحدة"), (DurationPackage.TwoHours, "ساعتان"),
            (DurationPackage.ThreeHours, "3 ساعات"), (DurationPackage.FullDay, "يوم كامل") })
        {
            var rows = visits.Where(v => v.PricingMode == PricingMode.Individual && v.Package == pkg && !v.UsedMembership).ToList();
            individual.Add(new ReportLineDto(label, rows.Count, rows.Sum(r => r.PackageAmount)));
        }

        var siblingGroups = visits.Where(v => v.PricingMode == PricingMode.Siblings)
            .GroupBy(v => new { v.SiblingsCount, v.Package })
            .Select(g => new ReportLineDto(
                $"أخوة {g.Key.SiblingsCount} × {Pkg(g.Key.Package)}",
                g.Count(), g.Sum(x => x.PackageAmount))).ToList();

        var partyLines = parties.Select(p => new ReportLineDto($"{p.CustomerName} ({p.ChildrenCount} أطفال)", 1, p.Amount)).ToList();
        var memLines = memSales.Select(m => new ReportLineDto(m.Membership.MembershipType.Name, 1, m.Amount)).ToList();
        var hoursUsed = visits.Where(v => v.UsedMembership && v.PackageHours > 0).Sum(v => v.PackageHours);

        return new DayReportDto(
            settings.CenterName, settings.CenterPhone, shift.OpenedAt.Date,
            shift.Cashier?.DisplayName ?? "", shift.OpenedAt, shift.ClosedAt ?? DateTime.UtcNow,
            summary, individual, siblingGroups,
            visits.Sum(v => v.CompanionsAmount), visits.Sum(v => v.OverageAmount),
            partyLines, memLines, hoursUsed,
            shift.OpeningBalance, shift.ExpectedCash, shift.ActualCash, shift.Difference, shift.EmergencyNotes
        );
    }

    private static string Pkg(DurationPackage p) => p switch
    {
        DurationPackage.OneHour => "ساعة", DurationPackage.TwoHours => "ساعتان",
        DurationPackage.ThreeHours => "3 ساعات", DurationPackage.FullDay => "يوم كامل", _ => ""
    };
}
