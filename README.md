# Microservicios — User & Order

## Flujo de trabajo

Este proyecto implementa un sistema de microservicios compuesto por tres servicios independientes que se comunican entre sí para gestionar usuarios, pedidos y autenticación. A continuación se describe el flujo completo paso a paso.

### 1. Inicio y arranque de los servicios

El sistema se compone de cuatro contenedores definidos en `docker-compose.yml`:

1. **PostgreSQL** (`postgres:16-alpine`) — Base de datos compartida. Se inicia primero.
2. **Auth Service** — Servicio de autenticación (puerto 3003). Genera y valida tokens JWT.
3. **User Service** — Servicio de gestión de usuarios (puerto 3001). Protegido con JWT.
4. **Order Service** — Servicio de gestión de pedidos (puerto 3002). Protegido con JWT.

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

### 6. Autenticación con JWT

El sistema ahora incluye un **Auth Service** que maneja la autenticación entre microservicios. El flujo es:

1. **Crear un usuario** — `POST /create-user` en el Auth Service con `{ name, email, password }`. Almacena el usuario con contraseña hasheada (SHA-256) en memoria.
2. **Iniciar sesión** — `POST /login` con `{ email, password }`. Devuelve un token JWT firmado con HS256.
3. **Usar el token** — Incluir `Authorization: Bearer <token>` en las solicitudes a User Service u Order Service.
4. **Validación** — El middleware verifica la firma y expiración del token. Sin token o inválido → **401 Unauthorized**.

**Estructura del token JWT:**
```json
{
  "sub": "<user-id>",
  "name": "<nombre>",
  "email": "<email>",
  "iat": <issued-at>,
  "exp": <expires-in-24h>,
  "iss": "microservicios-auth"
}
```

**Endpoints del Auth Service:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/create-user` | Crear usuario (almacenamiento en memoria) |
| `POST` | `/login` | Login y obtener token JWT |
| `GET` | `/verify` | Verificar token JWT |
| `GET` | `/swagger` | Documentación Swagger |

**Ejemplo de flujo completo:**

```bash
# 1. Crear usuario
curl -X POST http://localhost:3003/create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@test.com","password":"secret123"}'

# 2. Login para obtener token
curl -X POST http://localhost:3003/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@test.com","password":"secret123"}'
# Respuesta: { "token": "eyJhbGc...", "user": { ... } }

# 3. Usar token para crear usuario protegido
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"name":"Carlos","email":"carlos@test.com"}'
# Respuesta: 201 Created

# 4. Intentar sin token → 401 Unauthorized
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name":"SinToken","email":"sin@test.com"}'
# Respuesta: { "code": "UNAUTHORIZED", "message": "Missing or invalid authorization header" }

# 5. Intentar con token inválido → 401 Unauthorized
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid.token.here" \
  -d '{"name":"Bad","email":"bad@test.com"}'
# Respuesta: { "code": "INVALID_TOKEN", "message": "Invalid or expired token" }
```

### 7. Swagger UI

Cada servicio incluye documentación Swagger/OpenAPI integrada:

- **Auth Service**: `http://localhost:3003/swagger` — Documenta los endpoints de autenticación.
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
- **Escalabilidad**: Cada servicio puede escalar independientemente, ya que cada uno corre en su propio contenedor con su propio puerto.
- **Autenticación JWT**: Todos los endpoints de User Service y Order Service requieren un token JWT válido. El token se genera en Auth Service y se verifica con la misma clave secreta (`JWT_SECRET`) en todos los servicios.
- **Almacenamiento en memoria**: El Auth Service almacena usuarios en memoria (no persiste). Para producción, se debe agregar un storage persistente (base de datos) y un algoritmo de hashing más robusto (bcrypt/argon2).

## Levantar con Docker
```bash
docker compose up --build
```

## Endpoints

| Servicio | Swagger | API |
|----------|---------|-----|
| Auth     | `:3003/swagger` | `:3003/create-user`, `:3003/login`, `:3003/verify` |
| User     | `:3001/swagger` | `:3001/users` |
| Order    | `:3002/swagger` | `:3002/orders` |

## Ejemplo
```bash
# 1. Crear usuario en Auth Service
curl -X POST http://localhost:3003/create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@test.com","password":"secret123"}'

# 2. Login para obtener token
curl -X POST http://localhost:3003/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@test.com","password":"secret123"}'
# → { "token": "eyJhbGc...", "user": { ... } }

# 3. Crear usuario protegido (con token)
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Carlos","email":"carlos@test.com"}'

# 4. Intentar sin token → 401 Unauthorized
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name":"SinToken","email":"sin@test.com"}'
# → { "code": "UNAUTHORIZED", "message": "Missing or invalid authorization header" }

# 5. Crear pedido protegido (con token)
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"userId":"1","items":["laptop","mouse"],"total":1200}'

# 6. Listar pedidos protegido (con token)
curl http://localhost:3002/orders \
  -H "Authorization: Bearer <token>"
```

## Arquitectura
```
                    ┌──────────────┐
                    │ Auth Service │
                    │   :3003      │
                    │ (JWT tokens) │
                    └──────┬───────┘
                           │
                           │  Authorization: Bearer <token>
                           ▼
┌──────────────┐         ┌──────────────┐
│ Order Service│  GET    │ User Service │
│  :3002       │────────▶│  :3001       │
└──────┬───────┘         └──────┬───────┘
       │                          │
       └────── PostgreSQL ───────┘
```
