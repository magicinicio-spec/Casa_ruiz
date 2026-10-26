import { type ReactNode, useEffect, useState } from "react";
import {
  ErrorApi,
  obtenerInventario,
  obtenerPedidosPagados,
  obtenerPendientesRecoger,
  type ReporteInventarioArticulo,
  type ReportePedido,
  type ReportePedidosPagados,
} from "./api";
import { formatoDinero } from "./Dashboard";

type Pestana = "pagados" | "recoger" | "inventario";

interface Props {
  token: string;
}

export default function Reportes({ token }: Props) {
  const [pestana, setPestana] = useState<Pestana>("pagados");

  return (
    <section className="reportes">
      <nav className="pestanas" aria-label="Reportes">
        <Pestanita activa={pestana === "pagados"} onClick={() => setPestana("pagados")}>
          Pedidos pagados
        </Pestanita>
        <Pestanita activa={pestana === "recoger"} onClick={() => setPestana("recoger")}>
          Por recoger
        </Pestanita>
        <Pestanita activa={pestana === "inventario"} onClick={() => setPestana("inventario")}>
          Inventario
        </Pestanita>
      </nav>

      {pestana === "pagados" && <PedidosPagados token={token} />}
      {pestana === "recoger" && <PorRecoger token={token} />}
      {pestana === "inventario" && <Inventario token={token} />}
    </section>
  );
}

function Pestanita({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`boton pestanita${activa ? " pestanita--activa" : ""}`}
      aria-pressed={activa}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Convierte yyyy-MM-dd (campo de fecha del navegador) a dd-MM-yyyy. */
function aFormatoSistema(fecha: string): string {
  if (!fecha) return "";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}-${mes}-${anio}`;
}

function PedidosPagados({ token }: { token: string }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [datos, setDatos] = useState<ReportePedidosPagados | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    obtenerPedidosPagados(token, aFormatoSistema(desde), aFormatoSistema(hasta))
      .then(setDatos)
      .catch((err: unknown) => {
        setDatos(null);
        setError(err instanceof ErrorApi ? err.message : "No se pudo cargar el reporte.");
      });
  }, [token, desde, hasta]);

  return (
    <div className="reporte">
      <div className="filtros">
        <label className="campo">
          <span className="campo__etiqueta">Entrega desde</span>
          <input className="campo__input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Entrega hasta</span>
          <input className="campo__input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
      </div>

      {error && <p className="login__error" role="alert">{error}</p>}

      {datos && (
        <>
          <p className="resumen">
            {datos.cantidad} pedidos pagados · Total {formatoDinero.format(datos.totalPagado)}
          </p>
          <TablaPedidos pedidos={datos.pedidos} />
        </>
      )}
    </div>
  );
}

function PorRecoger({ token }: { token: string }) {
  const [pedidos, setPedidos] = useState<ReportePedido[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerPendientesRecoger(token)
      .then(setPedidos)
      .catch((err: unknown) => setError(err instanceof ErrorApi ? err.message : "No se pudo cargar el reporte."));
  }, [token]);

  if (error) return <p className="login__error" role="alert">{error}</p>;
  if (!pedidos) return <p className="texto-lead">Cargando…</p>;

  return (
    <div className="reporte">
      <p className="resumen">{pedidos.length} pedidos con piezas por recoger</p>
      <TablaPedidos pedidos={pedidos} />
    </div>
  );
}

function Inventario({ token }: { token: string }) {
  const [articulos, setArticulos] = useState<ReporteInventarioArticulo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerInventario(token)
      .then(setArticulos)
      .catch((err: unknown) => setError(err instanceof ErrorApi ? err.message : "No se pudo cargar el reporte."));
  }, [token]);

  if (error) return <p className="login__error" role="alert">{error}</p>;
  if (!articulos) return <p className="texto-lead">Cargando…</p>;

  return (
    <div className="reporte">
      <div className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Categoría</th>
              <th className="numero">Existencia</th>
              <th className="numero">En renta</th>
              <th className="numero">Disponible</th>
              <th className="numero">Dados de baja</th>
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => (
              <tr key={a.articuloId}>
                <td>{a.descripcion}</td>
                <td>{a.categoria}</td>
                <td className="numero">{a.existenciaTotal}</td>
                <td className="numero">{a.enRenta}</td>
                <td className="numero">{a.disponible}</td>
                <td className="numero">{a.dadosDeBaja}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TablaPedidos({ pedidos }: { pedidos: ReportePedido[] }) {
  if (pedidos.length === 0) {
    return <p className="texto-lead">No hay pedidos para mostrar.</p>;
  }

  return (
    <div className="tabla-envoltura">
      <table className="tabla">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Entrega</th>
            <th className="numero">Total</th>
            <th className="numero">Saldo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id}>
              <td>#{p.id}</td>
              <td>
                {p.clienteNombre}
                <span className="texto-caption bloque">{p.clienteTelefono}</span>
              </td>
              <td>{p.fechaHoraEntrega}</td>
              <td className="numero">{formatoDinero.format(p.total)}</td>
              <td className="numero">{formatoDinero.format(p.saldo)}</td>
              <td>{p.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
