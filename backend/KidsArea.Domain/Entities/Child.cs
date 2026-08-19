namespace KidsArea.Domain.Entities;
public class Child : BaseEntity
{
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public string Name { get; set; } = "";
    public int Age { get; set; }
}
