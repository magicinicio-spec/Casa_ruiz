import { useState } from "react";
import type { RolUsuario, Sesion } from "./api";
import Clientes from "./Clientes";
import Dashboard from "./Dashboard";
import Entregas from "./Entregas";
import Inventario from "./Inventario";
import Menu, { type GrupoMenu, type Seccion } from "./Menu";
import Notificaciones from "./Notificaciones";
import Paquetes from "./Paquetes";
import Pedidos from "./Pedidos";
import Reportes from "./Reportes";
import { rolesControl, rolesOperacion } from "./recursos";
import Usuarios from "./Usuarios";

interface Props {
  sesion: Sesion;
  onSalir: () => void;
}

const nombresDeRol: Record<RolUsuario, string> = {
  Administrador: "Administrador",
  Superior: "Superior",
  Vendedor: "Vendedor",
  Repartidor: "Repartidor",
  VendedorRepartidor: "Vendedor y repartidor",
};

// Grupos del menú y secciones visibles por rol. Ver docs/REGLAS_NEGOCIO.md, sección de usuarios.
function gruposDe(rol: RolUsuario): GrupoMenu[] {
  const operacion = rolesOperacion.includes(rol);
  const entregas = ["Administrador", "Superior", "Repartidor", "VendedorRepartidor"].includes(rol);

  const grupos: GrupoMenu[] = [
    {
      titulo: "Operación",
      items: [
        ...(operacion ? [{ id: "pedidos" as Seccion, nombre: "Pedidos" }] : []),
        ...(entregas ? [{ id: "entregas" as Seccion, nombre: "Entregas" }] : []),
        ...(operacion ? [{ id: "clientes" as Seccion, nombre: "Clientes" }] : []),
      ],
    },
    {
      titulo: "Catálogo",
      items: operacion
        ? [
            { id: "inventario" as Seccion, nombre: "Inventario" },
            { id: "paquetes" as Seccion, nombre: "Paquetes" },
          ]
        : [],
    },
    {
      titulo: "Consulta",
      items: operacion
        ? [
            { id: "dashboard" as Seccion, nombre: "Dashboard" },
            { id: "reportes" as Seccion, nombre: "Reportes" },
          ]
        : [],
    },
    {
      titulo: "Administración",
      items: rol === "Administrador" ? [{ id: "usuarios" as Seccion, nombre: "Usuarios" }] : [],
    },
  ];

  return grupos.filter((g) => g.items.length > 0);
}

export default function Inicio({ sesion, onSalir }: Props) {
  const { usuario, token } = { usuario: sesion.usuario, token: sesion.token };
  const grupos = gruposDe(usuario.rol);
  const [seccion, setSeccion] = useState<Seccion>(grupos[0].items[0].id);
  const puedeOperar = rolesOperacion.includes(usuario.rol);
  const puedeControlar = rolesControl.includes(usuario.rol);

  return (
    <div className="pagina">
      <Menu
        grupos={grupos}
        seccion={seccion}
        onSeccion={setSeccion}
        nombreUsuario={usuario.nombreCompleto}
        rol={nombresDeRol[usuario.rol]}
        onSalir={onSalir}
      />

      <main className="contenido">
        {/* La clave cambia con la sección: así la animación de entrada se repite al cambiar de sección. */}
        <div key={seccion} className="seccion-entrada">
          {seccion === "dashboard" && (
            <>
              <h1 className="titulo-heading-lg">Dashboard</h1>
              <Dashboard token={token} />
            </>
          )}
          {seccion === "pedidos" && <Pedidos token={token} puedeOperar={puedeOperar} puedeControlar={puedeControlar} />}
          {seccion === "entregas" && (
            <>
              <h1 className="titulo-heading-lg">Entregas</h1>
              <Entregas token={token} />
            </>
          )}
          {seccion === "reportes" && (
            <>
              <h1 className="titulo-heading-lg">Reportes</h1>
              <Reportes token={token} />
            </>
          )}
          {seccion === "clientes" && <Clientes token={token} />}
          {seccion === "inventario" && <Inventario token={token} />}
          {seccion === "paquetes" && <Paquetes token={token} />}
          {seccion === "usuarios" && <Usuarios token={token} idActual={usuario.id} />}
        </div>
      </main>

      <Notificaciones />
    </div>
  );
}
