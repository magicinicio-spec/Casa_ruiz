import { type FormEvent, useState } from "react";
import { ErrorApi, iniciarSesion, type Sesion } from "./api";

interface Props {
  onEntrar: (sesion: Sesion) => void;
}

export default function Login({ onEntrar }: Props) {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
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
      <div className="login__diseno">
        <section className="login__hero" aria-hidden="true">
          <h2 className="titulo-display">Casa Ruiz</h2>
          <p>Renta de sillas, mesas y más. Pedidos, entregas e inventario en un solo lugar.</p>
        </section>

        <section className="panel login__tarjeta">
          <img src="/logo.png" alt="Casa Ruiz" className="login__logo" />
          <h1 className="titulo-subheading">Iniciar sesión</h1>
          <p className="texto-lead">Usa tu usuario y contraseña.</p>

        <form className="login__form" onSubmit={enviar}>
          <label className="campo">
            <span className="campo__etiqueta">Usuario</span>
            <input
              className="campo__input"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </label>

          <label className="campo">
            <span className="campo__etiqueta">Contraseña</span>
            <input
              className="campo__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}

          <button className="boton boton--primario" type="submit" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
        </section>
      </div>
    </main>
  );
}
