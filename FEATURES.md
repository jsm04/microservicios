# Microservicios — Tarjetas de Jira, Casos de Uso y Flujos

## Tabla de Contenidos

1. [US-001: Crear un usuario](#us-001-crear-un-usuario)
2. [US-002: Listar todos los usuarios](#us-002-listar-todos-los-usuarios)
3. [US-003: Obtener un usuario por ID](#us-003-obtener-un-usuario-por-id)
4. [US-004: Crear un pedido](#us-004-crear-un-pedido)
5. [US-005: Listar todos los pedidos](#us-005-listar-todos-los-pedidos)
6. [US-006: Obtener un pedido por ID](#us-006-obtener-un-pedido-por-id)
7. [US-007: Documentación Swagger](#us-007-documentación-swagger)
8. [US-008: Levantar el sistema con Docker](#us-008-levantar-el-sistema-con-docker)
9. [US-009: Crear usuario en Auth Service](#us-009-crear-usuario-en-auth-service)
10. [US-010: Iniciar sesión y obtener token JWT](#us-010-iniciar-sesión-y-obtener-token-jwt)
11. [US-011: Autenticación JWT en microservicios](#us-011-autenticación-jwt-en-microservicios)
12. [US-012: Verificar token JWT](#us-012-verificar-token-jwt)

---

## US-001: Crear un usuario

**Tipo:** User Story / Tarea  
**Prioridad:** Alta  
**Componente:** User Service (`services/user`)  
**Resumen:** Como cliente externo, deseo crear un nuevo usuario para poder realizar pedidos posteriormente.

### Descripción

El User Service expone un endpoint `POST /users` que recibe un objeto JSON con `name` y `email`, los valida, los persiste en la base de datos PostgreSQL y devuelve el usuario creado con su `id` generado automáticamente.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-001.1: Creación exitosa** | El cliente envía un JSON válido con `name` y `email` únicos. El servicio responde con 201 y el usuario creado. |
| **CU-001.2: Email duplicado** | El cliente envía un `email` que ya existe en la base de datos. PostgreSQL lanza un error de restricción `UNIQUE`. El servicio responde con 400/500. |
| **CU-001.3: Campos faltantes** | El cliente envía un JSON sin `name` o sin `email`. El servicio responde con 400 Bad Request. |
| **CU-001.4: Campo vacío** | El cliente envía `name` o `email` como string vacío. El servicio responde con 400 Bad Request. |

### Flujo de Datos

```
Cliente                          User Service                    PostgreSQL
   │                                 │                               │
   │  POST /users                    │                               │
   │  { name, email }               │                               │
   │────────────────────────────────▶│                               │
   │                                 │  INSERT users                 │
   │                                 │──────────────────────────────▶│
   │                                 │  (name, email)                │
   │                                 │                               │
   │                                 │  ◀── INSERT RETURNING ────────│
   │                                 │  { id, name, email, ... }     │
   │  201 Created                    │                               │
   │  { id, name, email, ... }      │                               │
   │◀────────────────────────────────│                               │
```

### Criterios de Aceptación

- [ ] El endpoint `POST /users` acepta JSON con `name` y `email`.
- [ ] Se inserta un registro en la tabla `users` con los datos proporcionados.
- [ ] Se devuelve el usuario completo con `id` generado y `created_at`.
- [ ] Código de respuesta: **201 Created** en éxito.
- [ ] Código de respuesta: **400/500** en caso de email duplicado o datos inválidos.

---

## US-002: Listar todos los usuarios

**Tipo:** User Story / Tarea  
**Prioridad:** Media  
**Componente:** User Service (`services/user`)  
**Resumen:** Como administrador del sistema, deseo listar todos los usuarios registrados para poder consultar la información disponible.

### Descripción

El User Service expone un endpoint `GET /users` que consulta todos los registros de la tabla `users` y los devuelve ordenados por ID.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-002.1: Lista con datos** | Existen usuarios en la base de datos. El servicio devuelve un arreglo JSON con todos los usuarios. |
| **CU-002.2: Lista vacía** | No existen usuarios en la base de datos. El servicio devuelve un arreglo JSON vacío `[]`. |

### Flujo de Datos

```
Cliente                          User Service                    PostgreSQL
   │                                 │                               │
   │  GET /users                     │                               │
   │────────────────────────────────▶│                               │
   │                                 │  SELECT * FROM users          │
   │                                 │──────────────────────────────▶│
   │                                 │                               │
   │                                 │  ◀── Resultado ───────────────│
   │                                 │  [ {id, name, email, ...} ]   │
   │  200 OK                       │                               │
   │  [ {id, name, email, ...} ]   │                               │
   │◀────────────────────────────────│                               │
```

### Criterios de Aceptación

- [ ] El endpoint `GET /users` devuelve un arreglo JSON.
- [ ] Los usuarios están ordenados por `id` ascendente.
- [ ] Si no hay usuarios, se devuelve `[]`.
- [ ] Código de respuesta: **200 OK**.

---

## US-003: Obtener un usuario por ID

**Tipo:** User Story / Tarea  
**Prioridad:** Media  
**Componente:** User Service (`services/user`)  
**Resumen:** Como cliente del sistema, deseo obtener los detalles de un usuario específico por su ID para validar su existencia antes de crear un pedido.

### Descripción

El User Service expone un endpoint `GET /users/:id` que busca un usuario por su identificador. Si existe, devuelve sus datos; si no, responde con 404.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-003.1: Usuario encontrado** | El `id` corresponde a un usuario existente. El servicio devuelve sus datos completos. |
| **CU-003.2: Usuario no encontrado** | El `id` no corresponde a ningún usuario. El servicio responde con 404. |
| **CU-003.3: ID inválido** | El `id` no es un número válido. PostgreSQL lanza un error de conversión. El servicio responde con 400/500. |

### Flujo de Datos

```
Cliente                          User Service                    PostgreSQL
   │                                 │                               │
   │  GET /users/:id                 │                               │
   │  (ej: /users/1)                │                               │
   │────────────────────────────────▶│                               │
   │                                 │  SELECT ... WHERE id = $1     │
   │                                 │──────────────────────────────▶│
   │                                 │  (id = 1)                     │
   │                                 │                               │
   │                                 │  ◀── Resultado ───────────────│
   │                                 │                               │
   │  200 OK                       │                               │
   │  { id, name, email, ... }     │                               │
   │◀────────────────────────────────│                               │
   │                                 │                               │
   │  (si no existe):               │                               │
   │  404 Not Found                 │                               │
   │◀────────────────────────────────│                               │
```

### Criterios de Aceptación

- [ ] El endpoint `GET /users/:id` acepta un ID numérico en la URL.
- [ ] Si el usuario existe, se devuelve su información completa.
- [ ] Si el usuario no existe, se responde con **404 Not Found**.
- [ ] Código de respuesta: **200 OK** en éxito, **404** en no encontrado.

---

## US-004: Crear un pedido

**Tipo:** User Story / Tarea  
**Prioridad:** Alta  
**Componente:** Order Service (`services/order`)  
**Resumen:** Como cliente del sistema, deseo crear un pedido asociado a un usuario existente para registrar una compra.

### Descripción

El Order Service expone un endpoint `POST /orders` que recibe los datos del pedido, valida que el usuario exista llamando al User Service vía HTTP, y si la validación es exitosa, persiste el pedido en la base de datos.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-004.1: Pedido exitoso** | El cliente envía un JSON válido con `userId` existente, `items` (arreglo de strings) y `total` (número). El servicio valida el usuario, guarda el pedido y responde con 201. |
| **CU-004.2: Usuario no encontrado** | El `userId` no corresponde a ningún usuario. El Order Service recibe 404 del User Service y responde con 404 sin guardar el pedido. |
| **CU-004.3: User Service caído** | El User Service no responde. El Order Service propaga el error (timeout o conexión rechazada) y responde con 502/503. |
| **CU-004.4: Datos faltantes** | El cliente omite `userId`, `items` o `total`. El servicio responde con 400 Bad Request. |
| **CU-004.5: Items vacío** | El cliente envía `items` como arreglo vacío. El servicio acepta el pedido (sin validación de contenido). |
| **CU-004.6: Total negativo** | El cliente envía un `total` negativo. El servicio acepta el valor (sin validación de rango). |

### Flujo de Datos

```
Cliente                          Order Service                     User Service                PostgreSQL
   │                                  │                               │                           │
   │  POST /orders                    │                               │                           │
   │  { userId, items, total }       │                               │                           │
   │─────────────────────────────────▶│                               │                           │
   │                                  │                               │                           │
   │                                  │  GET /users/:userId           │                           │
   │                                  │──────────────────────────────▶│                           │
   │                                  │                               │                           │
   │                                  │  ◀── SELECT ... WHERE id    │                           │
   │                                  │                               │                           │
   │                                  │  ◀── 200 OK                 │                           │
   │                                  │  { id, name, email }        │                           │
   │                                  │                               │                           │
   │                                  │  INSERT orders                │                           │
   │                                  │────────────────────────────────────────────────────────▶│
   │                                  │  (user_id, items, total)      │                           │
   │                                  │                               │                           │
   │                                  │  ◀── INSERT RETURNING ────────│                           │
   │                                  │  { id, user_id, items, ... }  │                           │
   │                                  │                               │                           │
   │  201 Created                     │                               │                           │
   │  { id, user_id, items, total }  │                               │                           │
   │◀─────────────────────────────────│                               │                           │
```

**Flujo alternativo — Usuario no encontrado:**

```
Cliente                          Order Service                     User Service
   │                                  │                               │
   │  POST /orders                    │                               │
   │  { userId: "999", ... }         │                               │
   │─────────────────────────────────▶│                               │
   │                                  │                               │
   │                                  │  GET /users/999               │
   │                                  │──────────────────────────────▶│
   │                                  │                               │
   │                                  │  ◀── 404 Not Found          │
   │                                  │                               │
   │  404 Not Found                   │                               │
   │  { error: "User not found" }    │                               │
   │◀─────────────────────────────────│                               │
```

### Criterios de Aceptación

- [ ] El endpoint `POST /orders` acepta JSON con `userId`, `items` y `total`.
- [ ] Se valida la existencia del usuario llamando al User Service.
- [ ] Si el usuario no existe, se responde con **404 Not Found** sin guardar el pedido.
- [ ] Si el usuario existe, se persiste el pedido y se responde con **201 Created**.
- [ ] El campo `items` se almacena como JSONB en la base de datos.
- [ ] El campo `total` se convierte de string a número antes de la respuesta.
- [ ] Se devuelve el pedido completo con `id` generado y `created_at`.

---

## US-005: Listar todos los pedidos

**Tipo:** User Story / Tarea  
**Prioridad:** Media  
**Componente:** Order Service (`services/order`)  
**Resumen:** Como administrador del sistema, deseo listar todos los pedidos registrados para poder consultar y auditar las transacciones.

### Descripción

El Order Service expone un endpoint `GET /orders` que consulta todos los registros de la tabla `orders` y los devuelve ordenados por ID.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-005.1: Lista con datos** | Existen pedidos en la base de datos. El servicio devuelve un arreglo JSON con todos los pedidos, convirtiendo `total` a número. |
| **CU-005.2: Lista vacía** | No existen pedidos en la base de datos. El servicio devuelve un arreglo JSON vacío `[]`. |

### Flujo de Datos

```
Cliente                          Order Service                     PostgreSQL
   │                                  │                               │
   │  GET /orders                     │                               │
   │─────────────────────────────────▶│                               │
   │                                  │  SELECT * FROM orders         │
   │                                  │──────────────────────────────▶│
   │                                  │                               │
   │                                  │  ◀── Resultado ───────────────│
   │                                  │  [ {id, user_id, items,      │
   │                                  │    total (string), ...} ]     │
   │                                  │                               │
   │                                  │  Convierte total a Number     │
   │                                  │                               │
   │  200 OK                        │                               │
   │  [ {id, user_id, items,        │                               │
   │    total (number), ...} ]       │                               │
   │◀────────────────────────────────│                               │
```

### Criterios de Aceptación

- [ ] El endpoint `GET /orders` devuelve un arreglo JSON.
- [ ] Los pedidos están ordenados por `id` ascendente.
- [ ] El campo `total` se devuelve como número, no como string.
- [ ] Si no hay pedidos, se devuelve `[]`.
- [ ] Código de respuesta: **200 OK**.

---

## US-006: Obtener un pedido por ID

**Tipo:** User Story / Tarea  
**Prioridad:** Media  
**Componente:** Order Service (`services/order`)  
**Resumen:** Como cliente del sistema, deseo obtener los detalles de un pedido específico por su ID para consultar el estado de mi compra.

### Descripción

El Order Service expone un endpoint `GET /orders/:id` que busca un pedido por su identificador. Si existe, devuelve sus datos; si no, responde con 404.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-006.1: Pedido encontrado** | El `id` corresponde a un pedido existente. El servicio devuelve sus datos completos. |
| **CU-006.2: Pedido no encontrado** | El `id` no corresponde a ningún pedido. El servicio responde con 404. |
| **CU-006.3: ID inválido** | El `id` no es un número válido. PostgreSQL lanza un error de conversión. El servicio responde con 400/500. |

### Flujo de Datos

```
Cliente                          Order Service                     PostgreSQL
   │                                  │                               │
   │  GET /orders/:id                │                               │
   │  (ej: /orders/1)                │                               │
   │─────────────────────────────────▶│                               │
   │                                  │  SELECT ... WHERE id = $1     │
   │                                  │──────────────────────────────▶│
   │                                  │  (id = 1)                     │
   │                                  │                               │
   │                                  │  ◀── Resultado ───────────────│
   │                                  │  { id, user_id, items,       │
   │                                  │    total (string), ... }      │
   │                                  │                               │
   │  200 OK                        │                               │
   │  { id, user_id, items,         │                               │
   │    total (number), ... }        │                               │
   │◀────────────────────────────────│                               │
   │                                  │                               │
   │  (si no existe):                │                               │
   │  404 Not Found                  │                               │
   │◀────────────────────────────────│                               │
```

### Criterios de Aceptación

- [ ] El endpoint `GET /orders/:id` acepta un ID numérico en la URL.
- [ ] Si el pedido existe, se devuelve su información completa.
- [ ] Si el pedido no existe, se responde con **404 Not Found**.
- [ ] El campo `total` se devuelve como número.
- [ ] Código de respuesta: **200 OK** en éxito, **404** en no encontrado.

---

## US-007: Documentación Swagger

**Tipo:** Tarea Técnica  
**Prioridad:** Alta  
**Componente:** User Service + Order Service  
**Resumen:** Como desarrollador, deseo que cada servicio exponga documentación Swagger/OpenAPI para que los consumidores de la API puedan explorar y probar los endpoints.

### Descripción

Cada servicio expone dos rutas relacionadas con Swagger:

- `/swagger` — Página HTML con Swagger UI que renderiza la documentación interactiva.
- `/swagger.json` — Espec OpenAPI 3.0.3 generada en tiempo real con todos los endpoints del servicio.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-007.1: Acceder a Swagger UI** | El usuario navega a `http://<servicio>:<puerto>/swagger`. Se muestra la interfaz de Swagger UI con la documentación del servicio. |
| **CU-007.2: Acceder al spec OpenAPI** | El usuario navega a `http://<servicio>:<puerto>/swagger.json`. Se devuelve el spec OpenAPI 3.0.3 en formato JSON. |
| **CU-007.3: Probar endpoints desde Swagger** | El usuario usa la interfaz de Swagger UI para enviar solicitudes de prueba a los endpoints del servicio. |

### Criterios de Aceptación

- [ ] El endpoint `/swagger` sirve una página HTML con Swagger UI.
- [ ] El endpoint `/swagger.json` devuelve el spec OpenAPI 3.0.3 en JSON.
- [ ] La documentación incluye todos los endpoints del servicio con sus métodos HTTP.
- [ ] La documentación incluye los esquemas de request body y response.
- [ ] Swagger UI permite probar los endpoints directamente desde el navegador.

---

## US-008: Levantar el sistema con Docker

**Tipo:** Tarea de Infraestructura  
**Prioridad:** Alta  
**Componente:** Docker Compose (`docker-compose.yml`)  
**Resumen:** Como desarrollador, deseo levantar todo el sistema (ambos servicios y la base de datos) con un solo comando para poder desarrollar y probar localmente.

### Descripción

El archivo `docker-compose.yml` define cuatro servicios con dependencias y healthchecks:

1. **PostgreSQL** — Base de datos compartida. Se verifica con `pg_isready`.
2. **Auth Service** — Se construye desde `./services/auth` y expone endpoints de autenticación (puerto 3003).
3. **User Service** — Se construye desde `./services/user` y depende de PostgreSQL.
4. **Order Service** — Se construye desde `./services/order` y depende de User Service y PostgreSQL.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-008.1: Levantar todo** | El desarrollador ejecuta `docker compose up --build`. Los servicios se inician en orden: PostgreSQL → User Service → Order Service. |
| **CU-008.2: Detener todo** | El desarrollador ejecuta `docker compose down`. Todos los contenedores se detienen y se eliminan. Los datos de PostgreSQL persisten en un volumen. |
| **CU-008.3: Reiniciar servicios** | El desarrollador modifica el código y ejecuta `docker compose up --build` para reconstruir y reiniciar los servicios afectados. |
| **CU-008.4: Verificar healthchecks** | El sistema verifica que cada servicio esté saludable antes de iniciar el siguiente. Si un healthcheck falla, el servicio dependiente no se inicia. |

### Criterios de Aceptación

- [ ] `docker compose up --build` levanta los tres servicios correctamente.
- [ ] PostgreSQL se inicia y acepta conexiones antes de que los servicios se conecten.
- [ ] El User Service se inicia después de que PostgreSQL esté saludable.
- [ ] El Order Service se inicia después de que User Service y PostgreSQL estén saludables.
- [ ] Los puertos 3001 y 3002 están expuestos en el host.
- [ ] Los datos de PostgreSQL persisten entre reinicios (volumen nombrado).
- [ ] `docker compose down` detiene y elimina todos los contenedores.

---

## US-009: Crear usuario en Auth Service

**Tipo:** User Story / Tarea
**Prioridad:** Alta
**Componente:** Auth Service (`services/auth`)
**Resumen:** Como administrador del sistema, deseo crear un usuario en el Auth Service para poder autenticarlo posteriormente.

### Descripción

El Auth Service expone un endpoint `POST /create-user` que recibe un objeto JSON con `name`, `email` y `password`. Almacena el usuario con la contraseña hasheada (SHA-256) en memoria y devuelve el usuario creado.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-009.1: Creación exitosa** | El cliente envía un JSON válido con `name`, `email` y `password` no vacíos. El servicio responde con 201 y el usuario creado. |
| **CU-009.2: Email duplicado** | El cliente envía un `email` que ya existe en el almacenamiento. El servicio responde con 400. |
| **CU-009.3: Campos faltantes** | El cliente omite `name`, `email` o `password`. El servicio responde con 400. |
| **CU-009.4: Campo vacío** | El cliente envía algún campo como string vacío. El servicio responde con 400. |

### Flujo de Datos

```
Cliente                          Auth Service                    Almacenamiento en memoria
   │                                   │                                       │
   │  POST /create-user                 │                                       │
   │  { name, email, password }        │                                       │
   │──────────────────────────────────▶│                                       │
   │                                   │  hashPassword(password)               │
   │                                   │  (SHA-256 + salt)                     │
   │                                   │                                       │
   │                                   │  INSERT users (en memoria)            │
   │                                   │                                       │
   │  201 Created                      │                                       │
   │  { id, name, email }             │                                       │
   │◀──────────────────────────────────│                                       │
```

### Criterios de Aceptación

- [ ] El endpoint `POST /create-user` acepta JSON con `name`, `email` y `password`.
- [ ] La contraseña se almacena hasheada (SHA-256) en memoria.
- [ ] Se devuelve el usuario completo con `id` generado.
- [ ] Código de respuesta: **201 Created** en éxito.
- [ ] Código de respuesta: **400** en caso de campos faltantes, vacíos o email duplicado.

---

## US-010: Iniciar sesión y obtener token JWT

**Tipo:** User Story / Tarea
**Prioridad:** Alta
**Componente:** Auth Service (`services/auth`)
**Resumen:** Como usuario registrado, deseo iniciar sesión con mis credenciales para obtener un token JWT que me permita acceder a los microservicios protegidos.

### Descripción

El Auth Service expone un endpoint `POST /login` que recibe `email` y `password`, valida las credenciales contra el almacenamiento en memoria y devuelve un token JWT firmado con HS256 que expira en 24 horas.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-010.1: Login exitoso** | El cliente envía credenciales correctas. El servicio responde con 200, un token JWT y los datos del usuario. |
| **CU-010.2: Credenciales inválidas** | El `email` no existe o la contraseña es incorrecta. El servicio responde con 401. |
| **CU-010.3: Campos faltantes** | El cliente omite `email` o `password`. El servicio responde con 400. |

### Flujo de Datos

```
Cliente                          Auth Service                    Almacenamiento en memoria
   │                                   │                                       │
   │  POST /login                       │                                       │
   │  { email, password }              │                                       │
   │──────────────────────────────────▶│                                       │
   │                                   │  findUserByEmail(email)               │
   │                                   │                                       │
   │                                   │  ◀── Usuario encontrado ──────────────│
   │                                   │                                       │
   │                                   │  verifyPassword(password, hash)       │
   │                                   │                                       │
   │                                   │  ◀── Coincide ────────────────────────│
   │                                   │                                       │
   │                                   │  generateToken(sub, name, email)      │
   │                                   │  (HS256, expira en 24h)               │
   │                                   │                                       │
   │  200 OK                          │                                       │
   │  { token, user }                 │                                       │
   │◀──────────────────────────────────│                                       │
```

### Estructura del token JWT

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

### Criterios de Aceptación

- [ ] El endpoint `POST /login` acepta JSON con `email` y `password`.
- [ ] Se valida que el usuario exista y la contraseña coincida.
- [ ] Se genera un token JWT firmado con HS256.
- [ ] El token expira a las 24 horas.
- [ ] Se devuelve el token y los datos del usuario.
- [ ] Código de respuesta: **200 OK** en éxito.
- [ ] Código de respuesta: **401** en caso de credenciales inválidas.

---

## US-011: Autenticación JWT en microservicios

**Tipo:** User Story / Tarea
**Prioridad:** Alta
**Componente:** User Service + Order Service
**Resumen:** Como administrador del sistema, deseo que todos los endpoints de User Service y Order Service requieran un token JWT válido para proteger el acceso a los microservicios.

### Descripción

Tanto el User Service como el Order Service implementan un middleware `authMiddleware` que se ejecuta antes de cada handler de ruta. Este middleware:

1. Extrae el header `Authorization: Bearer <token>` de la solicitud.
2. Valida la firma y expiración del token usando `jose/jwtVerify`.
3. Si el token es válido, adjunta el payload decodificado a la solicitud y permite continuar.
4. Si el token es inválido o falta, responde con **401 Unauthorized**.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-011.1: Solicitud con token válido** | El cliente envía un token JWT válido. El middleware lo acepta y la solicitud se procesa normalmente. |
| **CU-011.2: Solicitud sin token** | El cliente no envía el header `Authorization`. Se responde con **401 Unauthorized**. |
| **CU-011.3: Token inválido o expirado** | El token tiene una firma incorrecta o ya expiró. Se responde con **401 Unauthorized**. |

### Criterios de Aceptación

- [ ] Todos los endpoints de User Service requieren autenticación.
- [ ] Todos los endpoints de Order Service requieren autenticación.
- [ ] Sin `Authorization` header → **401 Unauthorized** con `{ "code": "UNAUTHORIZED", "message": "Missing or invalid authorization header" }`.
- [ ] Token inválido → **401 Unauthorized** con `{ "code": "INVALID_TOKEN", "message": "Invalid or expired token" }`.
- [ ] Token válido → la solicitud se procesa normalmente.
- [ ] El mismo `JWT_SECRET` se usa en todos los servicios.

---

## US-012: Verificar token JWT

**Tipo:** User Story / Tarea
**Prioridad:** Media
**Componente:** Auth Service (`services/auth`)
**Resumen:** Como cliente, deseo verificar un token JWT en el Auth Service para confirmar su validez y obtener los datos del usuario asociado.

### Descripción

El Auth Service expone un endpoint `GET /verify` que recibe un token JWT en el header `Authorization: Bearer <token>`, lo valida y devuelve su contenido si es válido.

### Casos de Uso

| Caso de Uso | Descripción |
|-------------|-------------|
| **CU-012.1: Token válido** | El cliente envía un token JWT válido. El servicio responde con 200 y los datos del usuario. |
| **CU-012.2: Token inválido** | El token tiene firma incorrecta. El servicio responde con 401. |
| **CU-012.3: Token expirado** | El token ya expiró. El servicio responde con 401. |
| **CU-012.4: Sin token** | El cliente no envía `Authorization`. El servicio responde con 401. |

### Criterios de Aceptación

- [ ] El endpoint `GET /verify` acepta un token en el header `Authorization`.
- [ ] Token válido → **200 OK** con `{ "valid": true, "user": { id, name, email } }`.
- [ ] Token inválido → **401 Unauthorized**.
- [ ] Token expirado → **401 Unauthorized**.
- [ ] Sin token → **401 Unauthorized**.

---

## Resumen de Dependencias entre Tareas

```
US-001 (Crear usuario)
    │
    ├── US-002 (Listar usuarios)
    ├── US-003 (Obtener usuario por ID)
    │
US-007 (Documentación Swagger)
    │
US-008 (Levantar con Docker)
    │
US-004 (Crear pedido)
    │
    ├── US-005 (Listar pedidos)
    └── US-006 (Obtener pedido por ID)
```

**Orden recomendado de implementación:**

1. **US-008** — Configurar Docker Compose (infraestructura base)
2. **US-001** — Implementar User Service (CRUD de usuarios)
3. **US-002** — Listar usuarios
4. **US-003** — Obtener usuario por ID
5. **US-004** — Implementar Order Service con validación HTTP
6. **US-005** — Listar pedidos
7. **US-006** — Obtener pedido por ID
8. **US-009** — Implementar Auth Service (crear usuario + login)
9. **US-010** — Generar tokens JWT
10. **US-011** — Middleware de autenticación JWT en User/Order Service
11. **US-012** — Verificar token JWT
12. **US-007** — Documentación Swagger (puede hacerse en paralelo)

---

## Resumen de Endpoints

| Método | Endpoint | Servicio | Descripción | Respuesta Éxito | Respuesta Error |
|--------|----------|----------|-------------|-----------------|-----------------|
| `POST` | `/users` | User | Crear usuario | 201 + usuario | 400/500 (email duplicado) |
| `GET` | `/users` | User | Listar usuarios | 200 + arreglo | — |
| `GET` | `/users/:id` | User | Obtener usuario | 200 + usuario | 404 (no encontrado) |
| `POST` | `/orders` | Order | Crear pedido | 201 + pedido | 404 (usuario no existe) |
| `GET` | `/orders` | Order | Listar pedidos | 200 + arreglo | — |
| `GET` | `/orders/:id` | Order | Obtener pedido | 200 + pedido | 404 (no encontrado) |
| `POST` | `/create-user` | Auth | Crear usuario (auth) | 201 + usuario | 400 (campos faltantes / email duplicado) |
| `POST` | `/login` | Auth | Login y obtener token | 200 + { token, user } | 401 (credenciales inválidas) |
| `GET` | `/verify` | Auth | Verificar token | 200 + { valid, user } | 401 (token inválido) |
| `GET` | `/swagger` | Todos | Swagger UI | 200 + HTML | — |
| `GET` | `/swagger.json` | Todos | OpenAPI spec | 200 + JSON | — |
