import { useEffect, useState } from "react";
import { descargarReporte, ErrorApi } from "./api";
import { formatoDinero } from "./Dashboard";
import PedidoForm, { type Edicion } from "./PedidoForm";
import { notificar } from "./Notificaciones";
import {
  type Articulo,
  type Cliente,
  type Cotizacion,
  type Paquete,
  listarArticulos,
  listarClientes,
  listarCotizaciones,
  listarPaquetes,
  obtenerCotizacion,
} from "./recursos";
import { Aviso, Encabezado, Vacio } from "./ui";
import { Cargando } from "./Cargando";

interface Props {
  token: string;
}

type Vista =
  | { modo: "lista" }
  | { modo: "nueva" }
  | { modo: "editar"; cotizacion: Edicion }
  | { modo: "convertir"; id: number; inicial: Edicion }
  | { modo: "detalle"; id: number };

export default function Cotizaciones({ token }: Props) {
  const [vista, setVista] = useState<Vista>({ modo: "lista" });
  const [lista, setLista] = useState<Cotizacion[] | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargarLista() {
    try {
      setLista(await listarCotizaciones(token));
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudieron cargar las cotizaciones.");
    }
  }

  useEffect(() => {
    cargarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (vista.modo !== "nueva" && vista.modo !== "editar" && vista.modo !== "convertir") return;
    Promise.all([listarClientes(token), listarArticulos(token), listarPaquetes(token)])
      .then(([c, a, p]) => {
        setClientes(c);
        setArticulos(a);
        setPaquetes(p);
      })
      .catch((err: unknown) => setError(err instanceof ErrorApi ? err.message : "No se pudieron cargar los datos."));
  }, [token, vista.modo]);

  if (vista.modo === "nueva" || vista.modo === "editar" || vista.modo === "convertir") {
    const editando = vista.modo === "editar";
    const convirtiendo = vista.modo === "convertir";
    if (convirtiendo) {
      return (
        <section className="seccion">
          <Encabezado titulo={`Convertir cotización #${vista.id} en pedido`} />
          <p className="texto-caption">Revisa los datos. Si cambió algo desde la cotización, ajústalo aquí antes de crear el pedido.</p>
          {error && <Aviso>{error}</Aviso>}
          <PedidoForm
            key={`convertir-${vista.id}`}
            token={token}
            clientes={clientes}
            articulos={articulos}
            paquetes={paquetes}
            inicial={vista.inicial}
            convertirDesde={vista.id}
            onGuardado={(pedidoId) => {
              notificar(`Pedido #${pedidoId} creado desde la cotización.`);
              cargarLista();
              setVista({ modo: "detalle", id: vista.id });
            }}
            onCancelar={() => setVista({ modo: "detalle", id: vista.id })}
            onClienteNuevo={(cliente) => setClientes((prev) => [...prev, cliente])}
          />
        </section>
      );
    }
    return (
      <section className="seccion">
        <Encabezado titulo={editando ? `Cotización #${vista.cotizacion.id}` : "Nueva cotización"} />
        {error && <Aviso>{error}</Aviso>}
        {clientes.length === 0 ? (
          <Vacio>Primero agrega un cliente para poder crear cotizaciones.</Vacio>
        ) : (
          <PedidoForm
            key={editando ? vista.cotizacion.id : "nueva"}
            cotizacion
            token={token}
            clientes={clientes}
            articulos={articulos}
            paquetes={paquetes}
            pedido={editando ? vista.cotizacion : undefined}
            onGuardado={(id) => {
              notificar(`Cotización #${id} guardada.`);
              cargarLista();
              setVista({ modo: "detalle", id });
            }}
            onCancelar={() => setVista(editando ? { modo: "detalle", id: vista.cotizacion.id } : { modo: "lista" })}
            onClienteNuevo={(cliente) => setClientes((prev) => [...prev, cliente])}
          />
        )}
      </section>
    );
  }

  if (vista.modo === "detalle") {
    return <DetalleCotizacion token={token} id={vista.id} onVolver={() => setVista({ modo: "lista" })}
      onEditar={(cotizacion) => setVista({ modo: "editar", cotizacion })}
      onConvertir={(inicial) => setVista({ modo: "convertir", id: vista.id, inicial })} />;
  }

  return (
    <section className="seccion">
      <Encabezado
        titulo="Cotizaciones"
        accion={
          <button className="boton boton--primario" type="button" onClick={() => setVista({ modo: "nueva" })}>
            Nueva cotización
          </button>
        }
      />

      {error && <Aviso>{error}</Aviso>}
      {!lista && !error && <Cargando />}
      {lista && lista.length === 0 && <Vacio>Todavía no hay cotizaciones.</Vacio>}

      {lista && lista.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Cotización</th>
                <th>Cliente</th>
                <th>Entrega</th>
                <th className="numero">Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>{c.clienteNombre}</td>
                  <td>{c.fechaHoraEntrega}</td>
                  <td className="numero">{formatoDinero.format(c.total)}</td>
                  <td>
                    <button className="boton boton--secundario boton--chico" type="button"
                      onClick={() => setVista({ modo: "detalle", id: c.id })}>
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function edicionDe(c: Cotizacion): Edicion {
  return {
    id: c.id,
    clienteId: c.clienteId,
    fechaHoraEntrega: c.fechaHoraEntrega,
    fechaDevolucion: c.fechaDevolucion,
    direccionEntrega: c.direccionEntrega,
    requiereFactura: c.requiereFactura,
    lineas: c.lineas.map((l) => ({ articuloId: l.articuloId, paqueteId: l.paqueteId, cantidad: l.cantidad })),
  };
}

function DetalleCotizacion({ token, id, onVolver, onEditar, onConvertir }: {
  token: string;
  id: number;
  onVolver: () => void;
  onEditar: (cotizacion: Edicion) => void;
  onConvertir: (inicial: Edicion) => void;
}) {
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerCotizacion(token, id)
      .then(setCotizacion)
      .catch((err: unknown) => setError(err instanceof ErrorApi ? err.message : "No se pudo cargar la cotización."));
  }, [token, id]);

  if (error) return <Aviso>{error}</Aviso>;
  if (!cotizacion) return <Cargando />;

  return (
    <section className="seccion">
      <div className="encabezado-seccion">
        <h1 className="titulo-heading-lg">Cotización #{cotizacion.id}</h1>
        <button className="boton boton--secundario" type="button" onClick={onVolver}>Volver a cotizaciones</button>
      </div>

      <div className="panel">
        <div className="dos-columnas">
          <dl className="datos">
            <div className="dato"><dt>Cliente</dt><dd>{cotizacion.clienteNombre}</dd></div>
            <div className="dato"><dt>Teléfono</dt><dd>{cotizacion.clienteTelefono}</dd></div>
            <div className="dato"><dt>Dirección</dt><dd>{cotizacion.direccionEntrega}</dd></div>
          </dl>
          <dl className="datos">
            <div className="dato"><dt>Fecha de entrega</dt><dd>{cotizacion.fechaHoraEntrega}</dd></div>
            <div className="dato"><dt>Fecha de devolución</dt><dd>{cotizacion.fechaDevolucion}</dd></div>
            <div className="dato"><dt>Total</dt><dd>{formatoDinero.format(cotizacion.total)}</dd></div>
          </dl>
        </div>
        {cotizacion.pedidoId !== null && (
          <Aviso tipo="info">Esta cotización se convirtió en el pedido #{cotizacion.pedidoId}. Ya no se puede editar.</Aviso>
        )}
        <div className="lista-acciones">
          {cotizacion.pedidoId === null && (
            <button className="boton boton--primario" type="button" onClick={() => onConvertir(edicionDe(cotizacion))}>
              Convertir en pedido
            </button>
          )}
          <button className="boton boton--secundario" type="button"
            onClick={() => descargarReporte(`/api/cotizaciones/${cotizacion.id}/imprimir`, token, `cotizacion-${cotizacion.id}.pdf`)
              .catch((err: unknown) => setError(err instanceof ErrorApi ? err.message : "No se pudo imprimir."))}>
            Imprimir cotización
          </button>
          {cotizacion.pedidoId === null && (
          <button className="boton boton--secundario" type="button"
            onClick={() => onEditar({
              id: cotizacion.id,
              clienteId: cotizacion.clienteId,
              fechaHoraEntrega: cotizacion.fechaHoraEntrega,
              fechaDevolucion: cotizacion.fechaDevolucion,
              direccionEntrega: cotizacion.direccionEntrega,
              requiereFactura: cotizacion.requiereFactura,
              lineas: cotizacion.lineas.map((l) => ({ articuloId: l.articuloId, paqueteId: l.paqueteId, cantidad: l.cantidad })),
            })}>
            Editar
          </button>
          )}
        </div>
      </div>

      <div className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th>Cantidad</th>
              <th>Descripción</th>
              <th className="numero">Total</th>
            </tr>
          </thead>
          <tbody>
            {cotizacion.lineas.map((l) => (
              <tr key={l.id}>
                <td>{l.cantidad}</td>
                <td>
                  {l.descripcion}
                  {l.paqueteId !== null && (
                    <span className="texto-caption bloque">
                      Incluye: {l.articulos.map((a) => `${a.cantidad} ${a.descripcion}`).join(", ")}
                    </span>
                  )}
                </td>
                <td className="numero">{formatoDinero.format(l.importe)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="texto-caption">Subtotal {formatoDinero.format(cotizacion.subtotal)}{cotizacion.iva > 0 ? ` · IVA ${formatoDinero.format(cotizacion.iva)}` : ""}</p>
    </section>
  );
}
