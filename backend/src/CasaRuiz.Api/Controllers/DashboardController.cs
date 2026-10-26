using CasaRuiz.Api.Configuracion;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaRuiz.Api.Controllers;

[ApiController]
[Authorize(Roles = Permisos.Dashboard)]
[Route("api/[controller]")]
public class DashboardController(DashboardService dashboard) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Get() => Ok(await dashboard.ObtenerAsync());
}
