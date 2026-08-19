using System.Text;
using KidsArea.Application.Services;
using KidsArea.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite("Data Source=kidsarea.db"));
builder.Services.AddScoped<PricingEngine>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<VisitService>();
builder.Services.AddScoped<ShiftService>();
builder.Services.AddScoped<SettingsService>();
builder.Services.AddScoped<MembershipAppService>();
builder.Services.AddScoped<PartyService>();
builder.Services.AddScoped<CustomerService>();

var key = builder.Configuration["Jwt:Key"] ?? "KidsAreaAppSecretKey_MustBe32CharsMin_X!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => {
        o.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "KidsArea",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "KidsAreaClient",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Kids Area API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { In = ParameterLocation.Header, Name = "Authorization", Type = SecuritySchemeType.ApiKey, Scheme = "Bearer" });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() } });
});
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.WebHost.UseUrls("http://0.0.0.0:5000");
var app = builder.Build();

// ensure wwwroot/uploads exists
var webRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRoot, "uploads"));
if (string.IsNullOrEmpty(app.Environment.WebRootPath))
    app.Environment.WebRootPath = webRoot;

await SeedData.InitAsync(app.Services);
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.UseCors();
app.UseStaticFiles(); // serve /uploads/*
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
