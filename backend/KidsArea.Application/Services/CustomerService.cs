using KidsArea.Application.DTOs;
using KidsArea.Domain.Entities;
using KidsArea.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KidsArea.Application.Services;

public class CustomerService
{
    private readonly AppDbContext _db;
    public CustomerService(AppDbContext db) => _db = db;

    public async Task<List<CustomerDto>> SearchAsync(string? q)
    {
        q = (q ?? "").Trim();
        var query = _db.Customers.Include(c => c.Children).Where(c => !c.IsDeleted);
        if (q.Length > 0) query = query.Where(c => c.Phone.Contains(q) || c.Name.Contains(q));
        return await query.OrderByDescending(c => c.Id).Take(50)
            .Select(c => new CustomerDto(c.Id, c.Phone, c.Name, c.Children.Count(ch => !ch.IsDeleted))).ToListAsync();
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerDto dto)
    {
        if (await _db.Customers.AnyAsync(c => c.Phone == dto.Phone.Trim() && !c.IsDeleted))
            throw new InvalidOperationException("رقم الجوال مسجّل مسبقاً");
        var c = new Customer { Phone = dto.Phone.Trim(), Name = dto.Name.Trim() };
        _db.Customers.Add(c);
        await _db.SaveChangesAsync();
        return new CustomerDto(c.Id, c.Phone, c.Name, 0);
    }

    public async Task<Customer?> GetByPhoneAsync(string phone) =>
        await _db.Customers.Include(c => c.Children).Include(c => c.Memberships).ThenInclude(m => m.MembershipType)
            .FirstOrDefaultAsync(c => c.Phone == phone.Trim() && !c.IsDeleted);
}
