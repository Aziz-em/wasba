namespace KidsArea.Domain.Entities;
public class PartySale : BaseEntity
{
    public string CustomerName { get; set; } = "";
    public string Phone { get; set; } = "";
    public int ChildrenCount { get; set; }
    public decimal Amount { get; set; }
    public decimal PaidCash { get; set; }
    public decimal PaidInstaPay { get; set; }
    public decimal PaidOther { get; set; }
    public string? InstaPayReference { get; set; }
    public string? Notes { get; set; }
    public int CashierId { get; set; }
    public int ShiftId { get; set; }
    public DateTime SaleTime { get; set; } = DateTime.UtcNow;
}
