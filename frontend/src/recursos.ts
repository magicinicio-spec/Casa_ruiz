import { type Pedido, peticion, type RolUsuario, type Usuario } from "./api";

export interface Articulo {
  id: number;
  descripcion: string;
  categoria: string;
  precioRenta: number;
  existenciaTotal: number;
}

export interface ArticuloEntrada {
  descripcion: string;
  categoria: string;
  precioRenta: number;
  existenciaTotal: number;
}

export interface ComponentePaquete {
  articuloId: number;
  descripcion: string;
  cantidad: number;
}

export interface Paquete {
  id: number;
  nombre: string;
  precioRenta: number;
  componentes: ComponentePaquete[];
}

export interface PaqueteEntrada {
  nombre: string;
  precioRenta: number;
  componentes: { articuloId: number; cantidad: number }[];
}

export interface Cliente {
  id: number;
  nombreCompleto: string;
  telefono: string;
  direccion: string;
}

export interface ClienteEntrada {
  nombreCompleto: string;
  telefono: string;
  direccion: string;
}

export interface LineaEntrada {
  articuloId: number | null;
  paqueteId: number | null;
  cantidad: number;
}

export interface PedidoEntrada {
  clienteId: number;
  fechaHoraEntrega: string;
  fechaDevolucion: string;
  direccionEsDelCliente: boolean;
  direccionOtra: string | null;
  requiereFactura: boolean;
  anticipo: number;
  pagado: boolean;
  lineas: LineaEntrada[];
}

export interface AdvertenciaInventario {
  articuloId: number;
  descripcion: string;
  existenciaTotal: number;
  comprometidaEnOtrosPedidos: number;
  solicitadas: number;
  restantes: number;
}

export interface PedidoGuardado {
  pedido: Pedido;
  advertencias: AdvertenciaInventario[];
}

export interface RevisionArticulo {
  pedidoArticuloId: number;
  cantidadDevuelta: number;
  cantidadDaniada: number;
}

export type TipoResolucion = "Reparado" | "DadoDeBaja" | "Cobrado";

export interface ResolucionDano {
  pedidoArticuloId: number;
  tipo: TipoResolucion;
  cantidad: number;
  motivo: string | null;
  monto: number | null;
}

export interface UsuarioEntrada {
  nombreCompleto: string;
  telefono: string;
  nombreUsuario: string;
  rol: RolUsuario;
}

// Inventario
export const listarArticulos = (token: string, categoria = "") =>
  peticion<Articulo[]>(`/api/articulos${categoria ? `?categoria=${encodeURIComponent(categoria)}` : ""}`, {}, token);
export const crearArticulo = (token: string, cuerpo: ArticuloEntrada) =>
  peticion<Articulo>("/api/articulos", { method: "POST", body: JSON.stringify(cuerpo) }, token);
export const actualizarArticulo = (token: string, id: number, cuerpo: ArticuloEntrada) =>
  peticion<Articulo>(`/api/articulos/${id}`, { method: "PUT", body: JSON.stringify(cuerpo) }, token);

// Paquetes
export const listarPaquetes = (token: string) => peticion<Paquete[]>("/api/paquetes", {}, token);
export const crearPaquete = (token: string, cuerpo: PaqueteEntrada) =>
  peticion<Paquete>("/api/paquetes", { method: "POST", body: JSON.stringify(cuerpo) }, token);
export const actualizarPaquete = (token: string, id: number, cuerpo: PaqueteEntrada) =>
  peticion<Paquete>(`/api/paquetes/${id}`, { method: "PUT", body: JSON.stringify(cuerpo) }, token);

// Clientes
export const listarClientes = (token: string, buscar = "") =>
  peticion<Cliente[]>(`/api/clientes${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ""}`, {}, token);
export const crearCliente = (token: string, cuerpo: ClienteEntrada) =>
  peticion<Cliente>("/api/clientes", { method: "POST", body: JSON.stringify(cuerpo) }, token);
export const actualizarCliente = (token: string, id: number, cuerpo: ClienteEntrada) =>
  peticion<Cliente>(`/api/clientes/${id}`, { method: "PUT", body: JSON.stringify(cuerpo) }, token);

// Pedidos
export const listarPedidos = (token: string, estado = "") =>
  peticion<Pedido[]>(`/api/pedidos${estado ? `?estado=${estado}` : ""}`, {}, token);
