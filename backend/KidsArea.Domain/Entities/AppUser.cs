using KidsArea.Domain.Enums;
namespace KidsArea.Domain.Entities;
public class AppUser : BaseEntity
{
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
}
