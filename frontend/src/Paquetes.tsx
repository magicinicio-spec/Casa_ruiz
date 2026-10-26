import { type FormEvent, useEffect, useState } from "react";
import { ErrorApi } from "./api";
import { formatoDinero } from "./Dashboard";
import { Aviso, Campo, Encabezado, Vacio } from "./ui";
import {
  type Articulo,
  type Paquete,
  actualizarPaquete,
  crearPaquete,
  listarArticulos,
  listarPaquetes,
} from "./recursos";

interface Props {
  token: string;
}

interface Componente {
  articuloId: number;
  cantidad: number;
}

export default function Paquetes({ token }: Props) {
  const [paquetes, setPaquetes] = useState<Paquete[] | null>(null);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [edicion, setEdicion] = useState<Paquete | "nuevo" | null>(null);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState(0);
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  async function cargar() {
    try {
      const [listaPaquetes, listaArticulos] = await Promise.all([listarPaquetes(token), listarArticulos(token)]);
      setPaquetes(listaPaquetes);
      setArticulos(listaArticulos);
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudieron cargar los paquetes.");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function abrir(paquete: Paquete | "nuevo") {
    setError(null);
    setExito(null);
    setEdicion(paquete);
    if (paquete === "nuevo") {
      setNombre("");
      setPrecio(0);
      setComponentes([{ articuloId: articulos[0]?.id ?? 0, cantidad: 1 }]);
    } else {
      setNombre(paquete.nombre);
      setPrecio(paquete.precioRenta);
      setComponentes(paquete.componentes.map((c) => ({ articuloId: c.articuloId, cantidad: c.cantidad })));
    }
  }

  function cambiarComponente(indice: number, cambio: Partial<Componente>) {
    setComponentes((prev) => prev.map((c, i) => (i === indice ? { ...c, ...cambio } : c)));
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cuerpo = { nombre, precioRenta: precio, componentes };
    try {
      if (edicion === "nuevo") {
        await crearPaquete(token, cuerpo);
        setExito("Paquete creado.");
      } else if (edicion) {
        await actualizarPaquete(token, edicion.id, cuerpo);
        setExito("Paquete actualizado.");
      }
      setEdicion(null);
      await cargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo guardar el paquete.");
    }
  }

  return (
    <section className="seccion">
      <Encabezado
        titulo="Paquetes"
        accion={
          <button className="boton boton--primario" type="button" onClick={() => abrir("nuevo")}>
            Nuevo paquete
          </button>
        }
      />

      {error && <Aviso>{error}</Aviso>}
      {exito && <Aviso tipo="info">{exito}</Aviso>}

      {edicion && (
        <form className="panel" onSubmit={guardar}>
          <h2 className="panel__titulo">{edicion === "nuevo" ? "Nuevo paquete" : `Editar: ${edicion.nombre}`}</h2>
          <div className="formulario">
            <Campo etiqueta="Nombre">
              <input className="campo__input" required maxLength={200} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </Campo>
            <Campo etiqueta="Precio del paquete (MXN)">
              <input className="campo__input" type="number" min={0} step="0.01" required value={precio}
                onChange={(e) => setPrecio(Number(e.target.value))} />
            </Campo>
          </div>

          <div className="lista-acciones">
            <strong>Artículos del paquete</strong>
          </div>
          {componentes.map((c, i) => (
            <div key={i} className="fila-editable">
              <Campo etiqueta="Artículo">
                <select className="campo__input" value={c.articuloId}
                  onChange={(e) => cambiarComponente(i, { articuloId: Number(e.target.value) })}>
                  {articulos.map((a) => (
                    <option key={a.id} value={a.id}>{a.descripcion}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Cantidad">
                <input className="campo__input" type="number" min={1} step={1} required value={c.cantidad}
                  onChange={(e) => cambiarComponente(i, { cantidad: Number(e.target.value) })} />
              </Campo>
              <button className="boton boton--secundario boton--chico" type="button"
                disabled={componentes.length === 1}
                onClick={() => setComponentes((prev) => prev.filter((_, j) => j !== i))}>
                Quitar
              </button>
            </div>
          ))}
          <div className="lista-acciones">
            <button className="boton boton--secundario boton--chico" type="button"
              onClick={() => setComponentes((prev) => [...prev, { articuloId: articulos[0]?.id ?? 0, cantidad: 1 }])}>
              Agregar artículo
            </button>
          </div>

          <div className="lista-acciones">
            <button className="boton boton--primario" type="submit">Guardar</button>
            <button className="boton boton--secundario" type="button" onClick={() => setEdicion(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {!paquetes && !error && <Vacio>Cargando…</Vacio>}
      {paquetes && paquetes.length === 0 && <Vacio>Todavía no hay paquetes.</Vacio>}

      {paquetes && paquetes.length > 0 && (
        <div className="dos-columnas">
          {paquetes.map((p) => (
            <article key={p.id} className="tarjeta">
              <div className="encabezado-seccion">
                <h2 className="titulo-subheading">{p.nombre}</h2>
                <span className="cifra-chica">{formatoDinero.format(p.precioRenta)}</span>
              </div>
              <ul className="entrega__lineas">
                {p.componentes.map((c) => (
                  <li key={c.articuloId}>{c.cantidad} × {c.descripcion}</li>
                ))}
              </ul>
              <div>
                <button className="boton boton--secundario boton--chico" type="button" onClick={() => abrir(p)}>
                  Editar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
