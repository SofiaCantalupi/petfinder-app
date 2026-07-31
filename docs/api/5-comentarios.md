# 5 — Comentarios

Recurso servido por `pet_finder.controllers.ComentarioController`, montado en la ruta base `/comentarios` (`src/main/java/pet_finder/controllers/ComentarioController.java:16`). Ver `00-base.md` para formato transversal de errores, autenticación y convenciones generales — este documento es autocontenido para las tablas propias del recurso.

## A. Entidad

`Comentario` (`src/main/java/pet_finder/models/Comentario.java:9`), tabla `comentarios`.

| Campo | Tipo Java | Columna / relación | Notas | Cita |
|---|---|---|---|---|
| `id` | `Long` | `@Id`, autogenerado (`IDENTITY`) | — | `Comentario.java:12-14` |
| `texto` | `String` | `@Column(nullable = false)` | — | `Comentario.java:16-17` |
| `fechaPublicacion` | `LocalDate` | `@Column(nullable = false)` | Se setea automáticamente a `LocalDate.now()` en ambos constructores, no la envía el cliente | `Comentario.java:19-20, 35, 41` |
| `activo` | `Boolean` | sin `@Column` explícito | `true` por defecto al construir; se usa como borrado lógico (nunca se hace `delete` físico) | `Comentario.java:22, 34, 39` |
| `publicacion` | `Publicacion` | `@ManyToOne(LAZY)`, `@JoinColumn(name = "id_publicacion", nullable = false)` | Relación con `Publicacion` | `Comentario.java:24-26` |
| `miembro` | `Miembro` | `@ManyToOne(LAZY)`, `@JoinColumn(name = "id_miembro", nullable = false)` | Autor del comentario | `Comentario.java:28-30` |

**Enums:** `Comentario` y sus DTOs **no usan ningún enum**. Se revisaron la entidad, `ComentarioDetailDTO`, `ComentarioRequestDTO`, `ComentarioMapper` y `ComentarioService`: ningún campo tipa contra `TipoMascota`, `EstadoMascota`, `EstadoSolicitud`, `MotivoRechazo`, etc. No aplica ninguna fila de la tabla maestra de enums de `00-base.md` a este recurso.

## B. DTOs

### `ComentarioDetailDTO` (record de respuesta)

`src/main/java/pet_finder/dtos/comentario/ComentarioDetailDTO.java:9`

```java
public record ComentarioDetailDTO (
    Long id,
    String texto,
    LocalDate fechaPublicacion,
    Boolean activo,
    Long idPublicacion,
    Long idMiembro,
    String nombreUsuario,
    String apellidoUsuario
)
```

| Campo JSON | Tipo | Origen |
|---|---|---|
| `id` | `Long` | `comentario.getId()` |
| `texto` | `String` | `comentario.getTexto()` |
| `fechaPublicacion` | `LocalDate` | `comentario.getFechaPublicacion()` |
| `activo` | `Boolean` | `comentario.getActivo()` |
| `idPublicacion` | `Long` | `comentario.getPublicacion().getId()` — **id plano**, no objeto anidado |
| `idMiembro` | `Long` | `comentario.getMiembro().getId()` — **id plano**, no objeto anidado |
| `nombreUsuario` | `String` | `comentario.getMiembro().getNombre()` |
| `apellidoUsuario` | `String` | `comentario.getMiembro().getApellido()` |

Constructor de transformación: `ComentarioDetailDTO(Comentario comentario)` (`ComentarioDetailDTO.java:12-23`), que arma los 8 campos leyendo directamente de la entidad y de sus relaciones `getPublicacion()`/`getMiembro()`. **No hay `@JsonFormat` propio** en el record para `fechaPublicacion`; el formato de salida depende de la auto-configuración de Jackson (ver `00-base.md`, sección Jackson).

`ComentarioMapper.aDetail(Comentario)` (`src/main/java/pet_finder/mappers/ComentarioMapper.java:24-36`) construye el mismo DTO llamando al constructor "canónico" del record (los 8 argumentos posicionales) en vez de al constructor de un solo argumento `ComentarioDetailDTO(Comentario)` — resultado equivalente, distinto camino de código.

