# Microservicios — User & Order

## Flujo de trabajo

Este proyecto implementa un sistema de microservicios compuesto por dos servicios independientes que se comunican entre sí para gestionar usuarios y pedidos. A continuación se describe el flujo completo paso a paso.

### 1. Inicio y arranque de los servicios

El sistema se compone de tres contenedores definidos en `docker-compose.yml`:

1. **PostgreSQL** (`postgres:16-alpine`) — Base de datos compartida por ambos servicios. Se inicia primero y se marca como `service_healthy` cuando `pg_isready` confirma que acepta conexiones.
2. **User Service** — Servicio de gestión de usuarios (puerto 3001). Se inicia después de que PostgreSQL esté saludable.
3. **Order Service** — Servicio de gestión de pedidos (puerto 3002). Se inicia después de que tanto PostgreSQL como el User Service estén saludables.

Esta cadena de dependencias garantiza que cada servicio esté disponible antes de que el siguiente intente conectarse a él.

### 2. Base de datos compartida

Ambos servicios se conectan a la misma base de datos PostgreSQL (`microservicios`) mediante la variable de entorno `DATABASE_URL`. La base de datos contiene dos tablas:

**Tabla `users`** — Almacena la información de los usuarios:
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL (PK) | Identificador único autoincremental |
| `name` | TEXT | Nombre del usuario |
| `email` | TEXT (UNIQUE) | Correo electrónico, debe ser único |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación |

**Tabla `orders`** — Almacena la información de los pedidos:
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL (PK) | Identificador único autoincremental |
| `user_id` | INTEGER (FK → users.id) | Referencia al usuario que realizó el pedido |
| `items` | JSONB | Lista de items del pedido almacenada como JSON binario |
| `total` | NUMERIC(10,2) | Monto total del pedido |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación |

La relación entre tablas se establece mediante una **foreign key**: `user_id` en `orders` referencia a `id` en `users`. Esto garantiza la integridad referencial a nivel de base de datos.

### 3. Flujo de creación de un usuario

1. El cliente envía una solicitud `POST` a `http://localhost:3001/users` con un cuerpo JSON que contiene `name` y `email`.
2. El **User Service** recibe la solicitud y ejecuta una consulta `INSERT` en la tabla `users` con los datos proporcionados.
3. La base de datos valida que el `email` no esté duplicado (por la restricción `UNIQUE`). Si ya existe, PostgreSQL lanza un error y el servicio responde con un código de estado 400/500.
4. Si la inserción es exitosa, la consulta `RETURNING` devuelve el registro completo insertado (incluyendo el `id` generado automáticamente y el `created_at`).
5. El User Service responde con código **201 Created** y el JSON del usuario creado.

### 4. Flujo de creación de un pedido (el flujo principal)

Este es el flujo más importante del sistema, ya que involucra la comunicación entre los dos microservicios:

1. **Solicitud del cliente** — El cliente envía una solicitud `POST` a `http://localhost:3002/orders` con un cuerpo JSON que contiene:
   - `userId`: el identificador del usuario que realiza el pedido
   - `items`: un arreglo de strings con los items del pedido
   - `total`: el monto total del pedido

2. **Validación del usuario (comunicación inter-servicio)** — Antes de guardar el pedido, el **Order Service** debe verificar que el usuario existe. Para ello:
   - El Order Service lee la variable de entorno `USER_SERVICE_URL` (que en Docker apunta a `http://user-service:3001` y en desarrollo local a `http://localhost:3001`).
   - Realiza una solicitud HTTP `GET` a `http://<USER_SERVICE_URL>/users/<userId>`.
   - Esta es una **llamada síncrona**: el Order Service espera la respuesta del User Service antes de continuar.

3. **Resultado de la validación**:
   - **Si el usuario existe** (respuesta 200 del User Service): el Order Service procede a guardar el pedido.
   - **Si el usuario no existe** (respuesta 404 del User Service): el Order Service responde inmediatamente con **404 Not Found** y un mensaje `{ "error": "User not found" }`. El pedido **no se guarda**.

4. **Almacenamiento del pedido** — Si la validación es exitosa:
   - El Order Service ejecuta un `INSERT` en la tabla `orders` con `user_id`, `items` (serializado a JSON), y `total`.
   - La foreign key `user_id → users(id)` proporciona una segunda capa de validación a nivel de base de datos.
   - La consulta `RETURNING` devuelve el registro completo del pedido creado.
   - El Order Service responde con código **201 Created** y el JSON del pedido.

