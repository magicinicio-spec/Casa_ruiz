import { useEffect, useState } from "react";

// Muestra un número que sube desde cero. Con "reducir movimiento" activado, aparece directo.
export default function CifraAnimada({ valor }: { valor: number }) {
  const [mostrado, setMostrado] = useState(0);

  useEffect(() => {
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducir || valor === 0) {
      setMostrado(valor);
      return;
    }

    const inicio = performance.now();
    const duracion = 600;
    let frame = 0;

    const paso = (ahora: number) => {
      const progreso = Math.min((ahora - inicio) / duracion, 1);
      const suavizado = 1 - Math.pow(1 - progreso, 3);
      setMostrado(Math.round(valor * suavizado));
      if (progreso < 1) frame = requestAnimationFrame(paso);
    };

    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [valor]);

  return <>{mostrado}</>;
}
