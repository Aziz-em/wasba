using KidsArea.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KidsArea.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _db;
    public PublicController(AppDbContext db) => _db = db;

    [HttpGet("branding")]
    public async Task<IActionResult> Branding()
    {
        var s = await _db.SystemSettings.AsNoTracking().FirstAsync(x => x.Id == 1);
        return Ok(new {
            centerName = s.CenterName,
            centerPhone = s.CenterPhone,
            logoPath = s.LogoPath,
            loginBackgroundPath = s.LoginBackgroundPath,
            homeBackgroundPath = s.HomeBackgroundPath,
            iconTheme = s.IconTheme
        });
    }
}