### `ComentarioRequestDTO` (clase, no record)

`src/main/java/pet_finder/dtos/comentario/ComentarioRequestDTO.java:7`

| Campo JSON | Tipo | Validación | Cita |
|---|---|---|---|
| `texto` | `String` | `@NotBlank(message = "El comentario tiene que tener texto")`, `@Size(max = 150, message = "Máximo 150 caracteres")` | `ComentarioRequestDTO.java:9-11` |
| `idPublicacion` | `Long` | `@NotNull(message = "Debe estar asociado a una publicacion")` | `ComentarioRequestDTO.java:13-14` |

No tiene setters (sólo getters `getTexto()`/`getIdPublicacion()` y constructor vacío) — deserialización por Jackson vía campos/constructor por defecto. No incluye `idMiembro`: el autor se toma del `@AuthenticationPrincipal` en el controller, nunca del body.

## C. Delta entidad ↔ DTO

| Campo en entidad | ¿En `ComentarioDetailDTO`? | ¿En `ComentarioRequestDTO`? | Notas |
|---|---|---|---|
| `id` | Sí (`id`) | No | Autogenerado, no lo envía el cliente |
| `texto` | Sí (`texto`) | Sí (`texto`) | — |
| `fechaPublicacion` | Sí (`fechaPublicacion`) | No | Fijada por el servidor a `LocalDate.now()`, el cliente no la controla |
| `activo` | Sí (`activo`) | No | Sólo lectura para el cliente; se modifica internamente vía borrado lógico |
| `publicacion` (entidad completa) | Parcial — sólo `idPublicacion` (`Long`) | Parcial — sólo `idPublicacion` (`Long`) en el request | Nunca se serializa el objeto `Publicacion` completo, sólo su id |
| `miembro` (entidad completa) | Parcial — `idMiembro`, `nombreUsuario`, `apellidoUsuario` | No presente (se infiere del JWT) | El resto de los campos de `Miembro` (email, rol, etc.) no se exponen en este DTO |

## D. Endpoints

Orden de aparición en `ComentarioController.java`.

---

### 1. `POST /comentarios` — crear comentario

- **URL final:** `POST /comentarios`
- **Seguridad:** `@PreAuthorize("hasRole('MIEMBRO')")` (`ComentarioController.java:25`)
- **Path/query params:** ninguno
- **Request body** (`consumes` implícito `application/json`, `@Valid @RequestBody ComentarioRequestDTO`): ver tabla B.
- **Autor:** se toma de `@AuthenticationPrincipal MiembroUserDetails userDetails` → `userDetails.getId()` (`ComentarioController.java:27-30`), **no** del body.
- **Response body:** `ComentarioDetailDTO`
- **Status de éxito real:** **201 Created** (`ResponseEntity.status(HttpStatus.CREATED).body(creado)`, `ComentarioController.java:34`)
- **Reglas de negocio percibidas por el cliente** (`ComentarioService.crearComentario`, `src/main/java/pet_finder/services/ComentarioService.java:42-60`):
  - La publicación referenciada por `idPublicacion` debe existir (`publicacionValidation.existePorId`, línea 46) → si no existe: `EntityNotFoundException` → **404**, mensaje `"No existe una publicación con el ID ingresado."` (`PublicacionValidation.java:31-34`).
  - La publicación debe estar activa (`publicacionValidation.esActivo`, línea 47) → si `activo = false`: `IllegalArgumentException` → **400**, mensaje `"La publicacion se encuentra inactiva."` (`PublicacionValidation.java:17-21`).
  - El miembro autenticado (extraído del token) debe existir en base (`miembroValidation.validarExistenciaPorId`, línea 49) → si no: `UsuarioNoEncontradoException` → **404**, mensaje `"No se encontró un usuario con el ID: <id>"` (`MiembroValidation.java:42-45`).
  - El comentario se agrega también a la colección interna de la publicación (`publicacion.agregarComentario(comentario)`, línea 55) y se guarda tanto la publicación como el comentario.
