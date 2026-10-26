const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type RolUsuario = "Administrador" | "Superior" | "Vendedor" | "Repartidor" | "VendedorRepartidor";

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

export interface ResumenDia {
  pedidosParaHoy: number;
  pendientesDeEntregarHoy: number;
}

export interface ResumenSemana {
  total: number;
  pendientesDeEntregar: number;
  porRecoger: number;
  porRevisar: number;
  cerrados: number;
  cancelados: number;
  ingresos: number;
}

export interface SituacionActual {
  colaEntrega: number;
  porRecoger: number;
  proximosSieteDias: number;
  conDanosSinResolver: number;
  saldoPorCobrar: number;
}

export interface ArticuloMasRentado {
  articuloId: number;
  descripcion: string;
  unidades: number;
}

export interface Dashboard {
  fecha: string;
  inicioSemana: string;
  finSemana: string;
  dia: ResumenDia;
  semana: ResumenSemana;
  situacion: SituacionActual;
  articulosMasRentados: ArticuloMasRentado[];
}

export function obtenerDashboard(token: string): Promise<Dashboard> {
  return peticion<Dashboard>("/api/dashboard", {}, token);
}

export interface ReportePedido {
  id: number;
  clienteNombre: string;
  clienteTelefono: string;
  fechaHoraEntrega: string;
  fechaDevolucion: string;
  direccionEntrega: string;
  estado: string;
  total: number;
  anticipo: number;
  saldo: number;
  pagado: boolean;
  entregadoEn: string | null;
  recogidoEn: string | null;
}

export interface ReportePedidosPagados {
  cantidad: number;
  totalPagado: number;
  pedidos: ReportePedido[];
}

export interface ReporteInventarioArticulo {
  articuloId: number;
  descripcion: string;
  categoria: string;
  existenciaTotal: number;
  enRenta: number;
  disponible: number;
  dadosDeBaja: number;
}

/** Fechas en formato dd-MM-yyyy, como el resto del sistema. Vacío significa sin límite. */
export function obtenerPedidosPagados(token: string, desde: string, hasta: string): Promise<ReportePedidosPagados> {
  const parametros = new URLSearchParams();
  if (desde) parametros.set("desde", desde);
  if (hasta) parametros.set("hasta", hasta);
  const consulta = parametros.toString() ? `?${parametros.toString()}` : "";
  return peticion<ReportePedidosPagados>(`/api/reportes/pedidos-pagados${consulta}`, {}, token);
}

export function obtenerPendientesRecoger(token: string): Promise<ReportePedido[]> {
  return peticion<ReportePedido[]>("/api/reportes/pendientes-recoger", {}, token);
}

export function obtenerInventario(token: string): Promise<ReporteInventarioArticulo[]> {
  return peticion<ReporteInventarioArticulo[]>("/api/reportes/inventario", {}, token);
}

/** Descarga un reporte en Excel o PDF. Va con la sesión porque la ruta requiere token. */
export async function descargarReporte(ruta: string, token: string, nombreRespaldo: string): Promise<void> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${baseUrl}${ruta}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new ErrorApi("No se pudo conectar con el servidor.", 0);
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new ErrorApi(cuerpo?.error ?? "No se pudo generar el archivo.", respuesta.status);
  }

  const nombre = /filename="?([^";]+)"?/.exec(respuesta.headers.get("Content-Disposition") ?? "")?.[1] ?? nombreRespaldo;
  const url = URL.createObjectURL(await respuesta.blob());
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export function entregarPedido(token: string, id: number): Promise<Pedido> {
  return peticion<Pedido>(`/api/entregas/${id}/entregar`, { method: "POST" }, token);
}

export function recogerPedido(token: string, id: number): Promise<Pedido> {
  return peticion<Pedido>(`/api/entregas/${id}/recoger`, { method: "POST" }, token);
}

export function colaEntregas(token: string): Promise<Pedido[]> {
  return peticion<Pedido[]>("/api/entregas/cola", {}, token);
}

export function porRecogerEntregas(token: string): Promise<Pedido[]> {
  return peticion<Pedido[]>("/api/entregas/por-recoger", {}, token);
}

export interface LineaPedido {
  id: number;
  articuloId: number | null;
  paqueteId: number | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

/** Pedido tal como lo devuelve la API en pedidos y entregas. */
export interface Pedido {
  id: number;
  clienteId: number;
  clienteNombre: string;
  clienteTelefono: string;
  fechaHoraEntrega: string;
  fechaDevolucion: string;
  direccionEntrega: string;
  requiereFactura: boolean;
  subtotal: number;
  iva: number;
  cobrosPorDanos: number;
  total: number;
  anticipo: number;
  saldo: number;
  pagado: boolean;
  estado: string;
  entregadoEn: string | null;
  recogidoEn: string | null;
  lineas: LineaPedido[];
}
