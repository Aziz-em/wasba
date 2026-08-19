using KidsArea.Application.DTOs;
using KidsArea.Domain.Entities;
using KidsArea.Domain.Enums;
using KidsArea.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KidsArea.Application.Services;

public class MembershipAppService
{
    private readonly AppDbContext _db;
    public MembershipAppService(AppDbContext db) => _db = db;

    public async Task<List<MembershipTypeDto>> TypesAsync() =>
        await _db.MembershipTypes.Where(t => !t.IsDeleted)
            .Select(t => new MembershipTypeDto(t.Id, t.Name, t.Kind.ToString(), t.DurationDays, t.HoursBalance, t.Price, t.IsActive))
            .ToListAsync();

    public async Task<MembershipTypeDto> CreateTypeAsync(MembershipTypeDto dto)
    {
        var kind = Enum.Parse<MembershipKind>(dto.Kind);
        var t = new MembershipType { Name = dto.Name, Kind = kind, DurationDays = dto.DurationDays, HoursBalance = dto.HoursBalance, Price = dto.Price, IsActive = true };
        _db.MembershipTypes.Add(t);
        await _db.SaveChangesAsync();
        return dto with { Id = t.Id };
    }

    public async Task<MembershipDto> SellAsync(SellMembershipDto dto, int cashierId)
    {
        var shift = await _db.CashShifts.FirstOrDefaultAsync(s => s.CashierId == cashierId && s.Status == ShiftStatus.Open && !s.IsDeleted)
            ?? throw new InvalidOperationException("يجب فتح وردية أولاً");
        var type = await _db.MembershipTypes.FindAsync(dto.MembershipTypeId) ?? throw new InvalidOperationException("نوع العضوية غير موجود");
        var customer = await _db.Customers.FindAsync(dto.CustomerId) ?? throw new InvalidOperationException("العميل غير موجود");
        var paid = dto.PaidCash + dto.PaidInstaPay + dto.PaidOther;
        if (paid < type.Price) throw new InvalidOperationException("المبلغ المدفوع أقل من سعر العضوية");

        var mem = new Membership
        {
            CustomerId = customer.Id, ChildId = dto.ChildId, MembershipTypeId = type.Id,
            StartDate = DateTime.UtcNow.Date, EndDate = DateTime.UtcNow.Date.AddDays(type.DurationDays),
            RemainingHours = type.Kind == MembershipKind.HoursBalance ? (type.HoursBalance ?? 0) : 0,
            PaidAmount = paid, IsActive = true
        };
        _db.Memberships.Add(mem);
        await _db.SaveChangesAsync();

        _db.MembershipSales.Add(new MembershipSale
        {
            MembershipId = mem.Id, Amount = paid,
            PaidCash = dto.PaidCash, PaidInstaPay = dto.PaidInstaPay, PaidOther = dto.PaidOther,
            InstaPayReference = dto.InstaPayReference, CashierId = cashierId, ShiftId = shift.Id
        });
        await _db.SaveChangesAsync();

        return new MembershipDto(mem.Id, customer.Name, customer.Phone, type.Name, type.Kind.ToString(), mem.StartDate, mem.EndDate, mem.RemainingHours, true);
    }

    public async Task<List<MembershipDto>> ListAsync()
    {
        return await _db.Memberships.Include(m => m.Customer).Include(m => m.MembershipType)
            .Where(m => !m.IsDeleted).OrderByDescending(m => m.Id)
            .Select(m => new MembershipDto(m.Id, m.Customer.Name, m.Customer.Phone, m.MembershipType.Name,
                m.MembershipType.Kind.ToString(), m.StartDate, m.EndDate, m.RemainingHours, m.IsActive && m.EndDate >= DateTime.UtcNow.Date))
            .ToListAsync();
    }

    public async Task RenewAsync(int membershipId, SellMembershipDto dto, int cashierId)
    {
        var old = await _db.Memberships.Include(m => m.MembershipType).FirstOrDefaultAsync(m => m.Id == membershipId)
            ?? throw new InvalidOperationException("غير موجود");
        old.IsActive = false; old.UpdatedAt = DateTime.UtcNow;
        await SellAsync(new SellMembershipDto(old.CustomerId, old.ChildId, old.MembershipTypeId, dto.PaidCash, dto.PaidInstaPay, dto.PaidOther, dto.InstaPayReference), cashierId);
    }
}
