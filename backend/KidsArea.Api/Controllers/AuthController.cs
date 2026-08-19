using KidsArea.Application.DTOs;
using KidsArea.Application.Services;
using Microsoft.AspNetCore.Mvc;
namespace KidsArea.Api.Controllers;
[ApiController][Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _s;
    public AuthController(AuthService s) => _s = s;
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var r = await _s.LoginAsync(dto);
        return r == null ? Unauthorized(new { message = "بيانات الدخول غير صحيحة" }) : Ok(r);
    }
}
