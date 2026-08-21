using KidsArea.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KidsArea.Api.Controllers;

[ApiController][Route("api/[controller]")][Authorize(Roles = "Owner")]
public class BackupsController : ControllerBase
{
    private readonly BackupService _backup;
    public BackupsController(BackupService backup) => _backup = backup;
    [HttpGet("create")]
    public async Task<IActionResult> Create()
    {
        var file = await _backup.CreateAsync();
        return PhysicalFile(file, "application/zip", Path.GetFileName(file));
    }
}