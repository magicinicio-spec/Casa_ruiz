import { useState } from "react";
import type { RolUsuario, Sesion } from "./api";
import Dashboard from "./Dashboard";
import Entregas from "./Entregas";
import Reportes from "./Reportes";

interface Props {
  sesion: Sesion;
  onSalir: () => void;
}

type Seccion = "dashboard" | "reportes" | "entregas";

const nombresDeRol: Record<RolUsuario, string> = {
  Administrador: "Administrador",
  Superior: "Superior",
  Vendedor: "Vendedor",
  Repartidor: "Repartidor",
  VendedorRepartidor: "Vendedor y repartidor",
};

// Secciones visibles por rol. Ver docs/REGLAS_NEGOCIO.md, sección de usuarios.
const seccionesPorRol: Record<RolUsuario, Seccion[]> = {
  Administrador: ["dashboard", "reportes", "entregas"],
  Superior: ["dashboard", "reportes", "entregas"],
  Vendedor: ["dashboard", "reportes"],
  Repartidor: ["entregas"],
  VendedorRepartidor: ["dashboard", "reportes", "entregas"],
};

const nombresDeSeccion: Record<Seccion, string> = {
  dashboard: "Dashboard",
  reportes: "Reportes",
  entregas: "Entregas",
};

export default function Inicio({ sesion, onSalir }: Props) {
  const { usuario } = sesion;
  const secciones = seccionesPorRol[usuario.rol];
  const [seccion, setSeccion] = useState<Seccion>(secciones[0]);

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
            <Dashboard token={sesion.token} />
          </>
        )}
        {seccion === "reportes" && (
          <>
            <h1 className="titulo-heading-lg">Reportes</h1>
            <Reportes token={sesion.token} />
          </>
        )}
        {seccion === "entregas" && (
          <>
            <h1 className="titulo-heading-lg">Entregas</h1>
            <Entregas token={sesion.token} />
          </>
        )}
      </main>
    </div>
  );
}
