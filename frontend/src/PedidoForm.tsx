import ClienteBuscador from "./ClienteBuscador";
import { type FormEvent, useState } from "react";
import { type Pedido, ErrorApi } from "./api";
import { aFecha, aFechaHora, desdeFecha, desdeFechaHora } from "./fechas";
import { Aviso, Campo, Casilla } from "./ui";
import {
  type AdvertenciaInventario,
  type Articulo,
  type Cliente,
  type LineaEntrada,
  type Paquete,
  type PedidoEntrada,
  type PedidoGuardado,
  actualizarPedido,
  crearPedido,
} from "./recursos";

interface Props {
  token: string;
  clientes: Cliente[];
  articulos: Articulo[];
  paquetes: Paquete[];
  pedido?: Pedido;
  onGuardado: (resultado: PedidoGuardado) => void;
  onCancelar: () => void;
  onClienteNuevo: (cliente: Cliente) => void;
}

interface LineaForm {
  tipo: "articulo" | "paquete";
  id: number;
  cantidad: number;
}

export default function PedidoForm({ token, clientes, articulos, paquetes, pedido, onGuardado, onCancelar, onClienteNuevo }: Props) {
  const clienteInicial = pedido ? clientes.find((c) => c.id === pedido.clienteId) : undefined;
  const direccionDelCliente = pedido ? clienteInicial?.direccion === pedido.direccionEntrega : true;

  const [clienteId, setClienteId] = useState(pedido?.clienteId ?? clientes[0]?.id ?? 0);
  const [fechaEntrega, setFechaEntrega] = useState(pedido ? desdeFechaHora(pedido.fechaHoraEntrega) : "");
  const [fechaDevolucion, setFechaDevolucion] = useState(pedido ? desdeFecha(pedido.fechaDevolucion) : "");
  const [usarDireccionCliente, setUsarDireccionCliente] = useState(direccionDelCliente);
  const [direccionOtra, setDireccionOtra] = useState(direccionDelCliente ? "" : pedido?.direccionEntrega ?? "");
  const [requiereFactura, setRequiereFactura] = useState(pedido?.requiereFactura ?? false);
  const [anticipo, setAnticipo] = useState(pedido?.anticipo ?? 0);
  const [pagado, setPagado] = useState(pedido?.pagado ?? false);
  const [lineas, setLineas] = useState<LineaForm[]>(
    pedido
      ? pedido.lineas.map((l) =>
          l.paqueteId !== null
            ? { tipo: "paquete", id: l.paqueteId, cantidad: l.cantidad }
            : { tipo: "articulo", id: l.articuloId ?? 0, cantidad: l.cantidad },
        )
      : [{ tipo: "articulo", id: articulos[0]?.id ?? 0, cantidad: 1 }],
  );
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cambiarLinea(indice: number, cambio: Partial<LineaForm>) {
    setLineas((prev) => prev.map((l, i) => (i === indice ? { ...l, ...cambio } : l)));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, { tipo: "articulo", id: articulos[0]?.id ?? 0, cantidad: 1 }]);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (lineas.length === 0) {
      setError("Agrega al menos un artículo o paquete.");
      return;
    }

    const cuerpo: PedidoEntrada = {
      clienteId,
      fechaHoraEntrega: aFechaHora(fechaEntrega),
      fechaDevolucion: aFecha(fechaDevolucion),
      direccionEsDelCliente: usarDireccionCliente,
      direccionOtra: usarDireccionCliente ? null : direccionOtra,
      requiereFactura,
      anticipo,
      pagado,
      lineas: lineas.map(
        (l): LineaEntrada =>
          l.tipo === "articulo"
            ? { articuloId: l.id, paqueteId: null, cantidad: l.cantidad }
            : { articuloId: null, paqueteId: l.id, cantidad: l.cantidad },
      ),
    };

    setEnviando(true);
    try {
      const resultado = pedido
        ? await actualizarPedido(token, pedido.id, cuerpo)
        : await crearPedido(token, cuerpo);
      onGuardado(resultado);
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo guardar el pedido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="panel" onSubmit={enviar}>
      <h2 className="panel__titulo">{pedido ? `Editar pedido #${pedido.id}` : "Nuevo pedido"}</h2>

      {error && <Aviso>{error}</Aviso>}

      <div className="formulario">
        <ClienteBuscador
          token={token}
          clientes={clientes}
          valor={clienteId}
          onChange={setClienteId}
          onClienteNuevo={onClienteNuevo}
        />
        <Campo etiqueta="Fecha y hora de entrega">
          <input className="campo__input" type="datetime-local" required value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)} />
        </Campo>
        <Campo etiqueta="Fecha de devolución">
          <input className="campo__input" type="date" required value={fechaDevolucion}
            onChange={(e) => setFechaDevolucion(e.target.value)} />
        </Campo>
        <Casilla etiqueta="La dirección de entrega es la del cliente" checked={usarDireccionCliente}
          onChange={setUsarDireccionCliente} />
        {!usarDireccionCliente && (
          <Campo etiqueta="Dirección de entrega para este pedido" className="formulario__completo">
            <textarea required maxLength={400} value={direccionOtra} onChange={(e) => setDireccionOtra(e.target.value)} />
          </Campo>
        )}
        <Campo etiqueta="Anticipo (MXN)">
          <input className="campo__input" type="number" min={0} step="0.01" value={anticipo}
            onChange={(e) => setAnticipo(Number(e.target.value))} />
        </Campo>
        <Casilla etiqueta="Pagado" checked={pagado} onChange={setPagado} />
        <Casilla etiqueta="Requiere factura (suma IVA 16%)" checked={requiereFactura} onChange={setRequiereFactura} />
      </div>

      <h3 className="panel__titulo">Artículos y paquetes</h3>
      {lineas.map((l, i) => (
        <div key={i} className="fila-editable">
          <div className="formulario" style={{ gridTemplateColumns: "140px 1fr" }}>
            <Campo etiqueta="Tipo">
              <select className="campo__input" value={l.tipo}
                onChange={(e) => {
                  const tipo = e.target.value as LineaForm["tipo"];
                  const primero = tipo === "articulo" ? articulos[0]?.id : paquetes[0]?.id;
                  cambiarLinea(i, { tipo, id: primero ?? 0 });
                }}>
                <option value="articulo">Artículo</option>
                <option value="paquete">Paquete</option>
              </select>
            </Campo>
            <Campo etiqueta="Elemento">
              <select className="campo__input" value={l.id} onChange={(e) => cambiarLinea(i, { id: Number(e.target.value) })}>
                {(l.tipo === "articulo" ? articulos : paquetes).map((x) => (
                  <option key={x.id} value={x.id}>
                    {"descripcion" in x ? x.descripcion : x.nombre}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <Campo etiqueta="Cantidad">
            <input className="campo__input" type="number" min={1} step={1} required value={l.cantidad}
              onChange={(e) => cambiarLinea(i, { cantidad: Number(e.target.value) })} />
          </Campo>
          <button className="boton boton--secundario boton--chico" type="button" disabled={lineas.length === 1}
            onClick={() => setLineas((prev) => prev.filter((_, j) => j !== i))}>
            Quitar
          </button>
        </div>
      ))}
      <div className="lista-acciones">
        <button className="boton boton--secundario boton--chico" type="button" onClick={agregarLinea}>
          Agregar línea
        </button>
      </div>

      <div className="lista-acciones">
        <button className="boton boton--primario" type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar pedido"}
        </button>
        <button className="boton boton--secundario" type="button" onClick={onCancelar}>Volver</button>
      </div>
    </form>
  );
}

/** Aviso de inventario que se muestra después de guardar: no bloquea el pedido. */
export function AvisosInventario({ advertencias }: { advertencias: AdvertenciaInventario[] }) {
  if (advertencias.length === 0) return null;

  return (
    <Aviso tipo="info">
      <strong>Revisa el inventario. Este pedido supera las piezas disponibles:</strong>
      <ul>
        {advertencias.map((a) => (
          <li key={a.articuloId}>
            {a.descripcion}: pides {a.solicitadas}, la existencia es {a.existenciaTotal} y ya están comprometidas{" "}
            {a.comprometidaEnOtrosPedidos}. Faltan {Math.abs(a.restantes)}.
          </li>
        ))}
      </ul>
    </Aviso>
  );
}
