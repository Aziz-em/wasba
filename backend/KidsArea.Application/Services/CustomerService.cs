using KidsArea.Application.DTOs;
using KidsArea.Domain.Entities;
using KidsArea.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KidsArea.Application.Services;

public class CustomerService
{
    private readonly AppDbContext _db;
    public CustomerService(AppDbContext db) => _db = db;

    public async Task<CustomerPageDto> SearchAsync(string? q, int page = 1, int pageSize = 25)
    {
        q = (q ?? "").Trim();
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _db.Customers.Include(c => c.Children).Where(c => !c.IsDeleted);
        if (q.Length > 0) query = query.Where(c => c.Phone.Contains(q) || c.Name.Contains(q));
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(c => c.Id).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(c => new CustomerDto(
                c.Id,
                c.Phone,
                c.Name,
                c.Children.Count(ch => !ch.IsDeleted),
                c.Children.Where(ch => !ch.IsDeleted).Select(ch => ch.Name).ToList(),
                _db.Visits.Count(v => v.CustomerId == c.Id && !v.IsDeleted),
                _db.Visits.Where(v => v.CustomerId == c.Id && !v.IsDeleted).Max(v => (DateTime?)v.CheckInTime),
                c.Notes
            )).ToListAsync();
        return new CustomerPageDto(items, page, pageSize, total, (int)Math.Ceiling(total / (double)pageSize));
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerDto dto)
    {
        if (await _db.Customers.AnyAsync(c => c.Phone == dto.Phone.Trim() && !c.IsDeleted))
            throw new InvalidOperationException("رقم الجوال مسجّل مسبقاً");
        var c = new Customer { Phone = dto.Phone.Trim(), Name = dto.Name.Trim() };
        _db.Customers.Add(c);
        await _db.SaveChangesAsync();
        return new CustomerDto(c.Id, c.Phone, c.Name, 0, new List<string>(), 0, null, c.Notes);
    }

    public async Task<CustomerDto?> UpdateNotesAsync(int id, string? notes)
    {
        var customer = await _db.Customers.Include(c => c.Children).FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        if (customer == null) return null;
        customer.Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
        customer.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        var visits = _db.Visits.Where(v => v.CustomerId == id && !v.IsDeleted);
        return new CustomerDto(customer.Id, customer.Phone, customer.Name,
            customer.Children.Count(ch => !ch.IsDeleted), customer.Children.Where(ch => !ch.IsDeleted).Select(ch => ch.Name).ToList(), await visits.CountAsync(),
            await visits.MaxAsync(v => (DateTime?)v.CheckInTime), customer.Notes);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var customer = await _db.Customers.Include(c => c.Children).FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        if (customer == null) return false;
        customer.IsDeleted = true;
        customer.UpdatedAt = DateTime.UtcNow;
        foreach (var child in customer.Children.Where(child => !child.IsDeleted))
        {
            child.IsDeleted = true;
            child.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<Customer?> GetByPhoneAsync(string phone) =>
        await _db.Customers.Include(c => c.Children).Include(c => c.Memberships).ThenInclude(m => m.MembershipType)
            .FirstOrDefaultAsync(c => c.Phone == phone.Trim() && !c.IsDeleted);
    public async Task<object> GetVisitsAsync(int customerId)
    {
        var list = await _db.Visits.AsNoTracking()
            .Where(v => v.CustomerId == customerId && !v.IsDeleted)
            .OrderByDescending(v => v.CheckInTime)
            .Select(v => new {
                v.Id,
                v.ReceiptNumber,
                v.ChildName,
                v.ChildAge,
                v.CheckInTime,
                v.CheckOutTime,
                v.TotalAmount,
                v.PaidCash,
                v.PaidInstaPay,
                Status = v.Status.ToString(),
                Package = v.Package.ToString()
            }).ToListAsync();
        return list;
    }
}
