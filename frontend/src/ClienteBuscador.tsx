import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { ErrorApi } from "./api";
import { type Cliente, crearCliente } from "./recursos";
import { Aviso, Campo } from "./ui";

interface Props {
  token: string;
  clientes: Cliente[];
  valor: number;
  onChange: (id: number) => void;
  onClienteNuevo: (cliente: Cliente) => void;
}

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Campo de búsqueda de clientes: se filtra por nombre o teléfono mientras se escribe. */
export default function ClienteBuscador({ token, clientes, valor, onChange, onClienteNuevo }: Props) {
  const seleccionado = clientes.find((c) => c.id === valor);
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(0);
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState({ nombreCompleto: "", telefono: "", direccion: "" });
  const [error, setError] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const coincidencias = useMemo(() => {
    const busqueda = normalizar(texto.trim());
    if (!busqueda) return clientes.slice(0, 8);
    return clientes
      .filter((c) => normalizar(c.nombreCompleto).includes(busqueda) || c.telefono.includes(busqueda))
      .slice(0, 8);
  }, [clientes, texto]);

  function elegir(cliente: Cliente) {
    onChange(cliente.id);
    setTexto("");
    setAbierto(false);
    setCreando(false);
  }

  function teclado(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAbierto(true);
      setResaltado((r) => Math.min(r + 1, coincidencias.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setResaltado((r) => Math.max(r - 1, 0));
    } else if (e.key === "Enter" && abierto && coincidencias[resaltado]) {
      e.preventDefault();
      elegir(coincidencias[resaltado]);
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  }

  async function guardarNuevo() {
    setError(null);
    try {
      const cliente = await crearCliente(token, nuevo);
      onClienteNuevo(cliente);
      elegir(cliente);
      setNuevo({ nombreCompleto: "", telefono: "", direccion: "" });
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo guardar el cliente.");
    }
  }

  return (
    <div className="buscador-cliente">
      <Campo etiqueta="Cliente">
        <input
          ref={entrada}
          className="campo__input"
          role="combobox"
          aria-expanded={abierto}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={seleccionado ? seleccionado.nombreCompleto : "Escribe nombre o teléfono"}
          value={texto}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 120)}
          onChange={(e) => {
            setTexto(e.target.value);
            setResaltado(0);
            setAbierto(true);
          }}
          onKeyDown={teclado}
        />
      </Campo>

      {seleccionado && !texto && (
        <p className="texto-caption buscador-cliente__seleccion">
          Seleccionado: <strong>{seleccionado.nombreCompleto}</strong> · {seleccionado.telefono}
        </p>
      )}

      {abierto && !creando && (
        <ul className="buscador-cliente__lista" role="listbox">
          {coincidencias.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === resaltado}
              className={`buscador-cliente__opcion${i === resaltado ? " buscador-cliente__opcion--activa" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(c);
              }}
              onMouseEnter={() => setResaltado(i)}
            >
              <span>{c.nombreCompleto}</span>
              <span className="texto-caption">{c.telefono}</span>
            </li>
          ))}
          {coincidencias.length === 0 && (
            <li className="buscador-cliente__vacio">
              <span>No hay clientes con "{texto}".</span>
              <button
                type="button"
                className="boton boton--secundario boton--chico"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setNuevo((n) => ({ ...n, nombreCompleto: texto }));
                  setCreando(true);
                }}
              >
                Agregar cliente nuevo
              </button>
            </li>
          )}
        </ul>
      )}

      {creando && (
        <div className="panel buscador-cliente__nuevo">
          <strong>Cliente nuevo</strong>
          {error && <Aviso>{error}</Aviso>}
          <Campo etiqueta="Nombre completo">
            <input className="campo__input" required value={nuevo.nombreCompleto}
              onChange={(e) => setNuevo({ ...nuevo, nombreCompleto: e.target.value })} />
          </Campo>
          <Campo etiqueta="Teléfono">
            <input className="campo__input" required value={nuevo.telefono}
              onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} />
          </Campo>
          <Campo etiqueta="Dirección">
            <input className="campo__input" required value={nuevo.direccion}
              onChange={(e) => setNuevo({ ...nuevo, direccion: e.target.value })} />
          </Campo>
          <div className="lista-acciones">
            <button type="button" className="boton boton--primario boton--chico" onClick={guardarNuevo}>
              Guardar y elegir
            </button>
            <button type="button" className="boton boton--secundario boton--chico" onClick={() => setCreando(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
