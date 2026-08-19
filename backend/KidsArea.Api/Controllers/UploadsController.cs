using KidsArea.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KidsArea.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Owner")]
public class UploadsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public UploadsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    /// <summary>
    /// type = logo | loginBg | homeBg
    /// </summary>
    [HttpPost("{type}")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> Upload(string type, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "اختر ملف صورة" });

        var allowed = new[] { ".png", ".jpg", ".jpeg", ".webp", ".gif" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest(new { message = "صيغة غير مدعومة (png/jpg/webp)" });

        type = type.ToLowerInvariant();
        if (type is not ("logo" or "loginbg" or "homebg"))
            return BadRequest(new { message = "نوع غير معروف" });

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var dir = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(dir);

        var name = $"{type}_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";
        var path = Path.Combine(dir, name);
        await using (var stream = System.IO.File.Create(path))
            await file.CopyToAsync(stream);

        var publicPath = $"/uploads/{name}";
        var s = await _db.SystemSettings.FirstAsync(x => x.Id == 1);
        if (type == "logo") s.LogoPath = publicPath;
        else if (type == "loginbg") s.LoginBackgroundPath = publicPath;
        else s.HomeBackgroundPath = publicPath;
        s.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { path = publicPath, message = "تم الرفع" });
    }

    [HttpDelete("{type}")]
    public async Task<IActionResult> Clear(string type)
    {
        var s = await _db.SystemSettings.FirstAsync(x => x.Id == 1);
        type = type.ToLowerInvariant();
        if (type == "logo") s.LogoPath = null;
        else if (type == "loginbg") s.LoginBackgroundPath = null;
        else if (type == "homebg") s.HomeBackgroundPath = null;
        else return BadRequest(new { message = "نوع غير معروف" });
        s.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم الحذف" });
    }
}