5. **Manejo de tipos numéricos** — PostgreSQL devuelve valores `NUMERIC` como strings. El Order Service convierte explícitamente `total` a `Number` antes de enviar la respuesta JSON para evitar problemas de serialización.

### 5. Flujo de consulta de datos

**Listar todos los usuarios** (`GET /users`):
- El User Service ejecuta `SELECT id, name, email, created_at FROM users ORDER BY id`.
- Devuelve un arreglo JSON con todos los usuarios ordenados por ID.

**Obtener un usuario por ID** (`GET /users/:id`):
- El User Service ejecuta `SELECT ... FROM users WHERE id = $1`.
- Si no encuentra el usuario, responde con **404 Not Found**.
- Si lo encuentra, responde con **200 OK** y el JSON del usuario.

**Listar todos los pedidos** (`GET /orders`):
- El Order Service ejecuta `SELECT id, user_id, items, total, created_at FROM orders ORDER BY id`.
- Convierte cada `total` de string a número.
- Devuelve un arreglo JSON con todos los pedidos ordenados por ID.

**Obtener un pedido por ID** (`GET /orders/:id`):
- El Order Service ejecuta `SELECT ... FROM orders WHERE id = $1`.
- Si no encuentra el pedido, responde con **404 Not Found**.
- Si lo encuentra, responde con **200 OK** y el JSON del pedido (con `total` convertido a número).

### 6. Swagger UI

Cada servicio incluye documentación Swagger/OpenAPI integrada:

- **User Service**: `http://localhost:3001/swagger` — Documenta los endpoints de usuarios.
- **Order Service**: `http://localhost:3002/swagger` — Documenta los endpoints de pedidos.

El archivo `/swagger.json` de cada servicio genera el spec OpenAPI 3.0.3 en tiempo real, y el archivo `/swagger` sirve una página HTML con Swagger UI que consume ese spec. Esto permite explorar y probar los endpoints directamente desde el navegador.

### 7. Resumen del flujo de datos

```
Cliente
  │
  │  POST /users (name, email)
  ▼
┌──────────────┐
│ User Service │
│  :3001       │
└──────┬───────┘
       │  INSERT → users (id, name, email, created_at)
       ▼
  ┌─────────┐
  │PostgreSQL│
  └─────────┘

Cliente
  │
  │  POST /orders (userId, items, total)
  ▼
┌──────────────┐         ┌──────────────┐
│ Order Service│  GET    │ User Service │
│  :3002       │────────▶│  :3001       │
└──────┬───────┘         │ /users/:id   │
       │                  └──────────────┘
       │  ┌─────────────────────────────┐
       │  │ 200 OK → Usuario existe     │
       │  │ 404 Not Found → Usuario no  │
       │  │    existe (aborta pedido)   │
       │  └─────────────────────────────┘
       │
       │  INSERT → orders (user_id, items, total, created_at)
       ▼
  ┌─────────┐
  │PostgreSQL│
  └─────────┘
```

### 8. Consideraciones importantes

- **Acoplamiento temporal**: El Order Service depende del User Service para validar usuarios. Si el User Service está caído, no se pueden crear pedidos.
- **Comunicación síncrona**: La validación de usuario se realiza mediante una llamada HTTP directa (síncrona). Esto significa que el Order Service bloquea la respuesta mientras espera al User Service.
- **Base de datos compartida**: Ambos servicios comparten la misma base de datos PostgreSQL. Esto simplifica la integridad referencial (foreign keys) pero crea un acoplamiento físico entre los servicios.
- **Escalabilidad**: El User Service puede escalar independientemente del Order Service, ya que cada uno corre en su propio contenedor con su propio puerto.

## Levantar con Docker
```bash
docker compose up --build
```

## Endpoints

| Servicio | Swagger | API |
|----------|---------|-----|
| User     | `:3001/swagger` | `:3001/users` |
| Order    | `:3002/swagger` | `:3002/orders` |

## Ejemplo
```bash
# Crear usuario
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@test.com"}'

# Crear pedido (valida usuario via HTTP call)
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"1","items":["laptop","mouse"],"total":1200}'

# Listar pedidos
curl http://localhost:3002/orders
```

## Arquitectura
```
[Order Service :3002] ───HTTP──→ [User Service :3001]
         │                           │
         └────── PostgreSQL ────────┘
```
