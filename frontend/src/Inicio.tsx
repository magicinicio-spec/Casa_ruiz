import type { Sesion } from "./api";

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

export default function Inicio({ sesion, onSalir }: Props) {
  const { usuario } = sesion;

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
        <h1 className="titulo-heading-lg">Hola, {usuario.nombreCompleto.split(" ")[0]}</h1>
        <p className="texto-lead">
          Inventario, pedidos, entregas y reportes llegarán en las siguientes pantallas.
        </p>
      </main>
    </div>
  );
}
