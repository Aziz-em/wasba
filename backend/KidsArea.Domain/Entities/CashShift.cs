using KidsArea.Domain.Enums;
namespace KidsArea.Domain.Entities;
public class CashShift : BaseEntity
{
    public int CashierId { get; set; }
    public AppUser Cashier { get; set; } = null!;
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal ExpectedCash { get; set; }
    public decimal ActualCash { get; set; }
    public decimal Difference { get; set; }
    public string? EmergencyNotes { get; set; }
    public ShiftStatus Status { get; set; } = ShiftStatus.Open;
}
