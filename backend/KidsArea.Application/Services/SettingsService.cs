using KidsArea.Application.DTOs;
using KidsArea.Domain.Entities;
using KidsArea.Domain.Enums;
using KidsArea.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KidsArea.Application.Services;

public class SettingsService
{
    private readonly AppDbContext _db;
    public SettingsService(AppDbContext db) => _db = db;

    public async Task<SettingsDto> GetAsync()
    {
        var s = await _db.SystemSettings.FirstAsync(x => x.Id == 1);
        var siblings = await _db.SiblingPrices.Where(x => !x.IsDeleted)
            .Select(x => new SiblingPriceDto(x.SiblingsCount, x.DurationPackage, x.Price)).ToListAsync();
        var methods = await _db.PaymentMethods.Where(x => !x.IsDeleted).OrderBy(x => x.SortOrder)
            .Select(x => new PaymentMethodDto(x.Id, x.Name, x.Code, x.IsActive, x.SortOrder)).ToListAsync();
        return new SettingsDto(
            s.CenterName, s.CenterPhone, s.ClosingTime, s.LogoPath, s.LoginBackgroundPath, s.HomeBackgroundPath, s.IconTheme,
            s.GraceMinutes, s.Price1Hour, s.Price2Hours, s.Price3Hours, s.PriceFullDay, s.ExtraCompanionPrice,
            s.FlexibleFieldEnabled, s.FlexibleFieldLabel, s.FlexibleFieldPrice, s.QrOnReceipt, siblings, methods
        );
    }

    public async Task UpdateAsync(UpdateSettingsDto dto)
    {
        var s = await _db.SystemSettings.FirstAsync(x => x.Id == 1);
        s.CenterName = dto.CenterName; s.CenterPhone = dto.CenterPhone; s.ClosingTime = dto.ClosingTime;
        s.IconTheme = dto.IconTheme; s.GraceMinutes = dto.GraceMinutes;
        s.Price1Hour = dto.Price1Hour; s.Price2Hours = dto.Price2Hours;
        s.Price3Hours = dto.Price3Hours; s.PriceFullDay = dto.PriceFullDay;
        s.ExtraCompanionPrice = dto.ExtraCompanionPrice;
        s.FlexibleFieldEnabled = dto.FlexibleFieldEnabled; s.FlexibleFieldLabel = dto.FlexibleFieldLabel;
        s.FlexibleFieldPrice = dto.FlexibleFieldPrice; s.QrOnReceipt = dto.QrOnReceipt;
        s.UpdatedAt = DateTime.UtcNow;

        var old = await _db.SiblingPrices.Where(x => !x.IsDeleted).ToListAsync();
        foreach (var o in old) { o.IsDeleted = true; o.UpdatedAt = DateTime.UtcNow; }
        foreach (var sp in dto.SiblingPrices)
            _db.SiblingPrices.Add(new SiblingPrice { SiblingsCount = sp.SiblingsCount, DurationPackage = sp.DurationPackage, Price = sp.Price });
        await _db.SaveChangesAsync();
    }

    public async Task<List<UserDto>> UsersAsync() =>
        await _db.Users.Where(u => !u.IsDeleted)
            .Select(u => new UserDto(u.Id, u.Username, u.DisplayName, u.Role.ToString(), u.IsActive)).ToListAsync();

    public async Task CreateUserAsync(CreateUserDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Username == dto.Username.Trim() && !u.IsDeleted))
            throw new InvalidOperationException("اسم المستخدم مستخدم");
        var role = dto.Role.Equals("Owner", StringComparison.OrdinalIgnoreCase) ? UserRole.Owner : UserRole.Cashier;
        _db.Users.Add(new AppUser
        {
            Username = dto.Username.Trim(), DisplayName = dto.DisplayName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password), Role = role, IsActive = true
        });
        await _db.SaveChangesAsync();
    }

    public async Task AddPaymentMethodAsync(string name, string code)
    {
        var max = await _db.PaymentMethods.MaxAsync(x => (int?)x.SortOrder) ?? 0;
        _db.PaymentMethods.Add(new PaymentMethodDef { Name = name, Code = code, IsActive = true, SortOrder = max + 1 });
        await _db.SaveChangesAsync();
    }
}