export const obtenerPedido = (token: string, id: number) => peticion<Pedido>(`/api/pedidos/${id}`, {}, token);
export const crearPedido = (token: string, cuerpo: PedidoEntrada) =>
  peticion<PedidoGuardado>("/api/pedidos", { method: "POST", body: JSON.stringify(cuerpo) }, token);
export const actualizarPedido = (token: string, id: number, cuerpo: PedidoEntrada) =>
  peticion<PedidoGuardado>(`/api/pedidos/${id}`, { method: "PUT", body: JSON.stringify(cuerpo) }, token);
export const cancelarPedido = (token: string, id: number) =>
  peticion<Pedido>(`/api/pedidos/${id}/cancelar`, { method: "POST" }, token);
export const revisarPedido = (token: string, id: number, articulos: RevisionArticulo[]) =>
  peticion<Pedido>(`/api/pedidos/${id}/revision`, { method: "POST", body: JSON.stringify({ articulos }) }, token);
export const resolverDano = (token: string, id: number, cuerpo: ResolucionDano) =>
  peticion<Pedido>(`/api/pedidos/${id}/danos`, { method: "POST", body: JSON.stringify(cuerpo) }, token);
export const cerrarPedido = (token: string, id: number) =>
  peticion<Pedido>(`/api/pedidos/${id}/cerrar`, { method: "POST" }, token);

// Usuarios
export const listarUsuarios = (token: string) => peticion<Usuario[]>("/api/usuarios", {}, token);
export const crearUsuario = (token: string, cuerpo: UsuarioEntrada & { password: string }) =>
  peticion<Usuario>("/api/usuarios", { method: "POST", body: JSON.stringify(cuerpo) }, token);
export const actualizarUsuario = (token: string, id: number, cuerpo: UsuarioEntrada) =>
  peticion<Usuario>(`/api/usuarios/${id}`, { method: "PUT", body: JSON.stringify(cuerpo) }, token);
export const restablecerPassword = (token: string, id: number, nuevaPassword: string) =>
  peticion<Usuario>(`/api/usuarios/${id}/restablecer-password`, { method: "POST", body: JSON.stringify({ nuevaPassword }) }, token);
export const cambiarActivoUsuario = (token: string, id: number, activo: boolean) =>
  peticion<Usuario>(`/api/usuarios/${id}/${activo ? "activar" : "desactivar"}`, { method: "POST" }, token);
export const eliminarUsuario = (token: string, id: number) =>
  peticion<void>(`/api/usuarios/${id}`, { method: "DELETE" }, token);

// Permisos por rol, igual que en la API (ver Configuracion/Permisos.cs).
export const rolesOperacion: RolUsuario[] = ["Administrador", "Superior", "Vendedor", "VendedorRepartidor"];
export const rolesControl: RolUsuario[] = ["Administrador", "Superior"];

// Cotizaciones: mismos datos del pedido, sin anticipo ni pagos, y no aparta inventario.
export interface CotizacionLinea {
  id: number;
  articuloId: number | null;
  paqueteId: number | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
  articulos: { articuloId: number; descripcion: string; cantidad: number }[];
}

export interface Cotizacion {
  id: number;
  fechaCreacion: string;
  clienteId: number;
  clienteNombre: string;
  clienteTelefono: string;
  fechaHoraEntrega: string;
  fechaDevolucion: string;
  direccionEntrega: string;
  direccionEsDelCliente: boolean;
  requiereFactura: boolean;
  subtotal: number;
  iva: number;
  total: number;
  lineas: CotizacionLinea[];
}

export interface CotizacionEntrada {
  clienteId: number;
  fechaHoraEntrega: string;
  fechaDevolucion: string;
  direccionEsDelCliente: boolean;
  direccionOtra?: string | null;
  requiereFactura: boolean;
  lineas: LineaEntrada[];
}

export const listarCotizaciones = (token: string) => peticion<Cotizacion[]>("/api/cotizaciones", {}, token);
export const obtenerCotizacion = (token: string, id: number) => peticion<Cotizacion>(`/api/cotizaciones/${id}`, {}, token);
export const crearCotizacion = (token: string, cuerpo: CotizacionEntrada) =>
  peticion<Cotizacion>("/api/cotizaciones", { method: "POST", body: JSON.stringify(cuerpo) }, token);
export const actualizarCotizacion = (token: string, id: number, cuerpo: CotizacionEntrada) =>
  peticion<Cotizacion>(`/api/cotizaciones/${id}`, { method: "PUT", body: JSON.stringify(cuerpo) }, token);
