using System.Security.Claims;
using KidsArea.Application.DTOs;
using KidsArea.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace KidsArea.Api.Controllers;
[ApiController][Route("api/[controller]")][Authorize]
public class VisitsController : ControllerBase
{
    private readonly VisitService _s;
    public VisitsController(VisitService s) => _s = s;
    int Uid => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("checkin")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
    {
        try { return Ok(await _s.CheckInAsync(dto, Uid)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("active")]
    public async Task<IActionResult> Active() => Ok(await _s.GetActiveAsync());

    [HttpGet("active/search")]
    public async Task<IActionResult> Search([FromQuery] string q) => Ok(await _s.SearchActiveReceiptAsync(q ?? ""));

    [HttpGet("checkout/preview")]
    public async Task<IActionResult> Preview([FromQuery] string receipt)
    {
        try { return Ok(await _s.PreviewCheckOutAsync(receipt)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CheckOut([FromBody] CheckOutDto dto)
    {
        try { return Ok(await _s.CheckOutAsync(dto, Uid)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
