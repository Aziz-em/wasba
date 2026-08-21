using KidsArea.Application.DTOs;
using KidsArea.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace KidsArea.Api.Controllers;
[ApiController][Route("api/[controller]")][Authorize]
public class SettingsController : ControllerBase
{
    private readonly SettingsService _s;
    public SettingsController(SettingsService s) => _s = s;
    [HttpGet] public async Task<IActionResult> Get() => Ok(await _s.GetAsync());
    [HttpPut] [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Update([FromBody] UpdateSettingsDto dto) { await _s.UpdateAsync(dto); return Ok(new { message = "تم الحفظ" }); }
    [HttpGet("users")] [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Users() => Ok(await _s.UsersAsync());
    [HttpPost("users")] [Authorize(Roles = "Owner")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        try { await _s.CreateUserAsync(dto); return Ok(new { message = "تم إنشاء المستخدم" }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
    [HttpPost("payment-methods")] [Authorize(Roles = "Owner")]
    public async Task<IActionResult> AddPay([FromBody] PaymentMethodDto dto)
    {
        await _s.AddPaymentMethodAsync(dto.Name, dto.Code);
        return Ok(new { message = "تمت الإضافة" });
    }
        [HttpPost("users/{id:int}/toggle")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> ToggleUser(int id)
    {
        try
        {
            await _s.ToggleUserAsync(id);
            return Ok(new { message = "تم" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
