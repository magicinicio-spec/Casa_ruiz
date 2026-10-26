import { useState } from "react";
import type { RolUsuario, Sesion } from "./api";
import Clientes from "./Clientes";
import Dashboard from "./Dashboard";
import Entregas from "./Entregas";
import Inventario from "./Inventario";
import Paquetes from "./Paquetes";
import Pedidos from "./Pedidos";
import Reportes from "./Reportes";
import { rolesControl, rolesOperacion } from "./recursos";
import Usuarios from "./Usuarios";

interface Props {
  sesion: Sesion;
  onSalir: () => void;
}

type Seccion = "dashboard" | "pedidos" | "entregas" | "reportes" | "clientes" | "inventario" | "paquetes" | "usuarios";

const nombresDeRol: Record<RolUsuario, string> = {
  Administrador: "Administrador",
  Superior: "Superior",
  Vendedor: "Vendedor",
  Repartidor: "Repartidor",
  VendedorRepartidor: "Vendedor y repartidor",
};

const nombresDeSeccion: Record<Seccion, string> = {
  dashboard: "Dashboard",
  pedidos: "Pedidos",
  entregas: "Entregas",
  reportes: "Reportes",
  clientes: "Clientes",
  inventario: "Inventario",
  paquetes: "Paquetes",
  usuarios: "Usuarios",
};

// Secciones visibles por rol. Ver docs/REGLAS_NEGOCIO.md, sección de usuarios.
function seccionesDe(rol: RolUsuario): Seccion[] {
  const secciones: Seccion[] = [];
  const verReportes = rolesOperacion.includes(rol); // dashboard y reportes: mismos roles
  if (verReportes) secciones.push("dashboard");
  if (rolesOperacion.includes(rol)) secciones.push("pedidos");
  if (["Administrador", "Superior", "Repartidor", "VendedorRepartidor"].includes(rol)) secciones.push("entregas");
  if (verReportes) secciones.push("reportes");
  if (rolesOperacion.includes(rol)) secciones.push("clientes", "inventario", "paquetes");
  if (rol === "Administrador") secciones.push("usuarios");
  return secciones;
}

export default function Inicio({ sesion, onSalir }: Props) {
  const { usuario } = sesion;
  const token = sesion.token;
  const secciones = seccionesDe(usuario.rol);
  const [seccion, setSeccion] = useState<Seccion>(secciones[0]);
  const puedeOperar = rolesOperacion.includes(usuario.rol);
  const puedeControlar = rolesControl.includes(usuario.rol);

  return (
    <div className="pagina">
      <header className="barra">
        <span className="barra__marca">Casa Ruiz</span>
        <div className="barra__usuario">
          <span className="texto-caption">
            {usuario.nombreCompleto} · {nombresDeRol[usuario.rol]}
          </span>
          <button className="boton boton--secundario" type="button" onClick={onSalir}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="contenido">
        {secciones.length > 1 && (
          <nav className="pestanas" aria-label="Secciones">
            {secciones.map((s) => (
              <button
                key={s}
                type="button"
                className={`boton pestanita${seccion === s ? " pestanita--activa" : ""}`}
                aria-pressed={seccion === s}
                onClick={() => setSeccion(s)}
              >
                {nombresDeSeccion[s]}
              </button>
            ))}
          </nav>
        )}

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
      </main>
    </div>
  );
}
