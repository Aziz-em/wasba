using KidsArea.Domain.Enums;
namespace KidsArea.Domain.Entities;
public class MembershipType : BaseEntity
{
    public string Name { get; set; } = "";
    public MembershipKind Kind { get; set; }
    public int DurationDays { get; set; } = 30;
    public int? HoursBalance { get; set; } // for HoursBalance kind
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
}
