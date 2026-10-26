import { useEffect, useState } from "react";
import { ErrorApi, type Sesion, usuarioActual } from "./api";
import { borrarSesion, guardarSesion, leerSesion } from "./sesion";
import Inicio from "./Inicio";
import Login from "./Login";

export default function App() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [verificando, setVerificando] = useState(true);

  // Al abrir la página se comprueba que la sesión guardada siga vigente y que la cuenta siga activa.
  useEffect(() => {
    const guardada = leerSesion();
    if (!guardada) {
      setVerificando(false);
      return;
    }

    usuarioActual(guardada.token)
      .then((usuario) => setSesion({ ...guardada, usuario }))
      .catch((error: unknown) => {
        if (error instanceof ErrorApi && error.status === 0) {
          // Sin conexión: se mantiene la sesión guardada hasta que haya red.
          setSesion(guardada);
          return;
        }
        borrarSesion();
      })
      .finally(() => setVerificando(false));
  }, []);

  function entrar(nueva: Sesion) {
    guardarSesion(nueva);
    setSesion(nueva);
  }

  function salir() {
    borrarSesion();
    setSesion(null);
  }

  if (verificando) {
    return <main className="cargando">Cargando…</main>;
  }

  if (!sesion) {
    return <Login onEntrar={entrar} />;
  }

  return <Inicio sesion={sesion} onSalir={salir} />;
}
