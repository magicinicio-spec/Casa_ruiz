import { Cargando } from "./Cargando";
import { useCallback, useEffect, useState } from "react";
import {
  colaEntregas,
  entregarPedido,
  ErrorApi,
  type Pedido,
  porRecogerEntregas,
  recogerPedido,
} from "./api";
import { formatoDinero } from "./Dashboard";
import { notificar } from "./Notificaciones";

type Pestana = "cola" | "recoger";

interface Props {
  token: string;
}

export default function Entregas({ token }: Props) {
  const [pestana, setPestana] = useState<Pestana>("cola");
  const [cola, setCola] = useState<Pedido[] | null>(null);
  const [porRecoger, setPorRecoger] = useState<Pedido[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [nuevaCola, nuevosRecoger] = await Promise.all([colaEntregas(token), porRecogerEntregas(token)]);
      setCola(nuevaCola);
      setPorRecoger(nuevosRecoger);
      setError(null);
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudieron cargar las entregas.");
    }
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function accion(pedido: Pedido, tipo: "entregar" | "recoger") {
    const pregunta =
      tipo === "entregar"
        ? `¿Marcar el pedido #${pedido.id} como entregado?`
        : `¿Marcar como recogidas las piezas del pedido #${pedido.id}?`;
    if (!window.confirm(pregunta)) return;

    setOcupado(pedido.id);
    try {
      await (tipo === "entregar" ? entregarPedido(token, pedido.id) : recogerPedido(token, pedido.id));
      notificar(tipo === "entregar" ? `Pedido #${pedido.id} entregado.` : `Piezas del pedido #${pedido.id} recogidas.`);
      await cargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo registrar la acción.");
    } finally {
      setOcupado(null);
    }
  }

  const lista = pestana === "cola" ? cola : porRecoger;

  return (
    <section className="entregas">
      <nav className="pestanas" aria-label="Entregas">
        <button
          type="button"
          className={`boton pestanita${pestana === "cola" ? " pestanita--activa" : ""}`}
          aria-pressed={pestana === "cola"}
          onClick={() => setPestana("cola")}
        >
          Por entregar{cola ? ` (${cola.length})` : ""}
        </button>
        <button
          type="button"
          className={`boton pestanita${pestana === "recoger" ? " pestanita--activa" : ""}`}
          aria-pressed={pestana === "recoger"}
          onClick={() => setPestana("recoger")}
        >
          Por recoger{porRecoger ? ` (${porRecoger.length})` : ""}
        </button>
      </nav>

      {error && <p className="login__error" role="alert">{error}</p>}

      {!lista && !error && <Cargando />}

      {lista && lista.length === 0 && (
        <p className="texto-lead">
          {pestana === "cola" ? "No hay pedidos por entregar." : "No hay piezas pendientes de recoger."}
        </p>
      )}

      {lista && lista.length > 0 && (
        <div className="animar entregas__lista">
          {lista.map((pedido) => (
            <article key={pedido.id} className="tarjeta entrega">
              <header className="entrega__encabezado">
                <h2 className="titulo-subheading">
                  #{pedido.id} · {pedido.clienteNombre}
                </h2>
                <a className="entrega__telefono" href={`tel:${pedido.clienteTelefono}`}>
                  {pedido.clienteTelefono}
                </a>
              </header>

              <p className="entrega__direccion">{pedido.direccionEntrega}</p>

              <dl className="datos">
                <div className="dato">
                  <dt>Entrega</dt>
                  <dd>{pedido.fechaHoraEntrega}</dd>
                </div>
                <div className="dato">
                  <dt>Devolución</dt>
                  <dd>{pedido.fechaDevolucion}</dd>
                </div>
                <div className="dato">
                  <dt>Pago</dt>
                  <dd>{pedido.pagado ? "Pagado" : `Saldo ${formatoDinero.format(pedido.saldo)}`}</dd>
                </div>
              </dl>

              <ul className="entrega__lineas">
                {pedido.lineas.map((linea) => (
                  <li key={linea.id}>
                    {linea.cantidad} × {linea.descripcion}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="boton boton--primario"
                disabled={ocupado === pedido.id}
                onClick={() => accion(pedido, pestana === "cola" ? "entregar" : "recoger")}
              >
                {pestana === "cola" ? "Marcar entregado" : "Marcar recogido"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
