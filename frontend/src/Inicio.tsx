import type { Sesion } from "./api";
import Dashboard from "./Dashboard";

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
            <h1 className="titulo-heading-lg">Dashboard</h1>
            <Dashboard token={sesion.token} />
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
