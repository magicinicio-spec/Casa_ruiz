import { notificar } from "./Notificaciones";
import { Cargando } from "./Cargando";
import { type FormEvent, useEffect, useState } from "react";
import { ErrorApi } from "./api";
import { formatoDinero } from "./Dashboard";
import { Aviso, Campo, Encabezado, Vacio } from "./ui";
import { type Articulo, type ArticuloEntrada, actualizarArticulo, crearArticulo, listarArticulos } from "./recursos";

interface Props {
  token: string;
}

const vacio: ArticuloEntrada = { descripcion: "", categoria: "", precioRenta: 0, existenciaTotal: 0 };

export default function Inventario({ token }: Props) {
  const [articulos, setArticulos] = useState<Articulo[] | null>(null);
  const [categoria, setCategoria] = useState("");
  const [edicion, setEdicion] = useState<Articulo | "nuevo" | null>(null);
  const [form, setForm] = useState<ArticuloEntrada>(vacio);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  async function cargar() {
    try {
      setArticulos(await listarArticulos(token, categoria.trim()));
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo cargar el inventario.");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, categoria]);

  function abrir(articulo: Articulo | "nuevo") {
    setError(null);
    setExito(null);
    setEdicion(articulo);
    setForm(articulo === "nuevo" ? vacio : { ...articulo });
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (edicion === "nuevo") {
        await crearArticulo(token, form);
        setExito("Artículo agregado.");
      notificar("Artículo agregado.");
      } else if (edicion) {
        await actualizarArticulo(token, edicion.id, form);
        setExito("Artículo actualizado.");
      notificar("Artículo actualizado.");
      }
      setEdicion(null);
      await cargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo guardar el artículo.");
    }
  }

  const actualizar = <K extends keyof ArticuloEntrada>(campo: K, valor: ArticuloEntrada[K]) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  return (
    <section className="seccion">
      <Encabezado
        titulo="Inventario"
        accion={
          <button className="boton boton--primario" type="button" onClick={() => abrir("nuevo")}>
            Nuevo artículo
          </button>
        }
      />

      {error && <Aviso>{error}</Aviso>}
      {exito && <Aviso tipo="info">{exito}</Aviso>}

      {edicion && (
        <form className="panel formulario" onSubmit={guardar}>
          <h2 className="panel__titulo formulario__completo">
            {edicion === "nuevo" ? "Nuevo artículo" : `Editar: ${edicion.descripcion}`}
          </h2>
          <Campo etiqueta="Descripción">
            <input className="campo__input" required maxLength={200} value={form.descripcion}
              onChange={(e) => actualizar("descripcion", e.target.value)} />
          </Campo>
          <Campo etiqueta="Categoría">
            <input className="campo__input" required maxLength={100} value={form.categoria}
              onChange={(e) => actualizar("categoria", e.target.value)} />
          </Campo>
          <Campo etiqueta="Precio de renta (MXN)">
            <input className="campo__input" type="number" min={0} step="0.01" required value={form.precioRenta}
              onChange={(e) => actualizar("precioRenta", Number(e.target.value))} />
          </Campo>
          <Campo etiqueta="Existencia total (piezas)">
            <input className="campo__input" type="number" min={0} step={1} required value={form.existenciaTotal}
              onChange={(e) => actualizar("existenciaTotal", Number(e.target.value))} />
          </Campo>
          <div className="formulario__botones">
            <button className="boton boton--primario" type="submit">Guardar</button>
            <button className="boton boton--secundario" type="button" onClick={() => setEdicion(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="buscador">
        <Campo etiqueta="Filtrar por categoría">
          <input className="campo__input" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        </Campo>
      </div>

      {!articulos && !error && <Cargando />}
      {articulos && articulos.length === 0 && <Vacio>No hay artículos para mostrar.</Vacio>}

      {articulos && articulos.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Categoría</th>
                <th className="numero">Precio de renta</th>
                <th className="numero">Existencia</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {articulos.map((a) => (
                <tr key={a.id}>
                  <td>{a.descripcion}</td>
                  <td>{a.categoria}</td>
                  <td className="numero">{formatoDinero.format(a.precioRenta)}</td>
                  <td className="numero">{a.existenciaTotal}</td>
                  <td>
                    <button className="boton boton--secundario boton--chico" type="button" onClick={() => abrir(a)}>
                      Editar
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
