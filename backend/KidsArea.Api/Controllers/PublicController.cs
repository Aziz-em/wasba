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
[HttpGet("image")]
public IActionResult Image([FromQuery] string path, [FromServices] IWebHostEnvironment env)
{
    if (string.IsNullOrWhiteSpace(path) || !path.StartsWith("/uploads/"))
        return NotFound();

    var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
    var full = Path.Combine(webRoot, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
    if (!System.IO.File.Exists(full)) return NotFound();

    var ext = Path.GetExtension(full).ToLowerInvariant();
    var contentType = ext switch
    {
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".webp" => "image/webp",
        ".gif" => "image/gif",
        _ => "application/octet-stream"
    };
    return PhysicalFile(full, contentType);
}
    }
