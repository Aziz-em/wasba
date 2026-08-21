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
    [HttpGet] public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 25) => Ok(await _s.SearchAsync(q, page, pageSize));
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto)
    {
        try { return Ok(await _s.CreateAsync(dto)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
    [HttpPut("{id}/notes")] public async Task<IActionResult> UpdateNotes(int id, [FromBody] UpdateCustomerNotesDto dto)
    {
        var customer = await _s.UpdateNotesAsync(id, dto.Notes);
        return customer == null ? NotFound() : Ok(customer);
    }
    [HttpDelete("{id}")][Authorize(Roles = "Owner")]
    public async Task<IActionResult> Delete(int id) => await _s.DeleteAsync(id) ? NoContent() : NotFound();
    [HttpGet("phone/{phone}")] public async Task<IActionResult> ByPhone(string phone)
    {
        var c = await _s.GetByPhoneAsync(phone);
        return c == null ? NotFound() : Ok(c);
    }
}
