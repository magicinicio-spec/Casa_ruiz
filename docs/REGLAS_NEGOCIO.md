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

Dashboard (solo información de pedidos). Lo ven Administrador, Superior, Vendedor y Vendedor + Repartidor.

- **Hoy:** pedidos con entrega hoy, y cuántos faltan por entregar.
- **Esta semana** (lunes a domingo): total de pedidos (sin cancelados), pendientes de entregar, por recoger, por revisar, cerrados, cancelados e ingresos (total de los pedidos, con IVA y cobros por daño).
- **Situación actual** (sin importar la fecha): cola de entrega, por recoger, próximos 7 días (incluye hoy), con daños sin resolver y saldo por cobrar.
- **Artículos más rentados** de la semana: los 5 con más unidades.
- "Hoy" y la semana se calculan con la zona horaria del servidor.
- El saldo por cobrar es el total menos el anticipo de los pedidos activos. Si el pedido está marcado como pagado, el saldo es cero.

Reportes (lo ven Administrador, Superior, Vendedor y Vendedor + Repartidor):

- **Pedidos pagados:** pedidos marcados como pagados que no están cancelados, con total. Filtro opcional por fecha de entrega (desde / hasta).
- **Pedidos por recoger:** pedidos activos ya entregados cuyas piezas todavía no se han recogido.
- **Inventario:** por artículo, existencia total, en renta (unidades de pedidos activos aún no revisados), disponible (existencia menos en renta) y dados de baja.
- Cada reporte se ve en pantalla y se descarga en **Excel** y **PDF**, con los mismos filtros.

## 10. Usuarios y roles

- Solo el **administrador** crea usuarios, restablece contraseñas, desactiva, activa y elimina usuarios. Desactivar y eliminar son dos acciones distintas.
- Inicio de sesión con **usuario y contraseña**. La sesión dura **8 horas**.
- Datos del usuario: nombre completo, teléfono, usuario y rol.
- No se lleva trazabilidad de quién hizo cada acción.
- No se puede desactivar ni eliminar el propio usuario, ni dejar el sistema sin administrador activo.

Roles y permisos:

| Acción | Administrador | Superior | Vendedor | Repartidor | Vendedor + Repartidor |
|---|:-:|:-:|:-:|:-:|:-:|
| Inventario y paquetes | ✔ | ✔ | ✔ | ✘ | ✔ |
| Clientes y pedidos (crear, editar, cancelar) | ✔ | ✔ | ✔ | ✘ | ✔ |
| Cola de entregas, entregar y recoger | ✔ | ✔ | ✘ | ✔ | ✔ |
| Revisión, resolver daños y cerrar pedido | ✔ | ✔ | ✘ | ✘ | ✘ |
| Dashboard y reportes | ✔ | ✔ | ✔ | ✘ | ✔ |
| Gestionar usuarios | ✔ | ✘ | ✘ | ✘ | ✘ |

- **Superior** tiene los mismos permisos que el administrador, excepto gestionar usuarios.
- Dashboard y reportes todavía no existen en la API; se aplicará la columna cuando se construyan.

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

## Respaldos

- Respaldo **semanal**, cada **sábado a las 18:00**.
- Se conservan los **3 respaldos más recientes**.
- Se guardan en la carpeta `respaldos/` del **disco del servidor**.

## Decisiones confirmadas

- Los cobros por daño no llevan IVA.
- Casa Ruiz es una empresa pequeña: se usa la licencia comunitaria de QuestPDF (gratuita).

## Pendientes para confirmar

1. Paquetes: qué artículos incluye cada uno y si tienen precio propio. *(Resuelto: son combinaciones de sillas y mesas con precio propio.)*
