import { type FormEvent, useState } from "react";
import { ErrorApi, iniciarSesion, type Sesion } from "./api";

interface Props {
  onEntrar: (sesion: Sesion) => void;
}

function IconoUsuario() {
  return (
    <svg className="login__icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

function IconoCandado() {
  return (
    <svg className="login__icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconoOjo({ abierto }: { abierto: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!abierto && <path d="M4 4l16 16" />}
    </svg>
  );
}

export default function Login({ onEntrar }: Props) {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      onEntrar(await iniciarSesion(nombreUsuario.trim(), password));
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login">
      <section className="panel login__tarjeta">
        <div className="login__marca">
          <img src="/logo.png" alt="Casa Ruiz" className="login__logo" />
        </div>
        <h1 className="titulo-subheading">Iniciar sesión</h1>

        <form className="login__form" onSubmit={enviar}>
          <div className="login__campo">
            <label className="campo__etiqueta" htmlFor="login-usuario">Usuario</label>
            <div className="login__entrada">
              <IconoUsuario />
              <input
                id="login-usuario"
                className="login__input"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                autoComplete="username"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="login__campo">
            <label className="campo__etiqueta" htmlFor="login-password">Contraseña</label>
            <div className="login__entrada">
              <IconoCandado />
              <input
                id="login-password"
                className="login__input login__input--con-boton"
                type={verPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login__ver"
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={verPassword}
              >
                <IconoOjo abierto={verPassword} />
              </button>
            </div>
          </div>

          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}

          <button className="boton boton--primario login__enviar" type="submit" disabled={enviando}>
            {enviando && <span className="login__spinner" aria-hidden="true" />}
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
