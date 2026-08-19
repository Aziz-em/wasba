namespace KidsArea.Domain.Entities;
/// <summary>Record of membership sale for treasury/report (links to Membership entity).</summary>
public class MembershipSale : BaseEntity
{
    public int MembershipId { get; set; }
    public Membership Membership { get; set; } = null!;
    public decimal Amount { get; set; }
    public decimal PaidCash { get; set; }
    public decimal PaidInstaPay { get; set; }
    public decimal PaidOther { get; set; }
    public string? InstaPayReference { get; set; }
    public int CashierId { get; set; }
    public int ShiftId { get; set; }
    public DateTime SaleTime { get; set; } = DateTime.UtcNow;
}
