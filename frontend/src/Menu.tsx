import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type Seccion = "dashboard" | "pedidos" | "entregas" | "reportes" | "clientes" | "inventario" | "paquetes" | "usuarios";

export interface ItemMenu {
  id: Seccion;
  nombre: string;
}

export interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

interface Props {
  tema: "oscuro" | "claro";
  onTema: () => void;
  grupos: GrupoMenu[];
  seccion: Seccion;
  onSeccion: (s: Seccion) => void;
  nombreUsuario: string;
  rol: string;
  onSalir: () => void;
}

export default function MenuPrincipal({ tema, onTema, grupos, seccion, onSeccion, nombreUsuario, rol, onSalir }: Props) {
  const [desplegado, setDesplegado] = useState<string | null>(null);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [indicador, setIndicador] = useState<{ left: number; width: number } | null>(null);
  const [, forzarMedida] = useState(0);
  const barra = useRef<HTMLDivElement>(null);
  const navegacion = useRef<HTMLElement>(null);
  const botones = useRef<Record<string, HTMLButtonElement | null>>({});

  // La línea activa se mide en píxeles para poder deslizarse entre grupos.
  useLayoutEffect(() => {
    const grupo = grupos.find((g) => g.items.some((i) => i.id === seccion));
    const boton = grupo ? botones.current[grupo.titulo] : null;
    const contenedor = navegacion.current;
    if (!boton || !contenedor) {
      setIndicador(null);
      return;
    }
    const r = boton.getBoundingClientRect();
    const c = contenedor.getBoundingClientRect();
    setIndicador({ left: r.left - c.left, width: r.width });
  }, [seccion, grupos]);

  useEffect(() => {
    const alCambiar = () => forzarMedida((n) => n + 1);
    window.addEventListener("resize", alCambiar);
    return () => window.removeEventListener("resize", alCambiar);
  }, []);

  // Cierra desplegables al hacer clic fuera o con Escape.
  useEffect(() => {
    function alClic(e: MouseEvent) {
      if (barra.current && !barra.current.contains(e.target as Node)) {
        setDesplegado(null);
        setMenuUsuario(false);
      }
    }
    function alTecla(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDesplegado(null);
        setMenuUsuario(false);
        setHojaAbierta(false);
      }
    }
    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, []);

  function elegir(s: Seccion) {
    onSeccion(s);
    setDesplegado(null);
    setHojaAbierta(false);
  }

  const iniciales = nombreUsuario
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="menu" ref={barra}>
      <div className="menu__barra">
        <span className="menu__marca menu__marca-texto">
          <img src="/logo.png" alt="" className="menu__logo" />
          Casa Ruiz
        </span>

        <nav ref={navegacion} className="menu__nav" aria-label="Secciones">
          {grupos.map((grupo) =>
            grupo.items.length === 1 ? (
              <button
                key={grupo.titulo}
                ref={(el) => { botones.current[grupo.titulo] = el; }}
                type="button"
                className={`menu__opcion${seccion === grupo.items[0].id ? " menu__opcion--activa" : ""}`}
                aria-current={seccion === grupo.items[0].id ? "page" : undefined}
                onClick={() => elegir(grupo.items[0].id)}
              >
                {grupo.items[0].nombre}
              </button>
            ) : (
              <div key={grupo.titulo} className="menu__grupo">
                <button
                  ref={(el) => { botones.current[grupo.titulo] = el; }}
                  type="button"
                  className={`menu__opcion${grupo.items.some((i) => i.id === seccion) ? " menu__opcion--activa" : ""}`}
                  aria-expanded={desplegado === grupo.titulo}
                  onClick={() => setDesplegado(desplegado === grupo.titulo ? null : grupo.titulo)}
                >
                  {grupo.titulo}
                  <span className={`menu__flecha${desplegado === grupo.titulo ? " menu__flecha--abierta" : ""}`} aria-hidden>▾</span>
                </button>
                {desplegado === grupo.titulo && (
                  <ul className="menu__desplegable" role="menu">
                    {grupo.items.map((item) => (
                      <li key={item.id} role="none">
                        <button
                          type="button"
                          role="menuitem"
                          className={`menu__item${seccion === item.id ? " menu__item--activo" : ""}`}
                          onClick={() => elegir(item.id)}
                        >
                          {item.nombre}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ),
          )}
          {indicador && (
            <span className="menu__indicador" style={{ transform: `translateX(${indicador.left}px)`, width: indicador.width }} />
          )}
        </nav>

        <button
          type="button"
          className="menu__tema"
          aria-label={tema === "oscuro" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          title={tema === "oscuro" ? "Tema claro" : "Tema oscuro"}
          onClick={onTema}
        >
          {tema === "oscuro" ? "☀" : "☾"}
        </button>

        <div className="menu__usuario">
          <button
            type="button"
            className="menu__avatar"
            aria-label="Menú de usuario"
            aria-expanded={menuUsuario}
            onClick={() => setMenuUsuario((v) => !v)}
          >
            {iniciales}
          </button>
          {menuUsuario && (
            <div className="menu__desplegable menu__desplegable--usuario">
              <p className="texto-caption">{nombreUsuario}</p>
              <p className="texto-caption">{rol}</p>
              <button type="button" className="boton boton--secundario boton--chico" onClick={onSalir}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="menu__hamburguesa"
          aria-label="Abrir menú"
          aria-expanded={hojaAbierta}
          onClick={() => setHojaAbierta((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {hojaAbierta && (
        <div className="menu__hoja">
          {grupos.map((grupo) => (
            <div key={grupo.titulo} className="menu__hoja-grupo">
              <p className="menu__hoja-titulo">{grupo.titulo}</p>
              {grupo.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`menu__item${seccion === item.id ? " menu__item--activo" : ""}`}
                  onClick={() => elegir(item.id)}
                >
                  {item.nombre}
                </button>
              ))}
            </div>
          ))}
          <button type="button" className="boton boton--secundario" onClick={onSalir}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
