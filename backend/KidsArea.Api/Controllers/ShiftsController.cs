using System.Security.Claims;
using KidsArea.Application.DTOs;
using KidsArea.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace KidsArea.Api.Controllers;
[ApiController][Route("api/[controller]")][Authorize]
public class ShiftsController : ControllerBase
{
    private readonly ShiftService _s;
    public ShiftsController(ShiftService s) => _s = s;
    int Uid => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("current")]
    public async Task<IActionResult> Current()
    {
        var sh = await _s.GetCurrentAsync(Uid);
        return sh == null ? Ok(new { open = false }) : Ok(new { open = true, sh.Id, sh.OpeningBalance, sh.OpenedAt });
    }

    [HttpPost("open")]
    public async Task<IActionResult> Open([FromBody] OpenShiftDto dto)
    {
        try { await _s.OpenAsync(dto, Uid); return Ok(new { message = "تم فتح الوردية" }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("close")]
    public async Task<IActionResult> Close([FromBody] CloseShiftDto dto)
    {
        try { return Ok(await _s.CloseAsync(dto, Uid)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("treasury")]
    public async Task<IActionResult> Treasury()
    {
        try { return Ok(await _s.TreasuryForCurrentAsync(Uid)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("closed")]
    public async Task<IActionResult> Closed([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int page = 1, [FromQuery] int pageSize = 25) {
        var result = await _s.ClosedShiftsAsync(from, to, page, pageSize);
        return Ok(new { items = result.Items, total = result.Total, page = result.Page, pageSize = result.PageSize, totalPages = (int)Math.Ceiling(result.Total / (double)result.PageSize) });
    }

    [HttpGet("report/{shiftId:int}")]
    public async Task<IActionResult> Report(int shiftId) => Ok(await _s.ReportForShiftAsync(shiftId));

    [HttpDelete("{shiftId:int}")][Authorize(Roles = "Owner")]
    public async Task<IActionResult> DeleteReport(int shiftId) => await _s.DeleteAsync(shiftId) ? NoContent() : NotFound();
}
