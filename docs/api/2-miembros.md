# 2 — Miembros

> Formatos transversales (fechas, estructura de errores, auth, enums, paginación) están documentados en `docs/api/00-base.md`. Esta ficha es autocontenida para lo específico del recurso `miembros`.

Ruta base: `/miembros` (`src/main/java/pet_finder/controllers/MiembroController.java:18`).

## A. Entidad

`Miembro` (`src/main/java/pet_finder/models/Miembro.java:8`), tabla `miembros`.

| Campo Java | Tipo | Columna / constraint | Cita |
|---|---|---|---|
| `id` | `Long` | `@Id`, `IDENTITY` | `Miembro.java:10-12` |
| `nombre` | `String` | `NOT NULL`, `length=50` | `Miembro.java:14-15` |
| `apellido` | `String` | `NOT NULL`, `length=50` | `Miembro.java:17-18` |
| `email` | `String` | `NOT NULL`, `UNIQUE` | `Miembro.java:20-21` |
| `contrasenia` | `String` | `NOT NULL`, `length=100` (hash, ver `PasswordEncoder` en el service) | `Miembro.java:23-24` |
| `rolUsuario` | `RolUsuario` (enum) | `@Enumerated(EnumType.STRING)`, `NOT NULL` | `Miembro.java:26-28` |
| `activo` | `boolean` | `NOT NULL` | `Miembro.java:30-31` |

**⚠️ NO DETERMINADO / hallazgo importante**: `Miembro` **no tiene ninguna relación con `Ubicacion`** en el código (no hay campo, `@ManyToOne`/`@OneToOne` ni referencia alguna a `Ubicacion` en `Miembro.java`, ni en `MiembroDetailDTO`, `MiembroRequestDTO` o `MiembroRequestUpdateDTO`). La relación con `Ubicacion` en este codebase pertenece a `Publicacion` (`src/main/java/pet_finder/models/Publicacion.java`), no a `Miembro`. Por lo tanto, ningún DTO de `miembros` serializa ni recibe datos de ubicación — se documenta esto explícitamente porque contradice el enunciado de partida de esta tarea.

Getter de rol: `getRol()`/`setRol()` (no `getRolUsuario()`), `Miembro.java:81-86`.

## B. DTOs

### `MiembroDetailDTO` (response) — record, `src/main/java/pet_finder/dtos/miembro/MiembroDetailDTO.java:5`

```java
record MiembroDetailDTO(Long id, String nombre, String apellido, String email, String rol, boolean activo)
```

| Campo JSON | Tipo | Origen / transformación | Cita |
|---|---|---|---|
| `id` | `Long` | `miembro.getId()` | `MiembroDetailDTO.java:9` |
| `nombre` | `String` | `miembro.getNombre()` | `MiembroDetailDTO.java:10` |
| `apellido` | `String` | `miembro.getApellido()` | `MiembroDetailDTO.java:11` |
| `email` | `String` | `miembro.getEmail()` | `MiembroDetailDTO.java:12` |
| `rol` | `String` | `miembro.getRol().name()` — **excepción al patrón `valorFront`**: `RolUsuario` no tiene `valorFront`, así que viaja como `"MIEMBRO"` o `"ADMINISTRADOR"` (nombre literal de la constante) | `MiembroDetailDTO.java:13` |
| `activo` | `boolean` | `miembro.isActivo()` | `MiembroDetailDTO.java:14` |

Nota: `contrasenia` **nunca** se expone en este DTO (ni hasheada ni en texto plano).

### `MiembroRequestDTO` (request, clase con getters, sin setters) — `src/main/java/pet_finder/dtos/miembro/MiembroRequestDTO.java:7`

Usado en `POST /miembros` y `PUT /miembros/{id}`.

| Campo JSON esperado | Tipo Java | Validación | Cita |
|---|---|---|---|
| `nombre` | `String` | `@NotBlank` ("El nombre es obligatorio") | `MiembroRequestDTO.java:9-10` |
| `apellido` | `String` | `@NotBlank` ("El apellido es obligatorio") | `MiembroRequestDTO.java:12-13` |
| `email` | `String` | `@Email` + `@NotBlank` ("El correo electronico no es válido" / "...es obligatorio") | `MiembroRequestDTO.java:15-17` |
| `contrasenia` | `String` | `@NotBlank` + `@Size(min=6)` ("La contraseña es obligatoria" / "La contraseña debe tener al menos 6 caracteres") | `MiembroRequestDTO.java:19-21` |

