# Testing — Autenticación con Token entre Microservicios

## Flujo de prueba paso a paso

### 1. Levantar los servicios

```bash
docker compose up --build
```

### 2. Crear un usuario en el Auth Service

```bash
curl -X POST http://localhost:3003/create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@test.com","password":"secret123"}'
```

**Respuesta esperada (201 Created):**

```json
{ "id": "...", "name": "Ana", "email": "ana@test.com" }
```

### 3. Iniciar sesión para obtener un token

```bash
curl -s -X POST http://localhost:3003/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@test.com","password":"secret123"}'
```

**Respuesta esperada (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "name": "Ana", "email": "ana@test.com" }
}
```

### 4. Usar el token para crear un usuario protegido (User Service)

```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Carlos","email":"carlos@test.com"}'
```

**Respuesta esperada (201 Created):**

```json
{ "id": 1, "name": "Carlos", "email": "carlos@test.com" }
```

### 5. Intentar sin token → debe ser rechazado

```bash
curl -X POST http://localhost:3001/users \
  -d '{"name":"SinToken","email":"sin@test.com"}'
```

**Respuesta esperada (401 Unauthorized):**

```json
{ "code": "UNAUTHORIZED", "message": "Missing or invalid authorization header" }
```

### 6. Intentar con token inválido → debe ser rechazado

```bash
curl -X POST http://localhost:3001/users \
  -H "Authorization: Bearer invalid.token.here" \
  -d '{"name":"Bad","email":"bad@test.com"}'
```

**Respuesta esperada (401 Unauthorized):**

```json
{ "code": "INVALID_TOKEN", "message": "Invalid or expired token" }
```

### 7. Crear un pedido protegido (Order Service)

```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"userId":"1","items":["laptop","mouse"],"total":1200}'
```

**Respuesta esperada (201 Created):**

```json
{ "id": 1, "user_id": 1, "items": ["laptop", "mouse"], "total": 1200 }
```

### 8. Listar pedidos protegido (con token)

```bash
curl http://localhost:3002/orders \
  -H "Authorization: Bearer <token>"
```

**Respuesta esperada (200 OK):**

```json
[ { "id": 1, "user_id": 1, "items": ["laptop", "mouse"], "total": 1200 } ]
```

---

## Resumen de comportamiento

| Escenario | Servicio | Resultado |
|-----------|----------|-----------|
| Sin `Authorization` header | User / Order | **401 Unauthorized** |
| Token inválido o expirado | User / Order | **401 Unauthorized** |
| Token válido | User / Order | **200/201** (operación normal) |
| Login con credenciales correctas | Auth | **200 OK** con token |
| Login con credenciales incorrectas | Auth | **401 Unauthorized** |
| Email ya registrado | Auth | **400 Bad Request** |

## Swagger UI

Cada servicio expone documentación interactiva:

- Auth Service: `http://localhost:3003/swagger`
- User Service: `http://localhost:3001/swagger`
- Order Service: `http://localhost:3002/swagger`
