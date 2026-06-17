# Documentación Técnica — Casos de Uso, Escenarios y Diagramas

## Tabla de Contenidos

1. [Arquitectura de Microservicios (Diagrama ASCII)](#1-diagrama-de-arquitectura-de-microservicios)
2. [Casos de Uso con Escenarios Given/When/Then](#2-casos-de-uso-con-escenarios-givenwhen-then)
3. [Interpretación de Descripciones y Algoritmos](#3-interpretación-de-descripciones-y-algoritmos)
4. [Guía para Presentación del Proyecto](#4-guía-para-presentación-del-proyecto)

---

## 1. Diagrama de Arquitectura de Microservicios

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Cliente (Frontend / curl)                    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    │  POST /create-user │  POST /login       │  GET /verify
    │                    │                    │
    ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     US-009: Auth Service (puerto 3003)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ POST        │  │ POST        │  │ GET         │                │
│  │ /create-user│  │ /login      │  │ /verify     │                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
│         │                │                 │                        │
│         │                │                 │                        │
│         ▼                ▼                 │                        │
│  ┌─────────────┐  ┌─────────────┐         │                        │
│  │ hashPassword│  │ findUserBy  │         │                        │
│  │ (SHA-256)   │  │ Email()     │         │                        │
│  └──────┬──────┘  └──────┬──────┘         │                        │
│         │                │                 │                        │
│         │         ┌──────▼──────┐          │                        │
│         │         │ verifyPass- │          │                        │
│         │         │ word()      │          │                        │
│         │         └──────┬──────┘          │                        │
│         │                │                 │                        │
│         │         ┌──────▼──────┐          │                        │
│         │         │ generate-   │          │                        │
│         │         │ Token()     │          │                        │
│         │         │ (HS256, 24h)│          │                        │
│         │         └─────────────┘          │                        │
│         │                                  │                        │
│         ▼                                  │                        │
│  ┌─────────────────────────────────┐       │                        │
│  │   Almacenamiento en memoria     │       │                        │
│  │   users: User[]                 │       │                        │
│  └─────────────────────────────────┘       │                        │
└────────────────────────────────────────────┘                        │
                                                                      │
    ┌─────────────────────────────────────────────────────────────────┤
    │                                                                 │
    │                    POST /orders                                 │
    │                    GET /orders                                  │
    │                    GET /orders/:id                              │
    │                    Authorization: Bearer <token>                │
    │                                                                 │
    ▼                                                                 │
┌─────────────────────────────────────────────────────────────────────┐
│                     US-004 a US-006: Order Service (puerto 3002)   │
│  ┌─────────────────────────────────────────────┐                   │
│  │            authMiddleware(req)              │                   │
│  │  ┌──────────────────────────────────────┐   │                   │
│  │  │ validateBearerToken(req)             │   │                   │
│  │  │  1. Extraer Authorization header     │   │                   │
│  │  │  2. jwtVerify(token, JWT_SECRET)     │   │                   │
│  │  │  3. Si falla → 401 Unauthorized      │   │                   │
│  │  │  4. Si ok → attach jwtPayload        │   │                   │
│  │  └──────────────────────────────────────┘   │                   │
│  └─────────────────────────────────────────────┘                   │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ POST /orders │  │ GET /orders  │  │ GET /orders/ │            │
│  │              │  │              │  │ :id          │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                  │                     │
│         │   ┌─────────────▼─────────────┐    │                     │
│         │   │  HttpUserClient.findUser() │    │                     │
│         │   │  GET /users/:id            │    │                     │
│         │   └─────────────┬─────────────┘    │                     │
│         │                 │                  │                     │
│         ▼                 ▼                  ▼                     │
│  ┌──────────────────────────────────────────────────┐              │
│  │         PostgreSQL (orders table)                │              │
│  │  id | user_id | items (jsonb) | total | created │              │
│  └──────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                                                      │
    ┌─────────────────────────────────────────────────────────────────┤
    │                                                                 │
    │                    POST /users                                  │
    │                    GET /users                                   │
    │                    GET /users/:id                               │
    │                    Authorization: Bearer <token>                │
    │                                                                 │
    ▼                                                                 │
┌─────────────────────────────────────────────────────────────────────┐
│                     US-001 a US-003: User Service (puerto 3001)    │
│  ┌─────────────────────────────────────────────┐                   │
│  │            authMiddleware(req)              │                   │
│  │  ┌──────────────────────────────────────┐   │                   │
│  │  │ validateBearerToken(req)             │   │                   │
│  │  │  1. Extraer Authorization header     │   │                   │
│  │  │  2. jwtVerify(token, JWT_SECRET)     │   │                   │
│  │  │  3. Si falla → 401 Unauthorized      │   │                   │
│  │  │  4. Si ok → attach jwtPayload        │   │                   │
│  │  └──────────────────────────────────────┘   │                   │
│  └─────────────────────────────────────────────┘                   │
│                                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐         │
│  │ POST /users   │  │ GET /users    │  │ GET /users/:id│         │
│  │               │  │               │  │               │         │
│  │ name, email   │  │               │  │               │         │
│  │               │  │               │  │               │         │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘         │
│          │                  │                    │                 │
│          ▼                  ▼                    ▼                 │
│  ┌────────────────────────────────────────────────────┐           │
│  │         PostgreSQL (users table)                   │           │
│  │  id | name | email | created_at | updated_at      │           │
│  └────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                                                                      │
    ┌─────────────────────────────────────────────────────────────────┤
    │                                                                 │
    │                    PostgreSQL                                   │
    │  ┌──────────────────────────────────────────────┐              │
    │  │  ┌────────────┐  ┌────────────┐             │              │
    │  │  │  users     │  │  orders    │             │              │
    │  │  │  ┌───────┐ │  │  ┌───────┐ │             │              │
    │  │  │  │  id   │ │  │  │  id   │ │             │              │
    │  │  │  │ name  │ │  │  │user_id│ │             │              │
    │  │  │  │email  │ │  │  │ items │ │             │              │
    │  │  │  │created│ │  │  │ total │ │             │              │
    │  │  │  └───────┘ │  │  └───────┘ │             │              │
    │  │  └────────────┘  └────────────┘             │              │
    │  └──────────────────────────────────────────────┘              │
    └─────────────────────────────────────────────────────────────────┘
```

---

## 2. Casos de Uso con Escenarios Given/When/Then

### US-009: Crear usuario en Auth Service

**Escenario: Creación exitosa de usuario**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que el Auth Service está corriendo en `http://localhost:3003` | Que el servicio acepta conexiones entrantes |
| Dado que no existe un usuario con email `ana@test.com` | Que el almacenamiento en memoria no contiene ese email |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `POST /create-user` con `{ "name": "Ana", "email": "ana@test.com", "password": "secret123" }` | Que se responde con código **201 Created** |
| | Que la respuesta contiene `{ "id": "<uuid>", "name": "Ana", "email": "ana@test.com" }` |
| | Que la contraseña se almacena hasheada (SHA-256 + salt) en memoria |

**Escenario: Email ya registrado**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que existe un usuario con email `ana@test.com` en el Auth Service | Que `emailExists("ana@test.com")` retorna `true` |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `POST /create-user` con `{ "name": "Ana2", "email": "ana@test.com", "password": "otro123" }` | Que se responde con código **400 Bad Request** |
| | Que la respuesta contiene `{ "code": "EMAIL_EXISTS", "message": "Email already registered" }` |

**Escenario: Campos faltantes**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que el Auth Service está corriendo | Que el endpoint `/create-user` está disponible |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `POST /create-user` con `{ "name": "Ana", "email": "ana@test.com" }` (sin password) | Que se responde con código **400 Bad Request** |
| | Que la respuesta contiene `{ "code": "MISSING_FIELDS", "message": "Missing required fields: name, email, and password" }` |

---

### US-010: Iniciar sesión y obtener token JWT

**Escenario: Login exitoso**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que existe un usuario con email `ana@test.com` y contraseña hasheada `abc123...` | Que `findUserByEmail("ana@test.com")` retorna el usuario |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `POST /login` con `{ "email": "ana@test.com", "password": "secret123" }` | Que se responde con código **200 OK** |
| | Que la respuesta contiene un campo `token` con valor JWT válido |
| | Que el JWT contiene `sub`, `name`, `email`, `iat`, `exp` (24h), `iss` |
| | Que la respuesta contiene `user` con `{ id, name, email }` |

**Escenario: Credenciales inválidas — email no existe**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que no existe un usuario con email `noexiste@test.com` | Que `findUserByEmail("noexiste@test.com")` retorna `undefined` |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `POST /login` con `{ "email": "noexiste@test.com", "password": "cualquiera" }` | Que se responde con código **401 Unauthorized** |
| | Que la respuesta contiene `{ "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" }` |

**Escenario: Credenciales inválidas — contraseña incorrecta**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que existe un usuario con email `ana@test.com` y contraseña hasheada `abc123...` | Que `findUserByEmail("ana@test.com")` retorna el usuario |
| Que la contraseña correcta es `secret123` | Que `verifyPassword("cualquiera", "abc123...")` retorna `false` |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `POST /login` con `{ "email": "ana@test.com", "password": "cualquiera" }` | Que se responde con código **401 Unauthorized** |
| | Que la respuesta contiene `{ "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" }` |

---

### US-011: Autenticación JWT en microservicios

**Escenario: Solicitud con token válido a User Service**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que existe un usuario con id 1 en la base de datos del User Service | Que la base de datos contiene el registro |
| Dado que se obtuvo un token JWT válido del Auth Service | Que `jwtVerify(token, JWT_SECRET)` retorna el payload |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `GET /users` con `Authorization: Bearer <token>` | Que `authMiddleware` ejecuta `validateBearerToken(req)` |
| | Que `validateBearerToken` extrae el token del header `Authorization` |
| | Que `jwtVerify` valida la firma y expiración correctamente |
| | Que el payload decodificado se adjunta a `req.jwtPayload` |
| | Que la solicitud continúa al handler `controller.listUsers()` |
| | Que se responde con código **200 OK** y el arreglo de usuarios |

**Escenario: Solicitud sin token a User Service**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que el endpoint `GET /users` del User Service requiere autenticación | Que `authMiddleware` se ejecuta antes del handler |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `GET /users` sin header `Authorization` | Que `validateBearerToken` detecta la ausencia del header |
| | Que se retorna `new ServiceError("UNAUTHORIZED", "Missing or invalid authorization header", 401)` |
| | Que se responde con código **401 Unauthorized** |
| | Que la respuesta contiene `{ "code": "UNAUTHORIZED", "message": "Missing or invalid authorization header" }` |

**Escenario: Token inválido a Order Service**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que el endpoint `GET /orders` del Order Service requiere autenticación | Que `authMiddleware` se ejecuta antes del handler |
| Dado que se envía un token con firma incorrecta | Que `jwtVerify(token, JWT_SECRET)` lanza una excepción |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `GET /orders` con `Authorization: Bearer token.falso.valor` | Que `validateBearerToken` captura la excepción de `jwtVerify` |
| | Que se retorna `new ServiceError("INVALID_TOKEN", "Invalid or expired token", 401)` |
| | Que se responde con código **401 Unauthorized** |
| | Que la respuesta contiene `{ "code": "INVALID_TOKEN", "message": "Invalid or expired token" }` |

**Escenario: Token expirado a User Service**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que se obtuvo un token JWT del Auth Service | Que el token tiene `exp` configurado a 24 horas |
| Dado que han pasado más de 24 horas desde la emisión del token | Que `jwtVerify` detecta que `exp < now()` |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `GET /users` con `Authorization: Bearer <token_expirado>` | Que `validateBearerToken` captura la excepción de expiración |
| | Que se retorna `new ServiceError("INVALID_TOKEN", "Invalid or expired token", 401)` |
| | Que se responde con código **401 Unauthorized** |

---

### US-004: Crear un pedido (con validación de usuario)

**Escenario: Pedido exitoso**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que existe un usuario con id 1 en el User Service | Que `GET http://localhost:3001/users/1` retorna el usuario |
| Dado que se tiene un token JWT válido | Que `authMiddleware` pasa la validación |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `POST /orders` con `Authorization: Bearer <token>` y `{ "userId": 1, "items": ["laptop", "mouse"], "total": "1200" }` | Que `authMiddleware` valida el token y adjunta `req.jwtPayload` |
| | Que `controller.createOrder(req)` extrae los datos del body |
| | Que `HttpUserClient.findUser(1)` llama `GET /users/1` al User Service |
| | Que el User Service retorna `{ id: 1, name: "Ana", email: "ana@test.com" }` |
| | Que se ejecuta `INSERT orders (user_id=1, items=["laptop","mouse"], total=1200)` |
| | Que se responde con código **201 Created** |
| | Que la respuesta contiene `{ "id": 1, "user_id": 1, "items": ["laptop", "mouse"], "total": 1200 }` |

**Escenario: Usuario no encontrado al crear pedido**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que no existe un usuario con id 999 en el User Service | Que `GET http://localhost:3001/users/999` retorna 404 |
| Dado que se tiene un token JWT válido | Que `authMiddleware` pasa la validación |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `POST /orders` con `Authorization: Bearer <token>` y `{ "userId": 999, "items": ["libro"], "total": "50" }` | Que `HttpUserClient.findUser(999)` llama `GET /users/999` |
| | Que el User Service retorna 404 Not Found |
| | Que `HttpUserClient.findUser` retorna `null` |
| | Que `controller.createOrder` responde con **404 Not Found** |
| | Que no se inserta ningún registro en la tabla `orders` |

**Escenario: User Service caído al crear pedido**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que el User Service no está disponible | Que las conexiones a `http://localhost:3001` fallan |
| Dado que se tiene un token JWT válido | Que `authMiddleware` pasa la validación |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `POST /orders` con `Authorization: Bearer <token>` y `{ "userId": 1, "items": ["libro"], "total": "50" }` | Que `HttpUserClient.findUser(1)` lanza un error de conexión |
| | Que el Order Service propaga el error |
| | Que se responde con **502 Bad Gateway** o **503 Service Unavailable** |

---

### US-012: Verificar token JWT

**Escenario: Token válido verificado**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que se obtuvo un token JWT válido del Auth Service | Que el token tiene firma HS256 válida y no expirado |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `GET /verify` con `Authorization: Bearer <token>` | Que `controller.verify(req)` extrae el token del header |
| | Que `jwtVerify(token, JWT_SECRET)` valida correctamente |
| | Que se responde con código **200 OK** |
| | Que la respuesta contiene `{ "valid": true, "user": { "id": "<sub>", "name": "<name>", "email": "<email>" } }` |

**Escenario: Sin header Authorization**

| Dado (Given) | Entonces (Then) |
|--------------|-----------------|
| Dado que el endpoint `GET /verify` del Auth Service está disponible | Que el handler `controller.verify` se ejecuta |

| Y (When) | Entonces (Then) |
|----------|-----------------|
| Cuando se envía `GET /verify` sin header `Authorization` | Que `req.headers.get('Authorization')` retorna `null` |
| | Que se responde con código **401 Unauthorized** |
| | Que la respuesta contiene `{ "code": "UNAUTHORIZED", "message": "Missing or invalid authorization header" }` |

---

## 3. Interpretación de Descripciones y Algoritmos

### 3.1 Algoritmo de Autenticación (Auth Service)

```
Flujo de login:

  Cliente                    Auth Controller                    auth.model
     │                            │                               │
     │  POST /login               │                               │
     │  { email, password }      │                               │
     │───────────────────────────▶│                               │
     │                            │                               │
     │                            │  findUserByEmail(email)       │
     │                            │──────────────────────────────▶│
     │                            │                               │
     │                            │  ◀── User | undefined ────────│
     │                            │                               │
     │                            │  Si no existe:                │
     │                            │  return 401 INVALID_CREDENTIALS
     │                            │                               │
     │                            │  verifyPassword(password, hash)│
     │                            │──────────────────────────────▶│
     │                            │                               │
     │                            │  ◀── true | false ────────────│
     │                            │                               │
     │                            │  Si no coincide:              │
     │                            │  return 401 INVALID_CREDENTIALS
     │                            │                               │
     │                            │  generateToken(sub, name, email)│
     │                            │  (libs/jwt.ts)                │
     │                            │                               │
     │                            │  1. Crear payload:            │
     │                            │     { sub, name, email,       │
     │                            │       iat: now,              │
     │                            │       exp: now + 86400,      │
     │                            │       iss: "microservicios" } │
     │                            │                               │
     │                            │  2. Signar con HS256:         │
     │                            │     new SignJWT(payload)      │
     │                            │       .setIssuedAt()          │
     │                            │       .setExpirationTime()    │
     │                            │       .setIssuer()            │
     │                            │       .sign(secret)           │
     │                            │                               │
     │                            │  ◀── token JWT ───────────────│
     │                            │                               │
     │  200 OK                    │                               │
     │  { token, user }          │                               │
     │◀───────────────────────────│                               │
```

### 3.2 Algoritmo de Hash de Contraseña (SHA-256)

```
hashPassword(password):

  1. Leer PASSWORD_SALT del entorno (default: "default-salt")
  2. Concatenar: data = password + salt
  3. Calcular: hashBuffer = crypto.subtle.digest('SHA-256', data)
  4. Convertir Uint8Array a string hexadecimal
  5. Retornar string hex

  Ejemplo (solo ilustrativo):
    valor = "input123"
    salt    = "default-salt"
    data    = "input123default-salt"
    hash     = crypto.subtle.digest('SHA-256', data)
               → "a3f2b8c1d4e5..." (64 caracteres hex)
```

### 3.3 Algoritmo de Validación JWT (Middleware)

```
authMiddleware(req):

  1. Obtener header Authorization
  2. Si no existe o no empieza con "Bearer ":
       → return 401 UNAUTHORIZED

  3. Extraer token: token = header.slice(7)

  4. Validar con jose/jwtVerify:
       jwtVerify(token, secret)
       → Verifica firma HS256
       → Verifica expiración (exp > now)
       → Verifica issuer si está configurado

  5. Si la validación falla:
       → return 401 INVALID_TOKEN

  6. Si la validación es exitosa:
       → req.jwtPayload = payload (sub, name, email, iat, exp, iss)
       → return null (proceder al handler)
```

### 3.4 Flujo de Comunicación Inter-Servicios

```
Order Service → User Service (HttpUserClient)

  Order Service                          User Service
       │                                       │
       │  GET /users/:userId                   │
       │  Authorization: Bearer <token>        │
       │──────────────────────────────────────▶│
       │                                       │
       │                              authMiddleware(req)
       │                              validateBearerToken(req)
       │                              jwtVerify(token, secret)
       │                              ◀── payload válido ────│
       │                                       │
       │                              SELECT * FROM users
       │                              WHERE id = $1
       │                                       │
       │                              ◀── { id, name, email }─│
       │                                       │
       │  ◀── { id, name, email }              │
       │                                       │
       │  Si el User Service retorna 404:      │
       │    → HttpUserClient.findUser() retorna null
       │    → Order Service responde 404 Not Found
       │                                       │
       │  Si el User Service retorna 401:      │
       │    → HttpUserClient.findUser() retorna null
       │    → Order Service responde 404 Not Found
       │                                       │
```

### 3.5 Estructura del Token JWT

```
Header (Base64Url):
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload (Base64Url):
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Ana García",
  "email": "ana@test.com",
  "iat": 1718640000,
  "exp": 1718726400,
  "iss": "microservicios"
}

Signature:
HMACSHA256(
  base64Url(header) + "." + base64Url(payload),
  process.env.JWT_SECRET
)

Token final:
base64Url(header).base64Url(payload).signature
```

### 3.6 Estructura de Base de Datos

```
┌──────────────────────────────────────────────────────────────────┐
│                       PostgreSQL                                 │
│                                                                  │
│  ┌──────────────── users ─────────────────┐                     │
│  │ id          SERIAL PRIMARY KEY          │                     │
│  │ name        TEXT NOT NULL               │                     │
│  │ email       TEXT UNIQUE NOT NULL        │                     │
│  │ created_at  TIMESTAMP DEFAULT NOW()     │                     │
│  │ updated_at  TIMESTAMP DEFAULT NOW()     │                     │
│  └─────────────────────────────────────────┘                     │
│                                                                  │
│  ┌──────────────── orders ─────────────────┐                    │
│  │ id          SERIAL PRIMARY KEY          │                    │
│  │ user_id     INTEGER NOT NULL            │                    │
│  │ items       JSONB NOT NULL              │                    │
│  │ total       NUMERIC NOT NULL            │                    │
│  │ created_at  TIMESTAMP DEFAULT NOW()     │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
│  Restricciones:                                                  │
│  - users.email: UNIQUE                                         │
│  - orders.user_id: referencia a users.id                        │
└──────────────────────────────────────────────────────────────────┘
```

### 3.7 Estructura de Clases del Proyecto

```
microservicios/
│
├── contracts/
│   ├── service-error.ts          ──── Clase: ServiceError(code, message, status)
│   ├── user-client.ts            ──── Interfaz: UserClient { findUser(id): Promise<User> }
│   │                               ──── Tipo: User { id, name, email }
│   └── http-user-client.ts       ──── Clase: HttpUserClient implements UserClient
│                                       constructor() → baseUrl = env USER_SERVICE_URL
│                                       findUser(id) → fetch(`${baseUrl}/users/${id}`)
│
├── libs/
│   ├── jwt.ts                    ──── Función: generateToken(sub, name, email)
│   │                               ──── Tipo: JWTToken
│   │                               ──── Función: validateBearerToken(req)
│   │                               ──── Tipo: JWTPayload | ServiceError
│   │                               ──── Función: getJWTPayload(token)
│   │                               ──── Tipo: JWTPayload | null
│   │                               ──── Función: isTokenExpired(token)
│   │                               ──── Tipo: boolean
│   └── response.ts               ──── Función: json(data, status) → Response
│                                       Función: text(message, status) → Response
│                                       Función: error(err: ServiceError) → Response
│
├── services/
│   ├── auth/
│   │   ├── index.ts              ──── Servidor Bun (puerto 3003)
│   │   │                           Rutas: /swagger, /swagger.json, /create-user, /login, /verify
│   │   ├── auth.controller.ts    ──── Clase: AuthController
│   │   │                           createUser(req) → Response | ServiceError
│   │   │                           login(req) → Response | ServiceError
│   │   │                           verify(req) → Response | ServiceError
│   │   ├── auth.model.ts         ──── Tipo: User { id, name, email, password }
│   │   │                           createUser(name, email, password) → User
│   │   │                           findUserByEmail(email) → User | undefined
│   │   │                           findUserById(id) → User | undefined
│   │   │                           emailExists(email) → boolean
│   │   │                           verifyPassword(password, hash) → Promise<boolean>
│   │   │                           hashPassword(password) → Promise<string>
│   │   └── swagger.view.ts       ──── getSwaggerPage() → Response
│   │                               getSwaggerSpec() → Response
│   │
│   ├── user/
│   │   ├── index.ts              ──── Servidor Bun (puerto 3001)
│   │   │                           authMiddleware(req) → Response | null
│   │   │                           Rutas: /swagger, /swagger.json, /users, /users/:id
│   │   ├── user.controller.ts    ──── Clase: UserController
│   │   │                           listUsers() → Response | ServiceError
│   │   │                           getUserById(req) → Response | ServiceError
│   │   │                           createUser(req) → Response | ServiceError
│   │   ├── user.model.ts         ──── Tipo: User { id, name, email, created_at, updated_at }
│   │   │                           listUsers(db) → Promise<User[]>
│   │   │                           getUserById(db, id) → Promise<User | null>
│   │   │                           createUser(db, name, email) → Promise<User>
│   │   └── swagger.view.ts       ──── getSwaggerPage() → Response
│   │                               getSwaggerSpec() → Response
│   │
│   └── order/
│       ├── index.ts              ──── Servidor Bun (puerto 3002)
│       │                           authMiddleware(req) → Response | null
│       │                           Rutas: /swagger, /swagger.json, /orders, /orders/:id
│       ├── order.controller.ts   ──── Clase: OrderController
│       │                           listOrders() → Response | ServiceError
│       │                           getOrderById(req) → Response | ServiceError
│       │                           createOrder(req) → Response | ServiceError
│       ├── order.model.ts        ──── Tipo: Order { id, user_id, items, total, created_at }
│       │                           listOrders(db) → Promise<Order[]>
│       │                           getOrderById(db, id) → Promise<Order | null>
│       │                           createOrder(db, user_id, items, total) → Promise<Order>
│       └── swagger.view.ts       ──── getSwaggerPage() → Response
│                                   getSwaggerSpec() → Response
│
├── docker-compose.yml            ──── 4 servicios: auth, user, order, postgres
├── FEATURES.md                   ──── US-001 a US-012
└── testing-auth.md               ──── Guía de pruebas en español
```

---

## 4. Guía para Presentación del Proyecto

### 4.1 Puntos Clave para Memorizar

#### A. Arquitectura General

> "El proyecto está compuesto por **4 microservicios** separados:
> **Auth Service** (puerto 3003), **User Service** (puerto 3001), **Order Service** (puerto 3002) y **PostgreSQL** como base de datos compartida.
> Todos los servicios están orquestados con **Docker Compose** y se comunican entre sí vía HTTP."

#### B. Flujo de Autenticación

> "El Auth Service es el punto central de autenticación.
>
> 1. El usuario se registra con `POST /create-user` (nombre, email, contraseña).
> 2. La contraseña se hashea con **SHA-256** + salt configurable.
> 3. Al hacer login con `POST /login`, se valida la contraseña y se genera un **token JWT** firmado con **HS256** que expira en **24 horas**.
> 4. El token contiene: `sub` (user id), `name`, `email`, `iat`, `exp`, `iss`."

#### C. Middleware de Autenticación

> "Tanto el User Service como el Order Service tienen un **middleware `authMiddleware`** que protege todos sus endpoints.
> El middleware:
>
> 1. Extrae el header `Authorization: Bearer <token>`.
> 2. Usa la librería **jose** para validar la firma y expiración con `jwtVerify`.
> 3. Si el token es inválido, responde con **401 Unauthorized**.
> 4. Si es válido, adjunta el payload decodificado a la solicitud y permite continuar.
> Todos los servicios comparten la misma `JWT_SECRET` del entorno."

#### D. Comunicación Inter-Servicios

> "El Order Service se comunica con el User Service usando **HttpUserClient**, que implementa la interfaz **UserClient**.
> Al crear un pedido, el Order Service llama `GET /users/:userId` al User Service para validar que el usuario existe.
> Si el usuario no existe, responde con **404 Not Found** sin guardar el pedido.
> Si el User Service no responde, propaga el error como **502/503**."

#### E. Estructura del Proyecto

> "El proyecto sigue una estructura modular:
>
> - **contracts/**: Interfaces y clientes HTTP compartidos (UserClient, ServiceError, HttpUserClient).
> - **libs/**: Utilidades compartidas (jwt.ts para tokens, response.ts para respuestas HTTP).
> - **services/**: Cada microservicio con su propio index.ts, controller, model y swagger.
> - **docker-compose.yml**: Orquesta los 4 servicios con healthchecks y dependencias."

### 4.2 Resumen Técnico

| Aspecto | Detalle |
|---------|---------|
| **Runtime** | Bun (TypeScript) |
| **Autenticación** | JWT (HS256, jose library, 24h expiry) |
| **Hash de contraseñas** | SHA-256 + salt configurable |
| **Base de datos** | PostgreSQL (pg library, connection pools) |
| **Comunicación inter-servicios** | HTTP fetch (HttpUserClient) |
| **Documentación** | Swagger UI en `/swagger` + OpenAPI spec en `/swagger.json` |
| **Despliegue** | Docker Compose (4 contenedores) |
| **Errores** | ServiceError con code, message, status |
| **Respuestas** | libs/response.ts (json, text, error) |

### 4.3 Respuestas a Preguntas Frecuentes

**P: ¿Por qué usar JWT en lugar de sesiones?**
R: "JWT es stateless, lo que permite escalar los microservicios sin compartir estado del servidor. Cada servicio puede validar el token de forma independiente usando la misma secret key."

**P: ¿Dónde se almacenan los usuarios del Auth Service?**
R: "En memoria (array `users: User[]`). Para producción se debería migrar a una tabla en PostgreSQL con bcrypt para hashing de contraseñas."

**P: ¿Cómo se manejan los errores entre servicios?**
R: "Se usa el patrón ServiceError con códigos (UNAUTHORIZED, INVALID_TOKEN, EMAIL_EXISTS, etc.) y la función `response.error()` para serializarlos consistentemente como JSON con status HTTP."

**P: ¿Qué pasa si el User Service está caído?**
R: "El Order Service propaga el error de conexión. `HttpUserClient.findUser()` no captura errores, así que el error se propaga al cliente como 502/503."

**P: ¿Cómo se protege la secret key?**
R: "Se lee de la variable de entorno `JWT_SECRET` en cada servicio. En Docker Compose se configura como `environment` variable. En producción se recomienda usar un gestor de secretos (HashiCorp Vault, AWS Secrets Manager)."
