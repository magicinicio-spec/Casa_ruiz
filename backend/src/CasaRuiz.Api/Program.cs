using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using CasaRuiz.Api.Configuracion;
using CasaRuiz.Api.Data;
using CasaRuiz.Api.Models;
using CasaRuiz.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// La clave de los tokens (Jwt__Key) es obligatoria. Si falta o es corta, la API no arranca.
builder.Services.AddOptions<JwtOpciones>()
    .Bind(builder.Configuration.GetSection(JwtOpciones.Seccion))
    .Validate(o => !string.IsNullOrWhiteSpace(o.Key) && o.Key.Length >= 32,
        "Define Jwt__Key con al menos 32 caracteres.")
    .ValidateOnStart();

var jwt = builder.Configuration.GetSection(JwtOpciones.Seccion).Get<JwtOpciones>()!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name,
        };

        // Un usuario desactivado pierde el acceso de inmediato, aunque su token siga vigente.
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var usuarioId = int.Parse(context.Principal!.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();

                var activo = await db.Usuarios.AnyAsync(u => u.Id == usuarioId && u.Activo);
                if (!activo)
                {
                    context.Fail("La cuenta está inactiva o no existe.");
                }
            },
        };
    });

// Todas las rutas requieren sesión, salvo las marcadas con [AllowAnonymous] (el inicio de sesión).
builder.Services.AddAuthorization(options =>
    options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

builder.Services.AddSingleton<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UsuarioService>();
builder.Services.AddScoped<PedidoService>();
builder.Services.AddScoped<CotizacionService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<ReportesService>();
builder.Services.AddScoped<CasaRuiz.Api.Exportacion.ExportadorReportes>();

// Orígenes permitidos para la pantalla de React, por ejemplo http://192.168.1.10:3000.
var origenes = builder.Configuration.GetSection("Cors:OrigenesPermitidos").Get<string[]>() ?? [];
if (origenes.Length > 0)
{
    builder.Services.AddCors(options => options.AddPolicy("frontend", policy =>
        policy.WithOrigins(origenes).AllowAnyHeader().AllowAnyMethod()));
}

builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

CasaRuiz.Api.Exportacion.ConfiguracionPdf.Configurar();

var app = builder.Build();

// Aplica las migraciones pendientes y crea el primer administrador si no hay usuarios (PostgreSQL en Docker).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Usuario>>();
    await AdministradorInicial.AsegurarAsync(db, hasher, app.Configuration);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
}

app.UseHttpsRedirection();

if (origenes.Length > 0)
{
    app.UseCors("frontend");
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
