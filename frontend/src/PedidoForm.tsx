import CampoNumero from "./CampoNumero";
import { type FormEvent, useMemo, useState } from "react";
import { ErrorApi } from "./api";
import ClienteBuscador from "./ClienteBuscador";
import { formatoDinero } from "./Dashboard";
import { aFecha, aFechaHora, desdeFecha, desdeFechaHora } from "./fechas";
import { Aviso, Campo, Casilla } from "./ui";
import {
  type AdvertenciaInventario,
  type Articulo,
  type Cliente,
  type LineaEntrada,
  type Paquete,
  type PedidoEntrada,
  actualizarPedido,
  actualizarCotizacion,
  convertirCotizacion,
  type CotizacionEntrada,
  crearCotizacion,
  crearPedido,
} from "./recursos";

/** Datos que se pueden editar: un pedido o una cotización (la cotización no tiene anticipo ni pago). */
export interface Edicion {
  id: number;
  clienteId: number;
  fechaHoraEntrega: string;
  fechaDevolucion: string;
  direccionEntrega: string;
  requiereFactura: boolean;
  anticipo?: number;
  pagado?: boolean;
  lineas: { articuloId: number | null; paqueteId: number | null; cantidad: number }[];
}

interface Props {
  token: string;
  clientes: Cliente[];
  articulos: Articulo[];
  paquetes: Paquete[];
  /** Pedido o cotización existente que se edita. */
  pedido?: Edicion;
  /** Valores iniciales cuando se crea algo nuevo a partir de otro (por ejemplo, convertir una cotización). */
  inicial?: Edicion;
  /** Id de la cotización que se convierte en pedido. */
  convertirDesde?: number;
  /** Muestra la forma de cotización: sin anticipo, pagos ni saldo. */
  cotizacion?: boolean;
  onGuardado: (id: number, advertencias: AdvertenciaInventario[]) => void;
  onCancelar: () => void;
  onClienteNuevo: (cliente: Cliente) => void;
}

interface LineaForm {
  tipo: "articulo" | "paquete";
  id: number;
  cantidad: number;
}

const TASA_IVA = 0.16;

