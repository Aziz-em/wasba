using KidsArea.Domain.Enums;
namespace KidsArea.Domain.Entities;
public class Membership : BaseEntity
{
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public int? ChildId { get; set; } // individual membership per child preferred
    public Child? Child { get; set; }
    public int MembershipTypeId { get; set; }
    public MembershipType MembershipType { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int RemainingHours { get; set; }
    public decimal PaidAmount { get; set; }
    public bool IsActive { get; set; } = true;
}
