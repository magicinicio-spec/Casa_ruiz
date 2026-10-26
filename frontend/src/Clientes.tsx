import { type FormEvent, useEffect, useState } from "react";
import { ErrorApi } from "./api";
import { Aviso, Campo, Encabezado, Vacio } from "./ui";
import { type Cliente, type ClienteEntrada, actualizarCliente, crearCliente, listarClientes } from "./recursos";

interface Props {
  token: string;
}

const vacio: ClienteEntrada = { nombreCompleto: "", telefono: "", direccion: "" };

export default function Clientes({ token }: Props) {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [buscar, setBuscar] = useState("");
  const [edicion, setEdicion] = useState<Cliente | "nuevo" | null>(null);
  const [form, setForm] = useState<ClienteEntrada>(vacio);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  async function cargar() {
    try {
      setClientes(await listarClientes(token, buscar.trim()));
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudieron cargar los clientes.");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, buscar]);

  function abrir(cliente: Cliente | "nuevo") {
    setError(null);
    setExito(null);
    setEdicion(cliente);
    setForm(cliente === "nuevo" ? vacio : { nombreCompleto: cliente.nombreCompleto, telefono: cliente.telefono, direccion: cliente.direccion });
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (edicion === "nuevo") {
        await crearCliente(token, form);
        setExito("Cliente agregado.");
      } else if (edicion) {
        await actualizarCliente(token, edicion.id, form);
        setExito("Cliente actualizado.");
      }
      setEdicion(null);
      await cargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo guardar el cliente.");
    }
  }

  const actualizar = <K extends keyof ClienteEntrada>(campo: K, valor: ClienteEntrada[K]) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  return (
    <section className="seccion">
      <Encabezado
        titulo="Clientes"
        accion={
          <button className="boton boton--primario" type="button" onClick={() => abrir("nuevo")}>
            Nuevo cliente
          </button>
        }
      />

      {error && <Aviso>{error}</Aviso>}
      {exito && <Aviso tipo="info">{exito}</Aviso>}

      {edicion && (
        <form className="panel formulario" onSubmit={guardar}>
          <h2 className="panel__titulo formulario__completo">
            {edicion === "nuevo" ? "Nuevo cliente" : `Editar: ${edicion.nombreCompleto}`}
          </h2>
          <Campo etiqueta="Nombre completo">
            <input className="campo__input" required maxLength={200} value={form.nombreCompleto}
              onChange={(e) => actualizar("nombreCompleto", e.target.value)} />
          </Campo>
          <Campo etiqueta="Teléfono">
            <input className="campo__input" required maxLength={30} value={form.telefono}
              onChange={(e) => actualizar("telefono", e.target.value)} />
          </Campo>
          <Campo etiqueta="Dirección" className="formulario__completo">
            <textarea required maxLength={400} value={form.direccion} onChange={(e) => actualizar("direccion", e.target.value)} />
          </Campo>
          <div className="formulario__botones">
            <button className="boton boton--primario" type="submit">Guardar</button>
            <button className="boton boton--secundario" type="button" onClick={() => setEdicion(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="buscador">
        <Campo etiqueta="Buscar por nombre o teléfono">
          <input className="campo__input" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        </Campo>
      </div>

      {!clientes && !error && <Vacio>Cargando…</Vacio>}
      {clientes && clientes.length === 0 && <Vacio>No hay clientes para mostrar.</Vacio>}

      {clientes && clientes.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombreCompleto}</td>
                  <td>{c.telefono}</td>
                  <td>{c.direccion}</td>
                  <td>
                    <button className="boton boton--secundario boton--chico" type="button" onClick={() => abrir(c)}>
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
