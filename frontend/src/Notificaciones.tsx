import { useEffect, useState } from "react";

// Avisos de éxito que aparecen en la esquina y desaparecen solos.
type Escucha = (mensaje: string, id: number) => void;

let siguienteId = 0;
const escuchas = new Set<Escucha>();

export function notificar(mensaje: string): void {
  const id = ++siguienteId;
  escuchas.forEach((escucha) => escucha(mensaje, id));
}

export default function Notificaciones() {
  const [avisos, setAvisos] = useState<{ id: number; mensaje: string }[]>([]);

  useEffect(() => {
    const escucha: Escucha = (mensaje, id) => {
      setAvisos((prev) => [...prev.slice(-2), { id, mensaje }]);
      window.setTimeout(() => setAvisos((prev) => prev.filter((a) => a.id !== id)), 3500);
    };
    escuchas.add(escucha);
    return () => {
      escuchas.delete(escucha);
    };
  }, []);

  return (
    <div className="notificaciones" aria-live="polite">
      {avisos.map((a) => (
        <div key={a.id} className="notificacion">
          {a.mensaje}
        </div>
      ))}
    </div>
  );
}
