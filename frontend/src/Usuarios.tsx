import { type FormEvent, useEffect, useState } from "react";
import { type RolUsuario, type Usuario, ErrorApi } from "./api";
import { Aviso, Campo, Encabezado, Vacio } from "./ui";
import {
  actualizarUsuario,
  cambiarActivoUsuario,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  restablecerPassword,
  type UsuarioEntrada,
} from "./recursos";

interface Props {
  token: string;
  idActual: number;
}

const nombresDeRol: Record<RolUsuario, string> = {
  Administrador: "Administrador",
  Superior: "Superior",
  Vendedor: "Vendedor",
  Repartidor: "Repartidor",
  VendedorRepartidor: "Vendedor y repartidor",
};

const vacio: UsuarioEntrada & { password: string } = {
  nombreCompleto: "",
  telefono: "",
  nombreUsuario: "",
  rol: "Vendedor",
  password: "",
};

export default function Usuarios({ token, idActual }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [edicion, setEdicion] = useState<Usuario | "nuevo" | null>(null);
  const [form, setForm] = useState(vacio);
  const [nuevaPassword, setNuevaPassword] = useState<{ id: number; valor: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  async function cargar() {
    try {
      setUsuarios(await listarUsuarios(token));
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudieron cargar los usuarios.");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function abrir(usuario: Usuario | "nuevo") {
    setError(null);
    setExito(null);
    setEdicion(usuario);
    setForm(
      usuario === "nuevo"
        ? vacio
        : { nombreCompleto: usuario.nombreCompleto, telefono: usuario.telefono, nombreUsuario: usuario.nombreUsuario, rol: usuario.rol, password: "" },
    );
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (edicion === "nuevo") {
        await crearUsuario(token, form);
        setExito("Usuario creado.");
      } else if (edicion) {
        const { password: _omitida, ...datos } = form;
        await actualizarUsuario(token, edicion.id, datos);
        setExito("Usuario actualizado.");
      }
      setEdicion(null);
      await cargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo guardar el usuario.");
    }
  }

  async function accion(fn: () => Promise<unknown>, mensaje: string) {
    setError(null);
    setExito(null);
    try {
      await fn();
      setExito(mensaje);
      await cargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo completar la acción.");
    }
  }

  const actualizar = <K extends keyof (typeof vacio)>(campo: K, valor: (typeof vacio)[K]) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  return (
    <section className="seccion">
      <Encabezado
        titulo="Usuarios"
        accion={
          <button className="boton boton--primario" type="button" onClick={() => abrir("nuevo")}>
            Nuevo usuario
          </button>
        }
      />

      {error && <Aviso>{error}</Aviso>}
      {exito && <Aviso tipo="info">{exito}</Aviso>}

      {edicion && (
        <form className="panel formulario" onSubmit={guardar}>
          <h2 className="panel__titulo formulario__completo">
            {edicion === "nuevo" ? "Nuevo usuario" : `Editar: ${edicion.nombreCompleto}`}
          </h2>
          <Campo etiqueta="Nombre completo">
            <input className="campo__input" required maxLength={200} value={form.nombreCompleto}
              onChange={(e) => actualizar("nombreCompleto", e.target.value)} />
          </Campo>
          <Campo etiqueta="Teléfono">
            <input className="campo__input" required maxLength={30} value={form.telefono}
              onChange={(e) => actualizar("telefono", e.target.value)} />
          </Campo>
          <Campo etiqueta="Nombre de usuario">
            <input className="campo__input" required maxLength={50} value={form.nombreUsuario}
              onChange={(e) => actualizar("nombreUsuario", e.target.value)} />
          </Campo>
          <Campo etiqueta="Rol">
            <select className="campo__input" value={form.rol} onChange={(e) => actualizar("rol", e.target.value as RolUsuario)}>
              {(Object.keys(nombresDeRol) as RolUsuario[]).map((r) => (
                <option key={r} value={r}>{nombresDeRol[r]}</option>
              ))}
            </select>
          </Campo>
          {edicion === "nuevo" && (
            <Campo etiqueta="Contraseña inicial (mínimo 8 caracteres)" className="formulario__completo">
              <input className="campo__input" type="password" required minLength={8} maxLength={100} value={form.password}
                onChange={(e) => actualizar("password", e.target.value)} autoComplete="new-password" />
            </Campo>
          )}
          <div className="formulario__botones">
            <button className="boton boton--primario" type="submit">Guardar</button>
            <button className="boton boton--secundario" type="button" onClick={() => setEdicion(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {!usuarios && !error && <Vacio>Cargando…</Vacio>}

      {usuarios && usuarios.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const esYo = u.id === idActual;
                return (
                  <tr key={u.id}>
                    <td>{u.nombreCompleto}{esYo && <span className="texto-caption bloque">(tú)</span>}</td>
                    <td>{u.nombreUsuario}</td>
                    <td>{nombresDeRol[u.rol]}</td>
                    <td><span className="estado">{u.activo ? "Activo" : "Inactivo"}</span></td>
                    <td>
                      <div className="lista-acciones">
                        <button className="boton boton--secundario boton--chico" type="button" onClick={() => abrir(u)}>Editar</button>
                        <button className="boton boton--secundario boton--chico" type="button"
                          onClick={() => setNuevaPassword({ id: u.id, valor: "" })}>
                          Restablecer contraseña
                        </button>
                        {!esYo && (
                          <button className="boton boton--secundario boton--chico" type="button"
                            onClick={() => accion(() => cambiarActivoUsuario(token, u.id, !u.activo), u.activo ? "Usuario desactivado." : "Usuario activado.")}>
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>
                        )}
                        {!esYo && (
                          <button className="boton boton--secundario boton--chico" type="button"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar a ${u.nombreCompleto}? Esta acción no se puede deshacer.`)) {
                                accion(() => eliminarUsuario(token, u.id), "Usuario eliminado.");
                              }
                            }}>
                            Eliminar
                          </button>
                        )}
                      </div>
                      {nuevaPassword?.id === u.id && (
                        <form className="lista-acciones"
                          onSubmit={(e) => {
                            e.preventDefault();
                            accion(() => restablecerPassword(token, u.id, nuevaPassword.valor), "Contraseña restablecida.");
                            setNuevaPassword(null);
                          }}>
                          <Campo etiqueta="Nueva contraseña">
                            <input className="campo__input" type="password" required minLength={8} maxLength={100}
                              value={nuevaPassword.valor} autoComplete="new-password"
                              onChange={(e) => setNuevaPassword({ id: u.id, valor: e.target.value })} />
                          </Campo>
                          <button className="boton boton--primario boton--chico" type="submit">Guardar</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

