using KidsArea.Domain.Enums;

namespace KidsArea.Domain.Entities;

public class Visit : BaseEntity
{
    public string ReceiptNumber { get; set; } = "";
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public int? ChildId { get; set; }
    public Child? Child { get; set; }
    public string ChildName { get; set; } = "";
    public int ChildAge { get; set; }
    public string? SiblingNames { get; set; }
    public string? SiblingAges { get; set; }
    public string? SiblingWristbands { get; set; }
    public string? ChildWristband { get; set; }
    public string? CompanionWristbands { get; set; }
    public int CompanionsCount { get; set; }
    public int ExtraCompanionsCount { get; set; }
    public PricingMode PricingMode { get; set; }
    public int SiblingsCount { get; set; }
    public DurationPackage Package { get; set; }
    public int PackageHours { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime? ExpectedCheckOutTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public VisitStatus Status { get; set; } = VisitStatus.Active;
    public int? MembershipId { get; set; }
    public Membership? Membership { get; set; }
    public bool UsedMembership { get; set; }
    public decimal PackageAmount { get; set; }
    public decimal CompanionsAmount { get; set; }
    public decimal FlexibleFieldAmount { get; set; }
    public decimal OverageAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidCash { get; set; }
    public decimal PaidInstaPay { get; set; }
    public decimal PaidOther { get; set; }
    public string? InstaPayReference { get; set; }
    public string? FlexibleFieldLabel { get; set; }
    public string? Notes { get; set; }
    public int CashierId { get; set; }
    public int ShiftId { get; set; }
}