export default function PedidoForm({ token, clientes, articulos, paquetes, pedido, inicial, convertirDesde, cotizacion = false, onGuardado, onCancelar, onClienteNuevo }: Props) {
  const base = pedido ?? inicial;
  const clienteInicial = base ? clientes.find((c) => c.id === base.clienteId) : undefined;
  const direccionDelCliente = base ? clienteInicial?.direccion === base.direccionEntrega : true;

  const [clienteId, setClienteId] = useState(base?.clienteId ?? clientes[0]?.id ?? 0);
  const [fechaEntrega, setFechaEntrega] = useState(base ? desdeFechaHora(base.fechaHoraEntrega) : "");
  const [fechaDevolucion, setFechaDevolucion] = useState(base ? desdeFecha(base.fechaDevolucion) : "");
  const [usarDireccionCliente, setUsarDireccionCliente] = useState(direccionDelCliente);
  const [direccionOtra, setDireccionOtra] = useState(direccionDelCliente ? "" : base?.direccionEntrega ?? "");
  const [requiereFactura, setRequiereFactura] = useState(base?.requiereFactura ?? false);
  const [anticipo, setAnticipo] = useState(base?.anticipo ?? 0);
  const [pagado, setPagado] = useState(base?.pagado ?? false);
  const [lineas, setLineas] = useState<LineaForm[]>(
    base
      ? base.lineas.map((l) =>
          l.paqueteId !== null
            ? { tipo: "paquete", id: l.paqueteId, cantidad: l.cantidad }
            : { tipo: "articulo", id: l.articuloId ?? 0, cantidad: l.cantidad },
        )
      : [{ tipo: "articulo", id: articulos[0]?.id ?? 0, cantidad: 1 }],
  );
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const clienteElegido = clientes.find((c) => c.id === clienteId);

  // Resumen en vivo: el servidor calcula el total definitivo al guardar.
  const resumen = useMemo(() => {
    const subtotal = lineas.reduce((suma, l) => {
      const precio =
        l.tipo === "articulo"
          ? articulos.find((a) => a.id === l.id)?.precioRenta ?? 0
          : paquetes.find((p) => p.id === l.id)?.precioRenta ?? 0;
      return suma + precio * l.cantidad;
    }, 0);
    const iva = requiereFactura ? Math.round(subtotal * TASA_IVA * 100) / 100 : 0;
    const total = subtotal + iva;
    return { subtotal, iva, total, saldo: Math.max(total - anticipo, 0) };
  }, [lineas, articulos, paquetes, requiereFactura, anticipo]);

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
      if (convertirDesde !== undefined) {
        const resultado = await convertirCotizacion(token, convertirDesde, cuerpo);
        onGuardado(resultado.pedido.id, resultado.advertencias);
      } else if (cotizacion) {
        const cuerpoCotizacion: CotizacionEntrada = {
          clienteId,
          fechaHoraEntrega: cuerpo.fechaHoraEntrega,
          fechaDevolucion: cuerpo.fechaDevolucion,
          direccionEsDelCliente: cuerpo.direccionEsDelCliente,
          direccionOtra: cuerpo.direccionOtra,
          requiereFactura,
          lineas: cuerpo.lineas,
        };
        const guardada = pedido
          ? await actualizarCotizacion(token, pedido.id, cuerpoCotizacion)
          : await crearCotizacion(token, cuerpoCotizacion);
        onGuardado(guardada.id, []);
      } else {
        const resultado = pedido
          ? await actualizarPedido(token, pedido.id, cuerpo)
          : await crearPedido(token, cuerpo);
        onGuardado(resultado.pedido.id, resultado.advertencias);
      }
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo guardar el pedido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="pedido-form" onSubmit={enviar}>
      <div className="pedido-form__principal">
        {error && <Aviso>{error}</Aviso>}

        <section className="bloque-form panel">
          <h3 className="bloque-form__titulo">1. Cliente y entrega</h3>
          <div className="formulario">
            <div className="formulario__completo">
              <ClienteBuscador
                token={token}
                clientes={clientes}
                valor={clienteId}
                onChange={setClienteId}
                onClienteNuevo={onClienteNuevo}
              />
            </div>
            <Campo etiqueta="Fecha y hora de entrega">
              <input className="campo__input" type="datetime-local" required value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)} />
            </Campo>
            <Campo etiqueta="Fecha de devolución">
              <input className="campo__input" type="date" required value={fechaDevolucion}
                onChange={(e) => setFechaDevolucion(e.target.value)} />
            </Campo>
          </div>
        </section>

        <section className="bloque-form panel">
          <h3 className="bloque-form__titulo">2. Dirección de entrega</h3>
          <Casilla
            etiqueta={`Usar la dirección del cliente${clienteElegido ? `: ${clienteElegido.direccion}` : ""}`}
            checked={usarDireccionCliente}
            onChange={setUsarDireccionCliente}
          />
          {!usarDireccionCliente && (
            <Campo etiqueta="Dirección para este pedido">
              <textarea required maxLength={400} value={direccionOtra} onChange={(e) => setDireccionOtra(e.target.value)} />
            </Campo>
          )}
        </section>

        <section className="bloque-form panel">
          <h3 className="bloque-form__titulo">3. Artículos y paquetes</h3>
          <div className="lineas">
            <div className="lineas__encabezado" aria-hidden>
              <span>Tipo</span>
              <span>Elemento</span>
              <span>Cantidad</span>
              <span>Total</span>
              <span />
            </div>
            {lineas.map((l, i) => {
              const precio =
                l.tipo === "articulo"
                  ? articulos.find((a) => a.id === l.id)?.precioRenta ?? 0
                  : paquetes.find((p) => p.id === l.id)?.precioRenta ?? 0;
              return (
                <div key={i} className="lineas__fila">
                  <select className="campo__input" aria-label="Tipo" value={l.tipo}
                    onChange={(e) => {
                      const tipo = e.target.value as LineaForm["tipo"];
                      const primero = tipo === "articulo" ? articulos[0]?.id : paquetes[0]?.id;
                      cambiarLinea(i, { tipo, id: primero ?? 0 });
                    }}>
                    <option value="articulo">Artículo</option>
                    <option value="paquete">Paquete</option>
                  </select>
                  <select className="campo__input" aria-label="Elemento" value={l.id}
                    onChange={(e) => cambiarLinea(i, { id: Number(e.target.value) })}>
                    {(l.tipo === "articulo" ? articulos : paquetes).map((x) => (
                      <option key={x.id} value={x.id}>
                        {"descripcion" in x ? x.descripcion : x.nombre}
                      </option>
                    ))}
                  </select>
                  <CampoNumero className="campo__input" min={1} step={1} required aria-label="Cantidad" value={l.cantidad}
              onChange={(v) => cambiarLinea(i, { cantidad: v })} />
                  <span className="lineas__total">{formatoDinero.format(precio * l.cantidad)}</span>
                  <button className="boton boton--secundario boton--chico" type="button" disabled={lineas.length === 1}
                    onClick={() => setLineas((prev) => prev.filter((_, j) => j !== i))}>
                    Quitar
                  </button>
                </div>
              );
            })}
          </div>
          <div>
            <button className="boton boton--secundario boton--chico" type="button" onClick={agregarLinea}>
              + Agregar línea
            </button>
          </div>
        </section>

        {!cotizacion && (
        <section className="bloque-form panel">
          <h3 className="bloque-form__titulo">4. Pago</h3>
          <div className="formulario">
            <Campo etiqueta="Anticipo (MXN)">
              <CampoNumero className="campo__input" min={0} step="0.01" value={anticipo}
              onChange={(v) => setAnticipo(v)} />
            </Campo>
            <div className="formulario__casillas">
              <Casilla etiqueta="Pagado" checked={pagado} onChange={setPagado} />
              <Casilla etiqueta="Requiere factura (suma IVA 16%)" checked={requiereFactura} onChange={setRequiereFactura} />
            </div>
          </div>
        </section>
        )}

        <div className="pedido-form__acciones">
          <button className="boton boton--secundario" type="button" onClick={onCancelar}>Cancelar</button>
          <button className="boton boton--primario" type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : convertirDesde !== undefined ? "Crear pedido" : cotizacion ? "Guardar cotización" : "Guardar pedido"}
          </button>
        </div>
      </div>

      <aside className="resumen-pedido panel" aria-label="Resumen del pedido">
        <h3 className="bloque-form__titulo">Resumen</h3>
        <dl className="datos">
          <div className="dato"><dt>Subtotal</dt><dd>{formatoDinero.format(resumen.subtotal)}</dd></div>
          {requiereFactura && <div className="dato"><dt>IVA 16%</dt><dd>{formatoDinero.format(resumen.iva)}</dd></div>}
          <div className="dato resumen-pedido__total"><dt>Total</dt><dd>{formatoDinero.format(resumen.total)}</dd></div>
          {!cotizacion && <div className="dato"><dt>Anticipo</dt><dd>{formatoDinero.format(anticipo)}</dd></div>}
          {!cotizacion && <div className="dato resumen-pedido__saldo"><dt>Saldo a pagar</dt><dd>{formatoDinero.format(resumen.saldo)}</dd></div>}
        </dl>
        <p className="texto-caption">El total definitivo lo calcula el servidor al guardar.</p>
      </aside>
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
