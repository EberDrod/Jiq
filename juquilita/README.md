# JUQUILITA V1

Aplicación web para la tlapalería Juquilita.

## Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL

## Instalación

### 1. Base de datos

```bash
# Crear la base de datos
createdb juquilita

# Ejecutar schema
psql -d juquilita -f database/schema.sql

# Cargar datos iniciales
psql -d juquilita -f database/seed.sql
```

Si necesitas usuario/contraseña diferente, configura las variables de entorno:
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=juquilita
export DB_USER=postgres
export DB_PASSWORD=postgres
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

El API correrá en `http://localhost:3001`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará en `http://localhost:5173`

Para apuntar a otro backend, define `VITE_API_URL` (por defecto `http://localhost:3001/api`).

## Usuario administrador

- **Correo:** admin@juquilita.com
- **Contraseña:** admin123

## Rutas

### Cliente
| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/tienda` | Catálogo de productos |
| `/producto/:id` | Detalle de producto |
| `/pedido` | Mi pedido |
| `/confirmar` | Confirmar pedido |
| `/pedido-confirmado/:folio` | Confirmación |
| `/rastrear` | Rastrear pedido por folio |
| `/pedido/:folio` | Consultar pedido |

### Administrador
| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Iniciar sesión |
| `/admin` | Dashboard |
| `/admin/productos` | Gestión de productos |
| `/admin/inventario` | Control de inventario |
| `/admin/pedidos` | Gestión de pedidos |
| `/admin/pedidos/:id` | Detalle de pedido |

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/login` | Login admin |
| GET | `/api/me` | Usuario de la sesión actual |
| GET | `/api/products` | Listar productos (público) |
| GET | `/api/products/all` | Listar todos (admin) |
| GET | `/api/products/:id` | Detalle producto |
| POST | `/api/products` | Crear producto |
| PUT | `/api/products/:id` | Editar producto |
| GET | `/api/categories` | Listar categorías |
| POST | `/api/categories` | Crear categoría |
| POST | `/api/orders` | Crear pedido |
| GET | `/api/orders` | Listar pedidos (admin) |
| GET | `/api/orders/:id` | Detalle pedido (admin) |
| GET | `/api/orders/folio/:folio` | Consultar por folio |
| PUT | `/api/orders/:id/status` | Cambiar estado |
| POST | `/api/inventory/entry` | Entrada inventario |
| POST | `/api/inventory/exit` | Salida inventario |
| GET | `/api/inventory/movements` | Movimientos (`?product_id=` opcional) |
| GET | `/api/dashboard` | Datos del dashboard |

## Productos demo

20 productos de tlapalería con precios en MXN, organizados en 8 categorías.
