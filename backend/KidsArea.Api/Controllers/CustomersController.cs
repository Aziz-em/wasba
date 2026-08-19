using KidsArea.Application.DTOs;
using KidsArea.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace KidsArea.Api.Controllers;
[ApiController][Route("api/[controller]")][Authorize]
public class CustomersController : ControllerBase
{
    private readonly CustomerService _s;
    public CustomersController(CustomerService s) => _s = s;
    [HttpGet] public async Task<IActionResult> Search([FromQuery] string? q) => Ok(await _s.SearchAsync(q));
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto)
    {
        try { return Ok(await _s.CreateAsync(dto)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
    [HttpGet("phone/{phone}")] public async Task<IActionResult> ByPhone(string phone)
    {
        var c = await _s.GetByPhoneAsync(phone);
        return c == null ? NotFound() : Ok(c);
    }
}
