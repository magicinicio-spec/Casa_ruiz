import { notificar } from "./Notificaciones";
import { Cargando } from "./Cargando";
import { useEffect, useState } from "react";
import { type Pedido, ErrorApi } from "./api";
import { formatoDinero } from "./Dashboard";
import PedidoDetalle from "./PedidoDetalle";
import PedidoForm, { AvisosInventario } from "./PedidoForm";
import {
  type Articulo,
  type Cliente,
  type Paquete,
  type PedidoGuardado,
  listarArticulos,
  listarClientes,
  listarPaquetes,
  listarPedidos,
} from "./recursos";
import { Aviso, Encabezado, Vacio } from "./ui";

interface Props {
  token: string;
  puedeOperar: boolean;
  puedeControlar: boolean;
}

type Vista =
  | { modo: "lista" }
  | { modo: "nuevo" }
  | { modo: "editar"; pedido: Pedido }
  | { modo: "detalle"; id: number };

const estados = [
  { valor: "", etiqueta: "Todos" },
  { valor: "Activo", etiqueta: "Activos" },
  { valor: "Cerrado", etiqueta: "Cerrados" },
  { valor: "Cancelado", etiqueta: "Cancelados" },
];

export default function Pedidos({ token, puedeOperar, puedeControlar }: Props) {
  const [vista, setVista] = useState<Vista>({ modo: "lista" });
  const [estado, setEstado] = useState("Activo");
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<PedidoGuardado["advertencias"]>([]);
  const [exito, setExito] = useState<string | null>(null);

  async function cargarLista() {
    try {
      setPedidos(await listarPedidos(token, estado));
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudieron cargar los pedidos.");
    }
  }

  useEffect(() => {
    cargarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, estado]);

  useEffect(() => {
    if (vista.modo === "lista") return;
    Promise.all([listarClientes(token), listarArticulos(token), listarPaquetes(token)])
      .then(([c, a, p]) => {
        setClientes(c);
        setArticulos(a);
        setPaquetes(p);
      })
      .catch((err: unknown) => setError(err instanceof ErrorApi ? err.message : "No se pudieron cargar los datos del pedido."));
  }, [token, vista.modo]);

  function guardado(resultado: PedidoGuardado) {
    setAvisos(resultado.advertencias);
    setExito(`Pedido #${resultado.pedido.id} guardado.`);
      notificar(`Pedido #${resultado.pedido.id} guardado.`);
    setVista({ modo: "detalle", id: resultado.pedido.id });
    cargarLista();
  }

  if (vista.modo === "nuevo" || vista.modo === "editar") {
    return (
      <section className="seccion">
        <Encabezado titulo={vista.modo === "nuevo" ? "Nuevo pedido" : `Pedido #${vista.pedido.id}`} />
        {error && <Aviso>{error}</Aviso>}
        {clientes.length === 0 ? (
          <Vacio>Primero agrega un cliente para poder crear pedidos.</Vacio>
        ) : (
          <PedidoForm
            key={vista.modo === "editar" ? vista.pedido.id : "nuevo"}
            token={token}
            clientes={clientes}
            articulos={articulos}
            paquetes={paquetes}
            pedido={vista.modo === "editar" ? vista.pedido : undefined}
            onGuardado={guardado}
            onClienteNuevo={(cliente) => setClientes((prev) => [...prev, cliente])}
            onCancelar={() => setVista(vista.modo === "editar" ? { modo: "detalle", id: vista.pedido.id } : { modo: "lista" })}
          />
        )}
        <AvisosInventario advertencias={avisos} />
      </section>
    );
  }

  if (vista.modo === "detalle") {
    return (
      <section className="seccion">
        <div className="encabezado-seccion">
          <h1 className="titulo-heading-lg">Pedido #{vista.id}</h1>
          <button className="boton boton--secundario" type="button" onClick={() => { setVista({ modo: "lista" }); setAvisos([]); setExito(null); }}>
            Volver a pedidos
          </button>
        </div>
        {exito && <Aviso tipo="info">{exito}</Aviso>}
        <AvisosInventario advertencias={avisos} />
        <PedidoDetalle
          key={vista.id}
          token={token}
          id={vista.id}
          puedeOperar={puedeOperar}
          puedeControlar={puedeControlar}
          onEditar={(pedido) => setVista({ modo: "editar", pedido })}
          onCambio={cargarLista}
        />
      </section>
    );
  }

  return (
    <section className="seccion">
      <Encabezado
        titulo="Pedidos"
        accion={
          puedeOperar ? (
            <button className="boton boton--primario" type="button" onClick={() => { setError(null); setAvisos([]); setExito(null); setVista({ modo: "nuevo" }); }}>
              Nuevo pedido
            </button>
          ) : undefined
        }
      />

      <nav className="pestanas" aria-label="Estado de los pedidos">
        {estados.map((e) => (
          <button
            key={e.valor}
            type="button"
            className={`boton pestanita${estado === e.valor ? " pestanita--activa" : ""}`}
            aria-pressed={estado === e.valor}
            onClick={() => setEstado(e.valor)}
          >
            {e.etiqueta}
          </button>
        ))}
      </nav>

      {error && <Aviso>{error}</Aviso>}
      {!pedidos && !error && <Cargando />}
      {pedidos && pedidos.length === 0 && <Vacio>No hay pedidos en esta lista.</Vacio>}

      {pedidos && pedidos.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Entrega</th>
                <th>Estado</th>
                <th className="numero">Total</th>
                <th>Pago</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>{p.clienteNombre}</td>
                  <td>{p.fechaHoraEntrega}</td>
                  <td><span className="estado">{p.estado}</span></td>
                  <td className="numero">{formatoDinero.format(p.total)}</td>
                  <td>{p.pagado ? "Pagado" : "No pagado"}</td>
                  <td>
                    <button className="boton boton--secundario boton--chico" type="button"
                      onClick={() => { setAvisos([]); setExito(null); setVista({ modo: "detalle", id: p.id }); }}>
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