- **Errores por validación `@Valid`:** **400** con mapa `{"texto": "...", "idPublicacion": "..."}` según cuál falle (ver `00-base.md`).
- **Ejemplo request:**
```json
{
  "texto": "¡Qué lindo perrito, espero que lo encuentren pronto!",
  "idPublicacion": 12
}
```
- **Ejemplo response (201):**
```json
{
  "id": 34,
  "texto": "¡Qué lindo perrito, espero que lo encuentren pronto!",
  "fechaPublicacion": "2026-07-31",
  "activo": true,
  "idPublicacion": 12,
  "idMiembro": 7,
  "nombreUsuario": "Sofía",
  "apellidoUsuario": "Cantalupi"
}
```

---

### 2. `GET /comentarios/publicacion/{idPublicacion}` — listar comentarios de una publicación

- **URL final:** `GET /comentarios/publicacion/{idPublicacion}`
- **Seguridad:** `@PreAuthorize("hasAnyRole('ADMINISTRADOR', 'MIEMBRO')")` (`ComentarioController.java:37`)
- **Path params:** `idPublicacion` (`Long`)
- **Query params:** ninguno
- **Request body:** ninguno
- **Response body:** `List<ComentarioDetailDTO>`
- **Status de éxito real:** **200 OK** (`ResponseEntity.ok(dtos)`, `ComentarioController.java:43`)
- **Reglas de negocio** (`ComentarioService.listarPorPublicacion`, `ComentarioService.java:63-70`, invocado desde `listarDetallesPorPublicacion`, líneas 72-75):
  - La publicación debe existir → si no: **404**, `"No existe una publicación con el ID ingresado."`.
  - La publicación debe estar activa → si no: **400**, `"La publicacion se encuentra inactiva."`.
  - Sólo devuelve comentarios con `activo = true` de esa publicación: `comentarioRepository.findByPublicacionIdAndActivoTrue(idPublicacion)` (`ComentarioRepository.java:12`, `ComentarioService.java:69`). Los comentarios borrados (lógicamente) no aparecen en este listado.
  - Si no hay comentarios activos, devuelve **lista vacía `[]`** con status 200 (no hay manejo especial de "vacío" como sí ocurre en `MensajeController`).
- **Ejemplo response (200):**
```json
[
  {
    "id": 34,
    "texto": "¡Qué lindo perrito, espero que lo encuentren pronto!",
    "fechaPublicacion": "2026-07-31",
    "activo": true,
    "idPublicacion": 12,
    "idMiembro": 7,
    "nombreUsuario": "Sofía",
    "apellidoUsuario": "Cantalupi"
  },
  {
    "id": 35,
    "texto": "Yo lo vi cerca de Plaza Italia hoy a la mañana.",
    "fechaPublicacion": "2026-07-31",
    "activo": true,
    "idPublicacion": 12,
    "idMiembro": 9,
    "nombreUsuario": "Juan",
    "apellidoUsuario": "Pérez"
  }
]
```

---

### 3. `DELETE /comentarios/id/{id}` — eliminar comentario (admin)

- **URL final:** `DELETE /comentarios/id/{id}`
- **Seguridad:** `@PreAuthorize("hasRole('ADMINISTRADOR')")` (`ComentarioController.java:46`) — **sólo administradores**, sin importar quién sea el autor del comentario.
- **Path params:** `id` (`Long`, id del comentario)
- **Request body:** ninguno
- **Response body:** **texto plano** (`ResponseEntity<String>`), no JSON estructurado.
- **Status de éxito real:** **200 OK**, cuerpo `"Se elimino correctamente"` (`ComentarioController.java:48-53`)
- **Efecto real:** **borrado lógico**, no físico. `ComentarioService.eliminarComentarioPorId` (`ComentarioService.java:78-87`) hace `comentario.setActivo(false)` y `save`, nunca `delete`.
- **Reglas de negocio:**
  - El comentario debe existir → si no: **404**, `"No se encontro un comentario con esa id"` (`ComentarioValidation.java:17-20`).
  - El comentario no debe estar ya inactivo → si `activo = false`: `IllegalStateException` → **409 Conflict**, `"El comentario ya fue dado de baja."` (`ComentarioValidation.java:22-26`).