No hay campo `rol` en este DTO — el rol se fija siempre en `MIEMBRO` desde el mapper (ver sección C). Validaciones adicionales de formato (regex) se aplican en el service, no acá (ver `MiembroValidation`).

### `MiembroRequestUpdateDTO` (request) — `src/main/java/pet_finder/dtos/miembro/MiembroRequestUpdateDTO.java:5`

Usado en `PUT /miembros/modificar-datos`.

| Campo JSON esperado | Tipo Java | Validación | Cita |
|---|---|---|---|
| `nombre` | `String` | `@NotBlank` ("Este campo es obligatorio") | `MiembroRequestUpdateDTO.java:7-8` |
| `apellido` | `String` | `@NotBlank` ("Este campo es obligatorio") | `MiembroRequestUpdateDTO.java:10-11` |

Solo permite modificar nombre y apellido; no incluye `email` ni `contrasenia`.

## C. Delta entidad ↔ DTO

- `Miembro.contrasenia` **nunca** aparece en `MiembroDetailDTO` — se omite en la respuesta.
- `Miembro.rolUsuario` se expone como `String rol` vía `.name()` (no `valorFront`, `RolUsuario` no lo tiene) — `MiembroDetailDTO.java:13`.
- `MiembroRequestDTO` no trae `rol`: el mapper `MiembroMapper.aEntidad` fuerza `miembro.setRol(RolUsuario.MIEMBRO)` siempre, sin importar el body — no hay forma de crear un `ADMINISTRADOR` vía `POST /miembros` (`src/main/java/pet_finder/mappers/MiembroMapper.java:23`). El único camino para volver a alguien `ADMINISTRADOR` es `PUT /miembros/hacer-administrador/{id}`.
- `MiembroRequestDTO` no trae `activo`: el mapper fuerza `miembro.setActivo(true)` siempre en la creación (`MiembroMapper.java:24`).
- La contraseña recibida en `POST /miembros` se valida contra una regex de formato en el service (ver validaciones abajo) y luego se re-encripta con `PasswordEncoder.encode(...)` antes de guardar — el hash nunca es el string que mandó el cliente (`src/main/java/pet_finder/services/MiembroService.java:50`).
- No hay campo `Ubicacion` en ningún DTO de `miembros` (ver nota en sección A).

## D. Endpoints

Todos bajo `/miembros`. Ninguno está en la lista de rutas públicas de `SecurityConfig` (`00-base.md`), así que todos requieren `Authorization: Bearer <token>` además del `@PreAuthorize` indicado.

---

### `GET /miembros`

- **Controller**: `MiembroController.listar`, `MiembroController.java:28-32`.
- **Seguridad**: `@PreAuthorize("hasRole('ADMINISTRADOR')")` (`MiembroController.java:27`).
- **Path/query params**: ninguno.
- **Request body**: ninguno.
- **Regla de negocio**: `MiembroService.listar()` filtra en memoria y devuelve **solo los miembros con `activo == true`** (`MiembroService.java:56-64`); los dados de baja no aparecen en el listado aunque sigan en la base.
- **Response**: `200 OK`, `List<MiembroDetailDTO>`. Si no hay miembros activos, el controller igual hace `ResponseEntity.ok(...)` con la lista — **siempre 200**, nunca 204 (no hay lógica condicional de status en `listar`, `MiembroController.java:29-32`).
- **Errores**: ninguno propio de negocio (solo 401/403 del filtro de seguridad si falta token o rol).

Ejemplo response:
```json
[
  {
    "id": 1,
    "nombre": "Ana",
    "apellido": "Gómez",
    "email": "ana@example.com",
    "rol": "MIEMBRO",
    "activo": true
  },
  {
    "id": 2,
    "nombre": "Luis",
    "apellido": "Pérez",
    "email": "luis@example.com",
    "rol": "ADMINISTRADOR",
    "activo": true
  }
]
```

---

### `GET /miembros/{id}`

