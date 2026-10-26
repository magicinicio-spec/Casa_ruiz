import type { Sesion } from "./api";
import Dashboard from "./Dashboard";
import Reportes from "./Reportes";
import { useState } from "react";

interface Props {
  sesion: Sesion;
  onSalir: () => void;
}

const nombresDeRol: Record<Sesion["usuario"]["rol"], string> = {
  Administrador: "Administrador",
  Superior: "Superior",
  Vendedor: "Vendedor",
  Repartidor: "Repartidor",
  VendedorRepartidor: "Vendedor y repartidor",
};

// Roles que ven el dashboard. El repartidor solo usa la cola de entregas.
const rolesConDashboard: Sesion["usuario"]["rol"][] = ["Administrador", "Superior", "Vendedor", "VendedorRepartidor"];

export default function Inicio({ sesion, onSalir }: Props) {
  const { usuario } = sesion;
  const verDashboard = rolesConDashboard.includes(usuario.rol);
  const [vista, setVista] = useState<"dashboard" | "reportes">("dashboard");

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
        {verDashboard ? (
          <>
            <nav className="pestanas" aria-label="Secciones">
              <button
                type="button"
                className={`boton pestanita${vista === "dashboard" ? " pestanita--activa" : ""}`}
                aria-pressed={vista === "dashboard"}
                onClick={() => setVista("dashboard")}
              >
                Dashboard
              </button>
              <button
                type="button"
                className={`boton pestanita${vista === "reportes" ? " pestanita--activa" : ""}`}
                aria-pressed={vista === "reportes"}
                onClick={() => setVista("reportes")}
              >
                Reportes
              </button>
            </nav>
            {vista === "dashboard" ? <Dashboard token={sesion.token} /> : <Reportes token={sesion.token} />}
          </>
        ) : (
          <>
            <h1 className="titulo-heading-lg">Hola, {usuario.nombreCompleto.split(" ")[0]}</h1>
            <p className="texto-lead">La cola de entregas llegará en la siguiente pantalla.</p>
          </>
        )}
      </main>
    </div>
  );
}