- **Ejemplo response (200, `Content-Type: text/plain`):**
```
Se elimino correctamente
```

---

### 4. `DELETE /comentarios/propio/{id}` — eliminar comentario propio

- **URL final:** `DELETE /comentarios/propio/{id}`
- **Seguridad:** `@PreAuthorize("hasRole('MIEMBRO')")` (`ComentarioController.java:55`) — cualquier `MIEMBRO` autenticado, pero **sólo sobre su propio comentario** (validado en el service, no sólo por rol).
- **Path params:** `id` (`Long`, id del comentario)
- **Autor autenticado:** se toma de `@AuthenticationPrincipal MiembroUserDetails miembroUserDetails` → `miembroUserDetails.getId()` (`ComentarioController.java:57-61`)
- **Request body:** ninguno
- **Response body:** **texto plano** (`ResponseEntity<String>`)
- **Status de éxito real:** **200 OK**, cuerpo `"Comentario eliminado correctamente."` (`ComentarioController.java:57-64`) — **nota:** el texto difiere del de borrado admin (termina en punto, redacción distinta).
- **Efecto real:** igual que el borrado admin — **borrado lógico** (`comentario.setActivo(false)`, `ComentarioService.eliminarComentarioPropio`, `ComentarioService.java:89-102`), nunca `delete` físico.
- **Reglas de negocio:**
  - El comentario debe existir → si no: **404**, `"No se encontro un comentario con esa id"`.
  - El comentario no debe estar ya inactivo → si no: **409**, `"El comentario ya fue dado de baja."`.
  - **Verificación de propiedad:** `miembroValidation.estaLogeado(comentario.getMiembro().getId(), idMiembroLogeado)` (`ComentarioService.java:98`) compara el id del autor del comentario contra el id del usuario autenticado. Si no coinciden: `OperacionNoPermitidaException` → **403 Forbidden**, `"No tenes permisos para realizar esta operacion"` (`MiembroValidation.java:76-79`). Esto es lo que diferencia este endpoint del borrado admin: aquí un `MIEMBRO` sólo puede borrar comentarios de los que es autor; un `ADMINISTRADOR` (endpoint anterior) puede borrar cualquiera.
- **Ejemplo response (200, `Content-Type: text/plain`):**
```
Comentario eliminado correctamente.
```

---

### Resumen de status codes por endpoint

| Método | Ruta | Status éxito | Cuerpo éxito |
|---|---|---|---|
| `POST` | `/comentarios` | 201 Created | JSON `ComentarioDetailDTO` |
| `GET` | `/comentarios/publicacion/{idPublicacion}` | 200 OK | JSON `List<ComentarioDetailDTO>` (puede ser `[]`) |
| `DELETE` | `/comentarios/id/{id}` | 200 OK | texto plano `"Se elimino correctamente"` |
| `DELETE` | `/comentarios/propio/{id}` | 200 OK | texto plano `"Comentario eliminado correctamente."` |

## E. Pendientes

- ⚠️ NO DETERMINADO: el formato exacto en que Jackson serializa `LocalDate fechaPublicacion` (p. ej. `"2026-07-31"`) no está fijado por configuración propia del repo — depende de la auto-configuración de `jackson-datatype-jsr310`, igual que se documentó para otros recursos en `00-base.md`.
- No hay endpoint de edición/modificación de comentarios: `ComentarioMapper` tiene un método `modificar(...)` comentado (código muerto, `ComentarioMapper.java:47-51`) y no existe ningún `PUT`/`PATCH` en `ComentarioController`. Confirmado por lectura completa del controller (65 líneas).
- No existe endpoint para obtener un comentario individual por su propio id (`GET /comentarios/{id}`); sólo se puede listar por publicación.
- El campo `activo` viaja en `ComentarioDetailDTO`, pero como el listado (`GET /comentarios/publicacion/{idPublicacion}`) sólo devuelve comentarios activos, el cliente nunca verá `"activo": false` en la práctica a través de los endpoints documentados aquí.
