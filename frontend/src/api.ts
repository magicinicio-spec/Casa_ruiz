const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type RolUsuario = "Administrador" | "Vendedor" | "Repartidor" | "VendedorRepartidor";

export interface Usuario {
  id: number;
  nombreCompleto: string;
  telefono: string;
  nombreUsuario: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface Sesion {
  token: string;
  expiraEn: string;
  usuario: Usuario;
}

export class ErrorApi extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function peticion<T>(ruta: string, opciones: RequestInit = {}, token?: string): Promise<T> {
  const cabeceras: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${baseUrl}${ruta}`, { ...opciones, headers: cabeceras });
  } catch {
    throw new ErrorApi("No se pudo conectar con el servidor. Revisa la red de la oficina.", 0);
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new ErrorApi(cuerpo?.error ?? "Ocurrió un error inesperado.", respuesta.status);
  }

  return respuesta.json() as Promise<T>;
}

export function iniciarSesion(nombreUsuario: string, password: string): Promise<Sesion> {
  return peticion<Sesion>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ nombreUsuario, password }),
  });
}

export function usuarioActual(token: string): Promise<Usuario> {
  return peticion<Usuario>("/api/auth/yo", {}, token);
}
