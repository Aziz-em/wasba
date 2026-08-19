using System.Security.Claims;
using KidsArea.Application.DTOs;
using KidsArea.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace KidsArea.Api.Controllers;
[ApiController][Route("api/[controller]")][Authorize]
public class MembershipsController : ControllerBase
{
    private readonly MembershipAppService _s;
    public MembershipsController(MembershipAppService s) => _s = s;
    int Uid => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet("types")] public async Task<IActionResult> Types() => Ok(await _s.TypesAsync());
    [HttpPost("types")] [Authorize(Roles = "Owner")]
    public async Task<IActionResult> CreateType([FromBody] MembershipTypeDto dto) => Ok(await _s.CreateTypeAsync(dto));
    [HttpGet] public async Task<IActionResult> List() => Ok(await _s.ListAsync());
    [HttpPost("sell")] public async Task<IActionResult> Sell([FromBody] SellMembershipDto dto)
    {
        try { return Ok(await _s.SellAsync(dto, Uid)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
