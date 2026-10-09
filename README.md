# Juquilita

Tienda en línea y panel de administración para la tlapalería **Juquilita**.

- **Clientes:** buscan productos, arman un pedido sin registrarse, eligen recoger en tienda o entrega a domicilio, pagan al recibir y rastrean su pedido con un folio.
- **Administradores:** atienden pedidos, gestionan el catálogo y controlan el inventario (entradas, salidas y alertas de stock bajo).

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 + Vite 8 + React Router 7 (sin librerías de UI; CSS propio) |
| Backend | Node.js + Express 4 (API REST JSON) |
| Base de datos | PostgreSQL (driver `pg`, SQL directo, sin ORM) |

---

## Índice

1. [Arquitectura](#arquitectura)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Modelo de datos](#modelo-de-datos)
4. [Flujos principales](#flujos-principales)
5. [Correr en local](#correr-en-local)
6. [Variables de entorno](#variables-de-entorno)
7. [Rutas del frontend](#rutas-del-frontend)
8. [API](#api)
9. [Solución de problemas](#solución-de-problemas)

---

## Arquitectura

```
┌───────────────────────────┐      HTTP/JSON       ┌───────────────────────────┐       SQL        ┌──────────────┐
│  Frontend (SPA)           │  ─────────────────▶  │  Backend (Express)        │  ─────────────▶  │  PostgreSQL  │
│  React + Vite             │  fetch + Bearer token│  /api/*                   │   pool de `pg`   │  juquilita   │
│  http://localhost:5173    │  ◀─────────────────  │  http://localhost:3001    │  ◀─────────────  │  :5432       │
└───────────────────────────┘                      └───────────────────────────┘                  └──────────────┘
   │ localStorage:                                    │ Tokens de sesión en memoria
   │  - carrito                                       │ (Map en services/auth.js)
   │  - token / usuario admin
   │  - datos del cliente y pedidos recientes
```

### Frontend

Es una SPA que se sirve con Vite. Partes principales:

- **`services/api.js`** es el único punto de acceso al backend. Le agrega el token `Authorization: Bearer …`, traduce errores de red a mensajes en español y, si recibe un **401** en una ruta `/admin`, borra la sesión y redirige al login.
- **`context/CartContext.jsx`** guarda el carrito en estado de React y lo sincroniza con `localStorage` (y entre pestañas). El carrito nunca va al servidor hasta que se confirma el pedido.
- **`context/ToastContext.jsx`** muestra las notificaciones (éxito, error, info) que reemplazan a `alert()`.
- **`components/`** contiene los layouts (`StoreLayout`, `AdminLayout`), componentes de UI compartidos (`ui.jsx`: Modal, Badge, Field, Skeleton…) y los iconos SVG propios (`Icon.jsx`).
- **`lib/`** contiene constantes de negocio (estados, etiquetas, datos de la tienda) y formateadores (moneda MXN, fechas).
- **`pages/`** tiene una página por ruta; las de administración están en `pages/admin/`.

No hay gestor de estado global aparte de los dos contextos. Cada página pide sus datos al montarse.

### Backend

API REST en Express, organizada por recurso:

- **`app.js`** configura CORS, JSON y monta los routers bajo `/api`.
- **`routes/*.js`** define un router por recurso (productos, categorías, pedidos, inventario, dashboard, auth). Las consultas SQL se escriben directamente en cada ruta.
- **`services/auth.js`** hace el login con `bcrypt` y emite tokens aleatorios guardados **en memoria**. `authMiddleware` protege las rutas de administración.
- **`database/db.js`** crea el pool de conexiones a PostgreSQL.

Reglas de negocio importantes:

- **Precios:** el total de un pedido **se calcula en el servidor** con los precios de la base de datos, nunca con los que manda el cliente.
- **Transacciones:** crear un pedido, cambiar su estado y registrar entradas o salidas usan una transacción (`BEGIN … COMMIT`) con `SELECT … FOR UPDATE` para evitar condiciones de carrera en el stock.
- **Historial:** todo cambio de stock queda registrado en `inventory_movements`.
- **Cancelaciones:** cancelar un pedido devuelve el stock; un pedido cancelado no se puede reactivar.

---

## Estructura del proyecto

```
juquilita/
├── database/
│   ├── schema.sql            # Tablas e índices
│   └── seed.sql              # Admin, 8 categorías y 20 productos demo
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js         # Arranque (puerto)
│       ├── app.js            # Express, middlewares y routers
│       ├── database/db.js    # Pool de PostgreSQL
│       ├── services/auth.js  # Login, tokens y middleware
│       └── routes/
│           ├── auth.js       # /api/login, /api/me
│           ├── products.js   # /api/products
│           ├── categories.js # /api/categories
│           ├── orders.js     # /api/orders
│           ├── inventory.js  # /api/inventory
│           └── dashboard.js  # /api/dashboard
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx          # Punto de entrada
        ├── App.jsx           # Rutas y providers
        ├── styles.css        # Sistema visual (tokens, componentes, responsive)
        ├── services/api.js   # Cliente HTTP
        ├── context/          # CartContext, ToastContext
        ├── lib/              # constants, format, recentOrders
        ├── components/       # Layouts, UI compartida, iconos
        └── pages/            # Tienda (clientes)
            └── admin/        # Panel de administración
```

---

## Modelo de datos

```
categories 1 ──── * products 1 ──── * order_items * ──── 1 orders
                        │                                    │
                        └──── * inventory_movements * ───────┘ (opcional)
users  (administradores)
```

| Tabla | Propósito | Campos clave |
|-------|-----------|--------------|
| `users` | Administradores | `email` (único), `password` (hash bcrypt) |
| `categories` | Categorías del catálogo | `name` (único) |
| `products` | Catálogo | `price`, `cost`, `stock`, `minimum_stock`, `unit`, `active` |
| `orders` | Pedidos de clientes | `folio` (`JUQ-1001`…), `delivery_type`, `payment_method`, `status`, `total` |
| `order_items` | Renglones del pedido | Copia de `product_name` y `unit_price` al momento de la compra |
| `inventory_movements` | Bitácora de stock | `type`, `quantity`, `previous_stock`, `new_stock`, `notes` |

**Estados de un pedido:** `RECEIVED` → `PREPARING` → `READY` → `COMPLETED`, o bien `CANCELLED`.

**Tipos de movimiento:** `ENTRY` (entrada), `EXIT` (salida), `ORDER` (venta), `CANCELLATION` (devolución por cancelación), `ADJUSTMENT`.

**Stock bajo:** un producto tiene stock bajo cuando `stock <= minimum_stock`.

---

## Flujos principales

### Pedido de un cliente

1. El cliente agrega productos al carrito (solo en `localStorage`).
2. En `/confirmar` llena nombre, teléfono y forma de entrega. El método de pago se deriva de la entrega: recoger → `pay_on_pickup`, domicilio → `pay_on_delivery`.
3. `POST /api/orders`. El servidor, en una sola transacción:
   1. valida los datos y la existencia de cada producto (con bloqueo de fila);
   2. calcula subtotales y total con los precios de la base de datos;
   3. genera el siguiente folio y crea `orders` y `order_items`;
   4. descuenta el stock y registra un movimiento `ORDER` por producto.
4. El cliente ve `/pedido-confirmado/:folio` y puede seguirlo en `/pedido/:folio` o `/rastrear`.

### Atención en el panel

1. El admin inicia sesión (`POST /api/login`) y el token se guarda en `localStorage`.
2. En **Pedidos** avanza el estado con un botón ("Empezar a preparar", "Marcar como listo"…) mediante `PUT /api/orders/:id/status`.
3. Al **cancelar**, el servidor devuelve el stock y registra movimientos `CANCELLATION`.
4. En **Inventario** registra entradas y salidas manuales. Cada una queda en el historial.

---

## Correr en local

### Requisitos

| Herramienta | Versión |
|-------------|---------|
| Node.js | `20.19+` o `22.12+` (lo exige Vite 8) |
| npm | el que viene con Node |
| PostgreSQL | 14 o superior, corriendo en `localhost:5432` |

En macOS con Homebrew:

```bash
brew install node postgresql@16
brew services start postgresql@16
```

### 1. Base de datos

Desde la carpeta `juquilita/`:

```bash
createdb juquilita
psql -d juquilita -f database/schema.sql
psql -d juquilita -f database/seed.sql
```

Para **reiniciar** la base desde cero (borra todos los pedidos y cambios):

```bash
dropdb juquilita && createdb juquilita
psql -d juquilita -f database/schema.sql && psql -d juquilita -f database/seed.sql
```

### 2. Backend

En una terminal:

```bash
cd backend
npm install
npm run dev        # node --watch: se reinicia al guardar cambios
```

El backend usa por defecto el usuario de PostgreSQL `eb` sin contraseña (ver `src/database/db.js`). Si tu usuario es otro, defínelo al arrancar:

```bash
DB_USER=postgres DB_PASSWORD=postgres npm run dev
```

Para verificar que responde:

```bash
curl http://localhost:3001/api/categories
```

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173**.

### 4. Entrar al panel

Ve a **http://localhost:5173/admin** e inicia sesión con:

- **Correo:** `admin@juquilita.com`
- **Contraseña:** `admin123`

> Las sesiones viven en la memoria del backend: si lo reinicias (incluido el reinicio automático de `npm run dev`), tendrás que volver a iniciar sesión. La interfaz te redirige al login automáticamente.

### Otros comandos

| Dónde | Comando | Qué hace |
|-------|---------|----------|
| `frontend/` | `npm run build` | Compila la app para producción en `dist/` |
| `frontend/` | `npm run preview` | Sirve la compilación de `dist/` |
| `frontend/` | `npm run lint` | Revisa el código con oxlint |
| `backend/` | `npm start` | Arranca la API sin reinicio automático |

---

## Variables de entorno

### Backend

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3001` | Puerto de la API |
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_NAME` | `juquilita` | Nombre de la base de datos |
| `DB_USER` | `eb` | Usuario de PostgreSQL |
| `DB_PASSWORD` | *(vacío)* | Contraseña de PostgreSQL |

### Frontend

| Variable | Default | Descripción |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001/api` | URL base de la API |

Puedes ponerla en `frontend/.env.local`, que no se sube a git:

```
VITE_API_URL=http://localhost:3001/api
```

---

## Rutas del frontend

### Tienda

| Ruta | Página |
|------|--------|
| `/` | Inicio: buscador, categorías y destacados |
| `/tienda` | Catálogo (`?search=`, `?category=`, `?sort=`, `?disponibles=1`) |
| `/producto/:id` | Detalle de producto |
| `/pedido` | Carrito |
| `/confirmar` | Datos de entrega y confirmación |
| `/pedido-confirmado/:folio` | Pedido recibido |
| `/rastrear` | Buscar pedido por folio |
| `/pedido/:folio` | Estado de un pedido |

### Administración (requieren sesión)

| Ruta | Página |
|------|--------|
| `/admin/login` | Iniciar sesión |
| `/admin` | Resumen: ventas, pedidos y stock bajo |
| `/admin/pedidos` | Pedidos (`?estado=RECEIVED`…) |
| `/admin/pedidos/:id` | Detalle y cambio de estado |
| `/admin/productos` | Catálogo: alta, edición y visibilidad |
| `/admin/inventario` | Existencias y movimientos (`?vista=movimientos`, `?filtro=bajo`) |

---

## API

Todas las rutas empiezan con `/api`. 🔒 indica que requiere el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/login` | Inicia sesión. Body: `{ email, password }` → `{ token, user }` |
| GET | `/me` 🔒 | Usuario de la sesión actual |
| GET | `/products` | Productos activos (`?search=`, `?category=`) |
| GET | `/products/all` 🔒 | Todos los productos, incluidos los inactivos (`?search=`) |
| GET | `/products/:id` | Detalle de un producto |
| POST | `/products` 🔒 | Crea un producto |
| PUT | `/products/:id` 🔒 | Edita un producto (los campos omitidos no cambian; el stock no se edita aquí) |
| GET | `/categories` | Lista de categorías |
| POST | `/categories` 🔒 | Crea una categoría. Body: `{ name }` |
| POST | `/orders` | Crea un pedido (ver ejemplo abajo) |
| GET | `/orders` 🔒 | Lista de pedidos con `items_count` |
| GET | `/orders/:id` 🔒 | Detalle con sus artículos |
| GET | `/orders/folio/:folio` | Consulta pública por folio (sin distinguir mayúsculas) |
| PUT | `/orders/:id/status` 🔒 | Cambia el estado. Body: `{ status }` |
| POST | `/inventory/entry` 🔒 | Entrada de stock. Body: `{ product_id, quantity, notes? }` |
| POST | `/inventory/exit` 🔒 | Salida de stock. Body: `{ product_id, quantity, notes? }` |
| GET | `/inventory/movements` 🔒 | Últimos 100 movimientos (`?product_id=`) |
| GET | `/dashboard` 🔒 | Indicadores, ventas de 7 días, pedidos por estado y stock bajo |

Ejemplo de creación de pedido:

```bash
curl -X POST http://localhost:3001/api/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "items": [{ "product_id": 1, "quantity": 2 }],
    "customer_name": "María López",
    "customer_phone": "5512345678",
    "delivery_type": "pickup",
    "payment_method": "pay_on_pickup"
  }'
```

Los errores siempre responden con `{ "error": "mensaje en español" }` y el código HTTP correspondiente (`400`, `401`, `404`, `500`).

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `database "juquilita" does not exist` | No se creó la base | Sigue el paso [1. Base de datos](#1-base-de-datos) |
| `role "eb" does not exist` o `password authentication failed` | El usuario de PostgreSQL por defecto no coincide | Arranca el backend con `DB_USER` y `DB_PASSWORD` |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL no está corriendo | `brew services start postgresql@16` |
| La tienda dice "No pudimos conectar con el servidor" | El backend no está corriendo o `VITE_API_URL` apunta a otro lado | Arranca el backend y revisa `curl localhost:3001/api/categories` |
| El panel te saca al login seguido | El backend se reinició y perdió los tokens en memoria | Es esperado en desarrollo; vuelve a iniciar sesión |
| `EADDRINUSE :3001` o `:5173` | El puerto ya está ocupado | `lsof -i :3001` y cierra el proceso, o usa `PORT=3002` (y ajusta `VITE_API_URL`) |
| Vite falla con un error de versión de Node | Node demasiado antiguo | Actualiza a Node 20.19+ o 22.12+ |
