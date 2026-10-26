import { notificar } from "./Notificaciones";
import { Cargando } from "./Cargando";
import { useEffect, useState } from "react";
import { type Pedido, descargarReporte, ErrorApi } from "./api";
import { formatoDinero } from "./Dashboard";
import { Aviso, Campo } from "./ui";
import {
  cancelarPedido,
  cerrarPedido,
  obtenerPedido,
  type ResolucionDano,
  type RevisionArticulo,
  resolverDano,
  revisarPedido,
  type TipoResolucion,
} from "./recursos";

interface Props {
  token: string;
  id: number;
  puedeOperar: boolean;
  puedeControlar: boolean;
  onEditar: (pedido: Pedido) => void;
  onCambio: () => void;
}

type ArticuloPedido = Pedido["lineas"][number]["articulos"][number];

const nombresTipo: Record<TipoResolucion, string> = {
  Reparado: "Reparado (regresa a la existencia)",
  DadoDeBaja: "Dado de baja (sale del inventario)",
  Cobrado: "Cobrado al cliente",
};

export default function PedidoDetalle({ token, id, puedeOperar, puedeControlar, onEditar, onCambio }: Props) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function cargar() {
    try {
      setPedido(await obtenerPedido(token, id));
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo cargar el pedido.");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  async function ejecutar(accion: () => Promise<Pedido>, mensajeOk: string) {
    setError(null);
    setExito(null);
    setOcupado(true);
    try {
      setPedido(await accion());
      setExito(mensajeOk);
      notificar(mensajeOk);
      onCambio();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo completar la acción.");
    } finally {
      setOcupado(false);
    }
  }

  if (!pedido) {
    return error ? <Aviso>{error}</Aviso> : <Cargando />;
  }

  const activo = pedido.estado === "Activo";
  const articulos = pedido.lineas.flatMap((l) => l.articulos);
  const tieneRevision = articulos.some((a) => a.cantidadDevuelta !== null);
  const revisionCompleta = articulos.every((a) => a.cantidadDevuelta !== null);
  const pendienteRecoger = pedido.entregadoEn !== null && pedido.recogidoEn === null;
  const todosRecogidos = pedido.recogidoEn !== null;

  return (
    <div className="seccion">
      {error && <Aviso>{error}</Aviso>}
      {exito && <Aviso tipo="info">{exito}</Aviso>}

      <div className="panel">
        <div className="encabezado-seccion">
          <h2 className="panel__titulo">Pedido #{pedido.id} · {pedido.clienteNombre}</h2>
          <span className="estado">{pedido.estado}</span>
        </div>

        <div className="dos-columnas">
          <dl className="datos">
            <div className="dato"><dt>Teléfono</dt><dd>{pedido.clienteTelefono}</dd></div>
            <div className="dato"><dt>Dirección</dt><dd>{pedido.direccionEntrega}</dd></div>
            <div className="dato"><dt>Entrega</dt><dd>{pedido.fechaHoraEntrega}</dd></div>
            <div className="dato"><dt>Devolución</dt><dd>{pedido.fechaDevolucion}</dd></div>
            <div className="dato"><dt>Entregado</dt><dd>{pedido.entregadoEn ? "Sí" : "No"}</dd></div>
            <div className="dato"><dt>Recogido</dt><dd>{pedido.recogidoEn ? "Sí" : "No"}</dd></div>
          </dl>
          <dl className="datos">
            <div className="dato"><dt>Subtotal</dt><dd>{formatoDinero.format(pedido.subtotal)}</dd></div>
            {pedido.iva > 0 && <div className="dato"><dt>IVA</dt><dd>{formatoDinero.format(pedido.iva)}</dd></div>}
            {pedido.cobrosPorDanos > 0 && (
              <div className="dato"><dt>Cobros por daño</dt><dd>{formatoDinero.format(pedido.cobrosPorDanos)}</dd></div>
            )}
            <div className="dato"><dt>Total</dt><dd>{formatoDinero.format(pedido.total)}</dd></div>
            <div className="dato"><dt>Anticipo</dt><dd>{formatoDinero.format(pedido.anticipo)}</dd></div>
            <div className="dato"><dt>Saldo</dt><dd>{formatoDinero.format(pedido.saldo)}</dd></div>
            <div className="dato"><dt>Pago</dt><dd>{pedido.pagado ? "Pagado" : "No pagado"}</dd></div>
          </dl>
        </div>

        <div className="lista-acciones">
          {puedeOperar && (
            <button className="boton boton--secundario" type="button" disabled={ocupado}
              onClick={() => descargarReporte(`/api/pedidos/${pedido.id}/imprimir`, token, `pedido-${pedido.id}.pdf`)
                .catch((err: unknown) => setError(err instanceof ErrorApi ? err.message : "No se pudo imprimir."))}>
              Imprimir hoja
            </button>
          )}
          {puedeOperar && activo && !tieneRevision && (
            <button className="boton boton--secundario" type="button" disabled={ocupado} onClick={() => onEditar(pedido)}>
              Editar
            </button>
          )}
          {puedeOperar && activo && !tieneRevision && (
            <button className="boton boton--secundario" type="button" disabled={ocupado}
              onClick={() => {
                if (window.confirm(`¿Cancelar el pedido #${pedido.id}?`)) {
                  ejecutar(() => cancelarPedido(token, pedido.id), "Pedido cancelado.");
                }
              }}>
              Cancelar pedido
            </button>
          )}
          {puedeControlar && activo && todosRecogidos && revisionCompleta && (
            <button className="boton boton--primario" type="button" disabled={ocupado}
              onClick={() => {
                if (window.confirm("¿Cerrar el pedido? Confirma que no hubo faltantes ni daños pendientes.")) {
                  ejecutar(() => cerrarPedido(token, pedido.id), "Pedido cerrado.");
                }
              }}>
              Cerrar pedido
            </button>
          )}
        </div>

        {pendienteRecoger && <Aviso tipo="info">Las piezas de este pedido todavía no se han recogido.</Aviso>}
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
            {pedido.lineas.map((l) => (
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

      {puedeControlar && activo && pedido.entregadoEn && (
        <RevisionArticulos
          token={token}
          pedido={pedido}
          articulos={articulos}
          ejecutar={ejecutar}
        />
      )}

      {puedeControlar && activo && (
        <Danos token={token} pedido={pedido} articulos={articulos} ejecutar={ejecutar} />
      )}

      {puedeControlar && (
        <div className="panel">
          <h3 className="panel__titulo">Resoluciones de daños</h3>
          {articulos.every((a) => a.resoluciones.length === 0) && <p className="texto-lead">No hay daños registrados.</p>}
          <ul className="entrega__lineas">
            {articulos.flatMap((a) =>
              a.resoluciones.map((r) => (
                <li key={r.id}>
                  {a.descripcion}: {r.cantidad} · {nombresTipo[r.tipo]}
                  {r.motivo ? ` · ${r.motivo}` : ""}
                  {r.monto !== null ? ` · ${formatoDinero.format(r.monto)}` : ""}
                </li>
              )),
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

type Ejecutar = (accion: () => Promise<Pedido>, mensajeOk: string) => Promise<void>;

function RevisionArticulos({
  token,
  pedido,
  articulos,
  ejecutar,
}: {
  token: string;
  pedido: Pedido;
  articulos: ArticuloPedido[];
  ejecutar: Ejecutar;
}) {
  const [valores, setValores] = useState<Record<number, { devuelta: string; daniada: string }>>(() =>
    Object.fromEntries(
      articulos.map((a) => [
        a.id,
        {
          devuelta: a.cantidadDevuelta !== null ? String(a.cantidadDevuelta) : "",
          daniada: String(a.cantidadDaniada),
        },
      ]),
    ),
  );

  const bloqueado = articulos.some((a) => a.resoluciones.length > 0);

  function cambiar(id: number, campo: "devuelta" | "daniada", valor: string) {
    setValores((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  }

  function guardar() {
    const items: RevisionArticulo[] = articulos
      .filter((a) => valores[a.id]?.devuelta !== "")
      .map((a) => ({
        pedidoArticuloId: a.id,
        cantidadDevuelta: Number(valores[a.id].devuelta),
        cantidadDaniada: Number(valores[a.id].daniada || 0),
      }));

    if (items.length === 0) return;
    ejecutar(() => revisarPedido(token, pedido.id, items), "Revisión guardada.");
  }

  return (
    <div className="panel">
      <h3 className="panel__titulo">Revisión de devoluciones</h3>
      <p className="texto-caption">
        Escribe cuántas piezas regresaron en buen estado y cuántas dañadas. Lo que no regresó se descuenta del inventario.
      </p>
      {bloqueado && <Aviso>Hay artículos con daños resueltos: su revisión ya no se puede cambiar.</Aviso>}

      <div className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th>Artículo</th>
              <th className="numero">Entregado</th>
              <th className="numero">Buen estado</th>
              <th className="numero">Dañado</th>
              <th className="numero">Faltante</th>
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => {
              const v = valores[a.id] ?? { devuelta: "", daniada: "0" };
              const faltante = v.devuelta !== "" ? a.cantidad - Number(v.devuelta) - Number(v.daniada || 0) : null;
              return (
                <tr key={a.id}>
                  <td>{a.descripcion}</td>
                  <td className="numero">{a.cantidad}</td>
                  <td className="numero">
                    <input className="campo__input" type="number" min={0} max={a.cantidad} disabled={bloqueado}
                      value={v.devuelta} onChange={(e) => cambiar(a.id, "devuelta", e.target.value)} />
                  </td>
                  <td className="numero">
                    <input className="campo__input" type="number" min={0} max={a.cantidad} disabled={bloqueado}
                      value={v.daniada} onChange={(e) => cambiar(a.id, "daniada", e.target.value)} />
                  </td>
                  <td className="numero">{faltante !== null ? (faltante < 0 ? "Revisa" : faltante) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="lista-acciones">
        <button className="boton boton--primario" type="button" disabled={bloqueado} onClick={guardar}>
          Guardar revisión
        </button>
      </div>
    </div>
  );
}

function Danos({ token, pedido, articulos, ejecutar }: { token: string; pedido: Pedido; articulos: ArticuloPedido[]; ejecutar: Ejecutar }) {
  const conDanos = articulos.filter((a) => a.danosSinResolver > 0 && a.cantidadDevuelta !== null);
  const [forma, setForma] = useState<Record<number, { tipo: TipoResolucion; cantidad: number; motivo: string; monto: string }>>({});

  if (conDanos.length === 0) return null;

  function valor(a: ArticuloPedido) {
    return forma[a.id] ?? { tipo: "Reparado" as TipoResolucion, cantidad: a.danosSinResolver, motivo: "", monto: "" };
  }

  function cambiar(a: ArticuloPedido, cambio: Partial<ReturnType<typeof valor>>) {
    setForma((prev) => ({ ...prev, [a.id]: { ...valor(a), ...cambio } }));
  }

  function registrar(a: ArticuloPedido) {
    const f = valor(a);
    const cuerpo: ResolucionDano = {
      pedidoArticuloId: a.id,
      tipo: f.tipo,
      cantidad: f.cantidad,
      motivo: f.motivo.trim() || null,
      monto: f.tipo === "Cobrado" ? Number(f.monto) : null,
    };
    ejecutar(() => resolverDano(token, pedido.id, cuerpo), "Daño resuelto.");
  }

  return (
    <div className="panel">
      <h3 className="panel__titulo">Piezas dañadas por resolver</h3>
      <p className="texto-caption">Cada pieza dañada se repara, se da de baja o se cobra al cliente. El pedido no cierra mientras haya piezas sin resolver.</p>
      {conDanos.map((a) => {
        const f = valor(a);
        return (
          <div key={a.id} className="formulario panel">
            <strong className="formulario__completo">
              {a.descripcion}: {a.danosSinResolver} por resolver
            </strong>
            <Campo etiqueta="Resolución">
              <select className="campo__input" value={f.tipo} onChange={(e) => cambiar(a, { tipo: e.target.value as TipoResolucion })}>
                {(Object.keys(nombresTipo) as TipoResolucion[]).map((t) => (
                  <option key={t} value={t}>{nombresTipo[t]}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Piezas">
              <input className="campo__input" type="number" min={1} max={a.danosSinResolver} value={f.cantidad}
                onChange={(e) => cambiar(a, { cantidad: Number(e.target.value) })} />
            </Campo>
            {f.tipo === "DadoDeBaja" && (
              <Campo etiqueta="Motivo de la baja" className="formulario__completo">
                <input className="campo__input" required maxLength={300} value={f.motivo}
                  onChange={(e) => cambiar(a, { motivo: e.target.value })} />
              </Campo>
            )}
            {f.tipo === "Cobrado" && (
              <Campo etiqueta="Monto a cobrar (MXN)">
                <input className="campo__input" type="number" min={0.01} step="0.01" value={f.monto}
                  onChange={(e) => cambiar(a, { monto: e.target.value })} />
              </Campo>
            )}
            <div className="formulario__botones">
              <button className="boton boton--primario" type="button" onClick={() => registrar(a)}>Registrar</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
