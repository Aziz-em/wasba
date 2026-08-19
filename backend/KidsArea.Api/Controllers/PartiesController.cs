using System.Security.Claims;
using KidsArea.Application.DTOs;
using KidsArea.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace KidsArea.Api.Controllers;
[ApiController][Route("api/[controller]")][Authorize]
public class PartiesController : ControllerBase
{
    private readonly PartyService _s;
    public PartiesController(PartyService s) => _s = s;
    int Uid => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpPost] public async Task<IActionResult> Create([FromBody] PartyDto dto)
    {
        try { return Ok(await _s.CreateAsync(dto, Uid)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
