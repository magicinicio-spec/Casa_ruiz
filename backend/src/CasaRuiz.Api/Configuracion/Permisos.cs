namespace CasaRuiz.Api.Configuracion;

/// <summary>
/// Roles permitidos por grupo de acciones. Ver docs/REGLAS_NEGOCIO.md, sección de usuarios.
/// Superior tiene los mismos permisos que Administrador, salvo gestionar usuarios.
/// </summary>
public static class Permisos
{
    /// <summary>Gestión de usuarios: solo el administrador.</summary>
    public const string Administracion = "Administrador";

    /// <summary>Inventario, paquetes, clientes y pedidos (crear, editar, cancelar).</summary>
    public const string Operacion = "Administrador,Superior,Vendedor,VendedorRepartidor";

    /// <summary>Revisión de devoluciones, resolución de daños y cierre de pedidos.</summary>
    public const string Control = "Administrador,Superior";

    /// <summary>Cola de entregas, entregar y recoger.</summary>
    public const string Entregas = "Administrador,Superior,Repartidor,VendedorRepartidor";
}
