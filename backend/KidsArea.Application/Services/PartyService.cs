using KidsArea.Application.DTOs;
using KidsArea.Domain.Entities;
using KidsArea.Domain.Enums;
using KidsArea.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KidsArea.Application.Services;

public class PartyService
{
    private readonly AppDbContext _db;
    public PartyService(AppDbContext db) => _db = db;

    public async Task<object> CreateAsync(PartyDto dto, int cashierId)
    {
        var shift = await _db.CashShifts.FirstOrDefaultAsync(s => s.CashierId == cashierId && s.Status == ShiftStatus.Open && !s.IsDeleted)
            ?? throw new InvalidOperationException("يجب فتح وردية أولاً");
        var paid = dto.PaidCash + dto.PaidInstaPay + dto.PaidOther;
        if (paid < dto.Amount) throw new InvalidOperationException("المبلغ المدفوع أقل من قيمة الحفلة");
        var p = new PartySale
        {
            CustomerName = dto.CustomerName, Phone = dto.Phone, ChildrenCount = dto.ChildrenCount,
            Amount = dto.Amount, PaidCash = dto.PaidCash, PaidInstaPay = dto.PaidInstaPay, PaidOther = dto.PaidOther,
            InstaPayReference = dto.InstaPayReference, Notes = dto.Notes, CashierId = cashierId, ShiftId = shift.Id
        };
        _db.PartySales.Add(p);
        await _db.SaveChangesAsync();
        return new { p.Id, p.Amount };
    }

    public async Task<List<PartySale>> TodayAsync(int shiftId) =>
        await _db.PartySales.Where(p => p.ShiftId == shiftId && !p.IsDeleted).OrderByDescending(p => p.SaleTime).ToListAsync();
}
