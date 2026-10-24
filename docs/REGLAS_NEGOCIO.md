# Reglas de negocio — Sistema de renta de sillas, mesas, platos, etc.

Documento vivo. Recoge todo lo confirmado hasta ahora. Los puntos marcados como **PENDIENTE** aún no están definidos y no se implementan hasta que se confirmen.

---

## 1. Alcance general

- El sistema se desarrolla **por etapas**. Orden acordado:
  1. Inventario
  2. Clientes
  3. Pedidos + PDF de impresión
  4. Cola de entregas
  5. Pedidos entregados (revisión)
  6. Dashboard
  7. Reportes
  8. Usuarios y roles
- Es **una sola sucursal**.
- El sistema se usa **solo en la oficina** (no se requiere acceso desde campo).

## 2. Inventario

- Los artículos tienen **categoría** (sillas, mesas, platos, etc.).
- Existe un apartado para **dar de alta artículos manualmente**.
- Los artículos se manejan **por unidad**.
- Existen **paquetes** (combinaciones de artículos). Ver PENDIENTE de paquetes.
- Campos de cada artículo:
  - ID
  - Descripción
  - Categoría
  - Precio de renta
  - Existencia total
- El inventario es una **cantidad general** (no disponibilidad por fecha). Sirve como control.
- Al crear un pedido, el sistema **calcula las unidades restantes** a partir del inventario general y **solo avisa** si la cantidad pedida es mayor a la disponible. **No bloquea** el pedido.
- Se registran los artículos con **daño o pérdida** al recibir un pedido de regreso (ver sección 7).

## 3. Clientes

- Existe un apartado de **clientes** para no volver a capturar sus datos en cada pedido.
- Datos del cliente:
  - Nombre completo
  - Número de teléfono
  - Dirección
- Al crear un pedido se selecciona un cliente existente. Ver la sección 4 para la dirección de entrega.

## 4. Pedidos

- Cada pedido contiene:
  - **Cliente** (seleccionado del apartado de clientes)
  - **Fecha de creación** (automática)
  - **Fecha y hora de entrega**
  - **Fecha de devolución**
  - **Dirección de entrega**: por defecto es la del cliente. Hay una casilla para indicar que la dirección es **otra** y capturarla en el pedido.
  - Artículos y cantidades (por unidad o por paquete)
  - Pago (ver sección 5)
  - Casilla **"Requiere factura"** (ver sección 5)
- Un pedido puede **editarse** y **cancelarse**.

## 5. Pagos e IVA

- Forma de pago: anticipo o pago total, al recoger o al agendar el servicio.
- Casilla **"Requiere factura"**: si está marcada, el **IVA se suma al total**.
- **PENDIENTE**: ¿se guarda el monto del anticipo y se calcula el saldo, o solo "pagado / no pagado"?
- **PENDIENTE**: ¿el IVA es 16% fijo?

## 6. PDF de impresión

- Formato: **carta A4**.
- Contenido obligatorio:
  - Nombre del cliente
  - Dirección de entrega (la del cliente o la que se indicó en el pedido, aunque sea distinta)
  - Listado de artículos y cantidades (total)
  - Indicador de si el pedido **está pagado o no**
- **PENDIENTE**: ¿lleva precios y total, o solo la lista para armar y entregar?
- **PENDIENTE**: ¿lleva logo o encabezado de la empresa?

## 7. Cola de entregas

- Lista ordenada de pedidos **por entregar**, con su estado.
- La lista también muestra los pedidos **pendientes de recoger** (las piezas que aún faltan por regresar).
- **No** se asigna repartidor. La dirección puede ser solo texto.

## 8. Pedidos entregados (revisión)

Al revisar un pedido entregado se pueden consultar:

- Fecha de entrega
- Fecha de devolución (real)
- Piezas entregadas vs. piezas devueltas
- Faltantes o dañadas
- Saldo pendiente

## 9. Dashboard y reportes

- **PENDIENTE**: confirmar las métricas del dashboard.
  - Propuesta: rentas de hoy, pedidos de los próximos 7 días, entregas pendientes, pedidos pendientes de recoger, piezas rentadas vs. disponibles, ingresos del mes.
- **PENDIENTE**: confirmar los reportes y su formato (pantalla, PDF o Excel).
  - Propuesta: pedidos por periodo, ingresos por periodo, artículos más rentados, faltantes/dañados, clientes.

## 10. Usuarios y roles

Roles confirmados:

- **Administrador**
- **Vendedor / capturista**
- **Repartidor / entregas**
- **Vendedor + Repartidor** (rol combinado, adicional a los dos anteriores)

Los roles exactos de permisos por módulo quedan **PENDIENTE** de definir.

## 11. Tecnología

- **Backend:** C# con **.NET 10 LTS**, ASP.NET Core Web API.
- **Base de datos:** PostgreSQL.
- **Frontend:** **React** (separado del backend, consume la API).
- **PDF:** **QuestPDF**.
- **Despliegue:** **Docker** (con Docker Compose para la aplicación y PostgreSQL).

## 12. Datos generales

- **PENDIENTE**: moneda (¿MXN?).
- **PENDIENTE**: zona horaria.
- Idioma: **español**.

## 13. Repositorio

- Trabajo en la rama `claude/blissful-lovelace-aj7dbp`.
- **No** se crea Pull Request sin pedirlo.

---

## Pendientes para confirmar

1. Paquetes: qué artículos incluye cada uno y si tienen precio propio.
2. Anticipo: ¿monto y saldo, o solo pagado / no pagado?
3. IVA: ¿16% fijo?
4. PDF: ¿con precios y total? ¿con logo?
5. Dashboard: métricas definitivas.
6. Reportes: lista definitiva y formato.
7. Permisos exactos de cada rol.
8. Moneda y zona horaria.
9. Lugar de despliegue de Docker (computadora de oficina, servidor propio o nube).