- **Controller**: `MiembroController.obtenerPorId`, `MiembroController.java:35-39`.
- **Seguridad**: `@PreAuthorize("hasRole('ADMINISTRADOR')")` (`MiembroController.java:34`).
- **Path params**: `id` (`Long`).
- **Request body**: ninguno.
- **Regla de negocio**: `MiembroService.obtenerPorId` valida que el miembro exista y que esté activo — si `activo == false`, lanza `MiembroInactivoException` (400) aunque el registro exista (`MiembroService.java:66-74`, `MiembroValidation.esInactivo`, `MiembroValidation.java:68-72`).
- **Response**: `200 OK`, `MiembroDetailDTO`.
- **Errores**:
  - `404 Not Found` (`UsuarioNoEncontradoException` — "No se encontro un miembro con ese ID") si no existe el `id`.
  - `400 Bad Request` (`MiembroInactivoException` — "El miembro es un usuario inactivo.") si el miembro fue dado de baja.

Ejemplo response:
```json
{
  "id": 1,
  "nombre": "Ana",
  "apellido": "Gómez",
  "email": "ana@example.com",
  "rol": "MIEMBRO",
  "activo": true
}
```

---

### `POST /miembros`

- **Controller**: `MiembroController.crear`, `MiembroController.java:42-48`.
- **Seguridad**: `@PreAuthorize("hasRole('ADMINISTRADOR')")` (`MiembroController.java:41`). Es decir, **solo un administrador autenticado puede crear miembros** por esta vía (distinto de `/auth/registro`, que es público — ver recurso 1 en `00-base.md`).
- **Consumes**: `application/json`, `@Valid @RequestBody MiembroRequestDTO`.
- **Regla de negocio / validaciones del service** (`MiembroService.crear`, `MiembroService.java:41-54`, en este orden):
  1. `validarNombre`: regex `^[A-Za-zñÑáéíóúÁÉÍÓÚ ]{3,15}$` sobre `nombre` y `apellido` (sin números, 3 a 15 caracteres) → si falla, `FormatoInvalidoException` (400).
  2. `validarContrasenia`: regex `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,15}$` (mínimo una minúscula, una mayúscula, un número, un carácter especial, 6 a 15 caracteres) → si falla, `FormatoInvalidoException` (400).
  3. `validarEmailRegistrado`: si el email ya existe en la base, `EmailYaRegistradoException` (409).
  4. El rol siempre queda `MIEMBRO` y `activo` siempre `true` (fijado por el mapper, ver sección C) — el body no puede alterar esto.
  5. La contraseña se re-encripta con `passwordEncoder.encode(...)` antes de persistir.
- **Response**: **`201 Created`**, body `MiembroDetailDTO` (`MiembroController.java:47`, `HttpStatus.CREATED`).
- **Errores**:
  - `400 Bad Request` — `MethodArgumentNotValidException` (falla `@Valid` de `MiembroRequestDTO`: nombre/apellido/email/contraseña en blanco, email inválido, contraseña < 6 caracteres).
  - `400 Bad Request` — `FormatoInvalidoException` (regex de nombre/apellido o de contraseña).
  - `409 Conflict` — `EmailYaRegistradoException` (email ya registrado).

Ejemplo request:
```json
{
  "nombre": "Ana",
  "apellido": "Gómez",
  "email": "ana@example.com",
  "contrasenia": "Abc123!@"
}
```

Ejemplo response (`201 Created`):
```json
{
  "id": 5,
  "nombre": "Ana",
  "apellido": "Gómez",
  "email": "ana@example.com",
  "rol": "MIEMBRO",
  "activo": true
}
```

---

### `PUT /miembros/{id}`

> **Nota del código**: el propio controller lo marca como *"Sin uso. Cambiaria el miembro entero, hasta su contraseña y obliga a cambiar todo."* (comentario, `MiembroController.java:50`), y el service repite: *"Por el momento no se usa."* (`MiembroService.java:87-88`). Se documenta igual porque el endpoint existe y está mapeado.

- **Controller**: `MiembroController.modificarPorId`, `MiembroController.java:52-56`.
- **Seguridad**: `@PreAuthorize("hasRole('ADMINISTRADOR')")` (`MiembroController.java:51`).
- **Path params**: `id` (`Long`).
- **Consumes**: `application/json`, `@Valid @RequestBody MiembroRequestDTO` (el mismo DTO que `POST`, incluye `contrasenia` obligatoria).
- **Regla de negocio** (`MiembroService.modificarPorId`, `MiembroService.java:89-105`):
  - Mapea el body a una entidad `Miembro` transitoria (vía `MiembroMapper.aEntidad`, que **no** guarda la contraseña recibida en el miembro a modificar — solo copia `nombre`, `apellido`, `email` al miembro existente; la contraseña del body se descarta, no se reencripta ni se persiste en este flujo).
  - Busca el miembro existente por `id`; si no existe, `UsuarioNoEncontradoException` (404).
  - Sobrescribe `nombre`, `apellido`, `email` del miembro encontrado con los del body.
  - Valida `validarNombre` (misma regex que en `crear`) y `validarEmailUpdates` (chequea que el nuevo email no esté usado por *otro* `id` vía `existsByEmailAndIdNot`).
  - Guarda y devuelve el DTO actualizado.
