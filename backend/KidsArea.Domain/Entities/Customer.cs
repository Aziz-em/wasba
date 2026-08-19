namespace KidsArea.Domain.Entities;
public class Customer : BaseEntity
{
    public string Phone { get; set; } = ""; // unique business key
    public string Name { get; set; } = "";
    public string? Notes { get; set; }
    public ICollection<Child> Children { get; set; } = new List<Child>();
    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
}
