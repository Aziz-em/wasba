using KidsArea.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace KidsArea.Infrastructure.Data;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Child> Children => Set<Child>();
    public DbSet<Visit> Visits => Set<Visit>();
    public DbSet<MembershipType> MembershipTypes => Set<MembershipType>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<MembershipSale> MembershipSales => Set<MembershipSale>();
    public DbSet<PartySale> PartySales => Set<PartySale>();
    public DbSet<CashShift> CashShifts => Set<CashShift>();
    public DbSet<SystemSettings> SystemSettings => Set<SystemSettings>();
    public DbSet<SiblingPrice> SiblingPrices => Set<SiblingPrice>();
    public DbSet<PaymentMethodDef> PaymentMethods => Set<PaymentMethodDef>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Customer>().HasIndex(x => x.Phone);
        mb.Entity<Visit>().HasIndex(x => x.ReceiptNumber).IsUnique();
        mb.Entity<AppUser>().HasIndex(x => x.Username).IsUnique();
        mb.Entity<Customer>().HasMany(c => c.Children).WithOne(ch => ch.Customer).HasForeignKey(ch => ch.CustomerId);
        mb.Entity<Customer>().HasMany(c => c.Memberships).WithOne(m => m.Customer).HasForeignKey(m => m.CustomerId);
    }
}