- **Response**: `200 OK`, `MiembroDetailDTO`.
- **Errores**:
  - `400 Bad Request` — `MethodArgumentNotValidException` (`@Valid` de `MiembroRequestDTO`, incluida la contraseña obligatoria aunque no se use).
  - `404 Not Found` — `UsuarioNoEncontradoException`.
  - `400 Bad Request` — `FormatoInvalidoException` (nombre/apellido inválidos).
  - `409 Conflict` — `EmailYaRegistradoException` (email ya usado por otro miembro).

Ejemplo request (nota: `contrasenia` es obligatoria por `@Valid` aunque el service la ignore):
```json
{
  "nombre": "Ana",
  "apellido": "Gómez López",
  "email": "ana.nueva@example.com",
  "contrasenia": "Abc123!@"
}
```

Ejemplo response:
```json
{
  "id": 1,
  "nombre": "Ana",
  "apellido": "Gómez López",
  "email": "ana.nueva@example.com",
  "rol": "MIEMBRO",
  "activo": true
}
```

---

### `PUT /miembros/modificar-datos`

- **Controller**: `MiembroController.modificar`, `MiembroController.java:59-64`.
- **Seguridad**: `@PreAuthorize("hasAnyRole('ADMINISTRADOR', 'MIEMBRO')")` (`MiembroController.java:58`) — cualquier usuario autenticado, sin importar el rol.
- **Path/query params**: ninguno. El `id` del miembro a modificar **no viaja en la URL ni en el body**: se toma del `@AuthenticationPrincipal MiembroUserDetails userDetails` (del JWT), vía `userDetails.getId()` (`MiembroController.java:60,63`; `MiembroUserDetails.getId()`, `src/main/java/pet_finder/config/MiembroUserDetails.java:25-27`). Esto garantiza que un miembro solo pueda modificar sus propios datos (comentario en el controller: "Se asegura de que el miembro que se va a modificar sea el autenticado por su ID.", `MiembroController.java:62`).
- **Consumes**: `application/json`, `@Valid @RequestBody MiembroRequestUpdateDTO` (solo `nombre`/`apellido`).
- **Regla de negocio** (`MiembroService.modificarDatos`, `MiembroService.java:108-119`): busca el miembro por el `id` del token (404 si no existe), sobrescribe `nombre`/`apellido`, valida formato (misma regex de `validarNombre`), guarda.
- **Response**: `200 OK`, `MiembroDetailDTO`.
- **Errores**:
  - `400 Bad Request` — `MethodArgumentNotValidException` (`nombre`/`apellido` en blanco).
  - `404 Not Found` — `UsuarioNoEncontradoException` (caso borde: el `id` del token no existe en la base).
  - `400 Bad Request` — `FormatoInvalidoException` (regex de nombre/apellido).

Ejemplo request:
```json
{
  "nombre": "Ana",
  "apellido": "Gómez López"
}
```

Ejemplo response:
```json
{
  "id": 1,
  "nombre": "Ana",
  "apellido": "Gómez López",
  "email": "ana@example.com",
  "rol": "MIEMBRO",
  "activo": true
}
```

---

### `PUT /miembros/hacer-administrador/{id}`

- **Controller**: `MiembroController.hacerAdministradorPorId`, `MiembroController.java:68-74`.
- **Seguridad**: `@PreAuthorize("hasRole('ADMINISTRADOR')")` (`MiembroController.java:67`).
- **Path params**: `id` (`Long`).
- **Request body**: ninguno.
- **Regla de negocio** (`MiembroService.hacerAdministrador`, `MiembroService.java:122-133`): busca el miembro por `id` (404 si no existe); valida que **no** sea ya `ADMINISTRADOR` vía `MiembroValidation.esAdministrador` — si ya lo es, `ErrorEnRolException` (409, "El miembro ya es un administrador."); si pasa, setea `rolUsuario = ADMINISTRADOR` y guarda.
- **Response**: **`200 OK`, `ResponseEntity<String>` — texto plano, NO JSON** (confirmado en `MiembroController.java:69,73` y en `00-base.md`). Formato exacto del texto (interpolación Java, `MiembroController.java:73`):
  ```
  El miembro <nombre> <apellido> es ahora administrador en el sistema.
  ```
  (`<nombre>`/`<apellido>` provienen del `MiembroDetailDTO` recién actualizado, es decir del miembro ya como administrador).
