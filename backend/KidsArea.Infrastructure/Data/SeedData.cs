using KidsArea.Domain.Entities;
using KidsArea.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace KidsArea.Infrastructure.Data;

public static class SeedData
{
    public static async Task InitAsync(IServiceProvider sp)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
        await EnsureExtraColumnsAsync(db);
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Customers_Phone ON Customers (Phone)");
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Visits_CheckInTime ON Visits (CheckInTime)");
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Visits_CustomerId ON Visits (CustomerId)");
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_CashShifts_ClosedAt ON CashShifts (ClosedAt)");
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_PartySales_SaleTime ON PartySales (SaleTime)");
        if (await db.Users.AnyAsync()) return;

        db.Users.Add(new AppUser
        {
            Username = "owner", DisplayName = "المالك",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Owner@123"),
            Role = UserRole.Owner, IsActive = true
        });
        db.Users.Add(new AppUser
        {
            Username = "cashier", DisplayName = "كاشير",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Cashier@123"),
            Role = UserRole.Cashier, IsActive = true
        });

        db.SystemSettings.Add(new SystemSettings
        {
            Id = 1,
            CenterName = "Kids Area",
            CenterPhone = "01000000000",
            ClosingTime = "23:00",
            GraceMinutes = 15,
            Price1Hour = 50,
            Price2Hours = 90,
            Price3Hours = 120,
            Price4Hours = 150,
            PriceFullDay = 200,
            ExtraCompanionPrice = 15,
            FlexibleFieldEnabled = false,
            FlexibleFieldLabel = "إضافة",
            FlexibleFieldPrice = 0,
            QrOnReceipt = true,
            IconTheme = "classic"
        });

        foreach (var count in new[] { 2, 3, 4 })
        {
            db.SiblingPrices.Add(new SiblingPrice { SiblingsCount = count, DurationPackage = 1, Price = 40 + count * 10 });
            db.SiblingPrices.Add(new SiblingPrice { SiblingsCount = count, DurationPackage = 2, Price = 70 + count * 15 });
            db.SiblingPrices.Add(new SiblingPrice { SiblingsCount = count, DurationPackage = 3, Price = 100 + count * 15 });
            db.SiblingPrices.Add(new SiblingPrice { SiblingsCount = count, DurationPackage = 5, Price = 120 + count * 18 });
            db.SiblingPrices.Add(new SiblingPrice { SiblingsCount = count, DurationPackage = 4, Price = 150 + count * 20 });
        }

        db.PaymentMethods.AddRange(
            new PaymentMethodDef { Name = "نقدي", Code = "cash", IsActive = true, SortOrder = 1 },
            new PaymentMethodDef { Name = "InstaPay", Code = "instapay", IsActive = true, SortOrder = 2 }
        );

        db.MembershipTypes.AddRange(
            new MembershipType { Name = "شهر مفتوح", Kind = MembershipKind.UnlimitedMonthly, DurationDays = 30, Price = 500 },
            new MembershipType { Name = "10 ساعات", Kind = MembershipKind.HoursBalance, DurationDays = 30, HoursBalance = 10, Price = 350 }
        );

        await db.SaveChangesAsync();
    }

    private static async Task EnsureExtraColumnsAsync(AppDbContext db)
    {
        try { await db.Database.ExecuteSqlRawAsync("ALTER TABLE Visits ADD COLUMN SiblingNames TEXT"); } catch { }
        try { await db.Database.ExecuteSqlRawAsync("ALTER TABLE Visits ADD COLUMN SiblingAges TEXT"); } catch { }
        try { await db.Database.ExecuteSqlRawAsync("ALTER TABLE Visits ADD COLUMN SiblingWristbands TEXT"); } catch { }
        try { await db.Database.ExecuteSqlRawAsync("ALTER TABLE Visits ADD COLUMN ChildWristband TEXT"); } catch { }
        try { await db.Database.ExecuteSqlRawAsync("ALTER TABLE Visits ADD COLUMN CompanionWristbands TEXT"); } catch { }
        try { await db.Database.ExecuteSqlRawAsync("ALTER TABLE SystemSettings ADD COLUMN Price4Hours REAL NOT NULL DEFAULT 0"); } catch { }
    }
}