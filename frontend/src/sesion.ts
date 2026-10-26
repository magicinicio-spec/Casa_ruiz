import type { Sesion } from "./api";

const clave = "casaRuiz.sesion";

// localStorage puede fallar en ventanas privadas o con datos bloqueados: en ese caso no se guarda la sesión.
export function guardarSesion(sesion: Sesion): void {
  try {
    localStorage.setItem(clave, JSON.stringify(sesion));
  } catch {
    // Sin almacenamiento, el usuario tendrá que volver a iniciar sesión al recargar.
  }
}

export function leerSesion(): Sesion | null {
  try {
    const guardada = localStorage.getItem(clave);
    if (!guardada) {
      return null;
    }

    const sesion = JSON.parse(guardada) as Sesion;
    if (new Date(sesion.expiraEn).getTime() <= Date.now()) {
      borrarSesion();
      return null;
    }

    return sesion;
  } catch {
    return null;
  }
}

export function borrarSesion(): void {
  try {
    localStorage.removeItem(clave);
  } catch {
    // Nada que borrar si el almacenamiento no está disponible.
  }
}