- **Errores**:
  - `404 Not Found` — `UsuarioNoEncontradoException`.
  - `409 Conflict` — `ErrorEnRolException` ("El miembro ya es un administrador.").

Ejemplo request: sin body.

Ejemplo response (`200 OK`, `Content-Type` no-JSON — texto plano):
```
El miembro Ana Gómez es ahora administrador en el sistema.
```

---

### `DELETE /miembros/{id}`

- **Controller**: `MiembroController.eliminarPorId`, `MiembroController.java:78-84`.
- **Seguridad**: `@PreAuthorize("hasRole('ADMINISTRADOR')")` (`MiembroController.java:77`). Comentario del código: *"Por ID elimina el administrador (ya que seria el que sabe los IDS de los miembros)"* (`MiembroController.java:76`).
- **Path params**: `id` (`Long`).
- **Request body**: ninguno.
- **Regla de negocio — baja lógica, no física** (`MiembroService.eliminarPorId`, `@Transactional`, `MiembroService.java:136-155`):
  1. Busca el miembro por `id` (404 si no existe).
  2. Valida que esté activo (`esInactivo` — si ya estaba `activo=false`, lanza `MiembroInactivoException`, 400. El nombre del método es engañoso: valida "que no esté inactivo", lanza si `!activo`).
  3. Setea `activo = false` y guarda — **el registro NO se borra de la base**.
  4. Busca todas las publicaciones activas de ese miembro (`publicacionRepository.findByMiembroAndActivoTrue`) y para cada una llama a `publicacionService.eliminar(...)` — es decir, **también da de baja en cascada sus publicaciones** (y transitivamente lo que `PublicacionService.eliminar` dé de baja, p. ej. mascotas/comentarios asociados — ver `docs/api/4-publicaciones.md` para el detalle de esa cascada).
- **Response**: **`200 OK`, `ResponseEntity<String>` — texto plano, NO JSON** (confirmado, `MiembroController.java:79,83`). Formato exacto (`MiembroController.java:83`):
  ```
  Se ha dado de baja con éxito al miembro con ID: <id> y a sus publicaciones asociadas.
  ```
- **Errores**:
  - `404 Not Found` — `UsuarioNoEncontradoException`.
  - `400 Bad Request` — `MiembroInactivoException` (el miembro ya estaba dado de baja).

Ejemplo request: sin body.

Ejemplo response (`200 OK`, texto plano):
```
Se ha dado de baja con éxito al miembro con ID: 7 y a sus publicaciones asociadas.
```

---

## E. Pendientes

- ⚠️ NO DETERMINADO: `Miembro` no tiene relación con `Ubicacion` en el código — el enunciado de esta tarea asumía lo contrario. No hay nada que documentar de `Ubicacion` en este recurso; la relación real vive en `Publicacion` (ver `docs/api/9-ubicacion.md` y `docs/api/4-publicaciones.md`).
- ⚠️ NO DETERMINADO: formato exacto de fecha/hora — no aplica a este recurso, `Miembro`/sus DTOs no tienen campos de fecha.
- ⚠️ NO DETERMINADO: `PUT /miembros/{id}` está marcado "Sin uso" en el código; no hay forma de confirmar desde el repo si algún cliente real lo invoca.
- ⚠️ NO DETERMINADO: contenido exacto del `Content-Type` de las respuestas de texto plano (`text/plain` vs. otro) — no se encontró configuración explícita en `MiembroController`; Spring lo infiere del tipo `ResponseEntity<String>`, pero no hay override de header propio del repo para confirmarlo.
- `MiembroValidation.validarEmailUpdates` y `estaLogeado` existen en la clase de validación pero, según el propio comentario del código (`MiembroValidation.java:54`), `validarEmailUpdates` "no se usa en la aplicación" salvo en `modificarPorId` (el endpoint "Sin uso"); `estaLogeado` no se encontró invocado desde ningún controller/service de `miembros` en los archivos leídos — ⚠️ NO DETERMINADO si se usa en otro recurso fuera del alcance de esta ficha.
