# 3 — Mascotas

> Convenciones transversales (auth, forma de errores, Jackson, paginación, etc.) están descriptas en `docs/api/00-base.md`. Esta ficha es autocontenida para todo lo específico del recurso Mascota.

## A. Entidad

`pet_finder.models.Mascota` (`src/main/java/pet_finder/models/Mascota.java:9`), tabla `mascotas` (`Mascota.java:8`).

| Campo | Tipo Java | Columna / constraints | Cita |
|---|---|---|---|
| `id` | `Long` | `@Id @GeneratedValue(IDENTITY)` | `Mascota.java:11-12` |
| `nombre` | `String` | `@Column(length = 50)`, nullable por defecto | `Mascota.java:14-15` |
| `estadoMascota` | `EstadoMascota` (enum) | `@Column(nullable = false)`, `@Enumerated(EnumType.STRING)` | `Mascota.java:17-19` |
| `tipoMascota` | `TipoMascota` (enum) | `@Column(nullable = false)`, `@Enumerated(EnumType.STRING)` | `Mascota.java:21-23` |
| `esActivo` | `Boolean` | `@Column(nullable = false)`; el constructor vacío lo inicializa en `true` | `Mascota.java:25-26,34-36` |
| `miembroId` | `Long` | `@Column(nullable = false)` — **no es una relación JPA** (`@ManyToOne`/`@JoinColumn`), es un `Long` plano, FK "manual" al miembro dueño | `Mascota.java:28-29` |
| `urlFoto` | `String` | sin `@Column`, nullable | `Mascota.java:31` |

## B. DTOs

### `MascotaDetailDTO` (response) — `src/main/java/pet_finder/dtos/mascota/MascotaDetailDTO.java:5`

`record` con transformación en el propio constructor (no en el mapper):

```java
public record MascotaDetailDTO(Long id, String nombre, String estadoMascota, String tipoMascota, Boolean activo, String urlFoto)
```

| Campo JSON | Tipo JSON | Origen / transformación | Cita |
|---|---|---|---|
| `id` | number | `mascota.getId()` directo | `MascotaDetailDTO.java:8` |
| `nombre` | string \| null | `mascota.getNombre()` directo | `MascotaDetailDTO.java:9` |
| `estadoMascota` | string | **transformado**: `mascota.getEstadoMascota().getValorFront()` — NO es `.name()`, es el `valorFront` en minúscula (p. ej. `"perdido"`, no `"PERDIDA"`) | `MascotaDetailDTO.java:10` |
| `tipoMascota` | string | **transformado**: `mascota.getTipoMascota().getValorFront()` (p. ej. `"perro"`, no `"PERRO"`) | `MascotaDetailDTO.java:11` |
| `activo` | boolean | ⚠️ el nombre del campo Java/JSON es **`activo`**, no `esActivo`; viene de `mascota.getEsActivo()` | `MascotaDetailDTO.java:5,12` |
| `urlFoto` | string \| null | `mascota.getUrlFoto()` directo | `MascotaDetailDTO.java:13` |

**`miembroId` no aparece en `MascotaDetailDTO`** — el FK plano de la entidad no se expone en ninguna respuesta de este recurso (confirmado leyendo los 6 campos del record, ninguno es `miembroId`).

### `MascotaRequestDTO` (request de `POST /mascotas`) — `src/main/java/pet_finder/dtos/mascota/MascotaRequestDTO.java:8`

| Campo JSON | Tipo Java | Validación Bean Validation | Cita |
|---|---|---|---|
| `nombre` | `String` | sin anotación (opcional) | `MascotaRequestDTO.java:9` |
| `estadoMascota` | `EstadoMascota` (enum tipado — el cliente manda el **nombre de la constante**, ej. `"PERDIDA"`) | `@NotNull("El campo \"Estado de la mascota\" es obligatorio.")` | `MascotaRequestDTO.java:11-12` |
| `tipoMascota` | `TipoMascota` (enum tipado, ej. `"PERRO"`) | `@NotNull("El campo \"Tipo de mascota\" es obligatorio.")` | `MascotaRequestDTO.java:14-15` |
| `urlFoto` | `String` | `@URL("La foto debe ser una URL válida")` (opcional, pero si viene debe ser URL válida) | `MascotaRequestDTO.java:17-18` |

No tiene campo `miembroId` ni `esActivo`: ambos los fija el backend (ver sección D/service).

### `MascotaRequestUpdateDTO` (request de `PUT /mascotas/{id}`) — `src/main/java/pet_finder/dtos/mascota/MascotaRequestUpdateDTO.java:7`

Comentario explícito en el código: *"Los campos son opcionales, con el objetivo de modificar solo los atributos necesarios"* (`MascotaRequestUpdateDTO.java:9`).

| Campo JSON | Tipo Java | Validación | Cita |
|---|---|---|---|
| `nombre` | `String` | ninguna | `MascotaRequestUpdateDTO.java:10` |
| `estadoMascota` | `EstadoMascota` (enum tipado, nombre de constante) | ninguna (sin `@NotNull`) | `MascotaRequestUpdateDTO.java:11` |
| `tipoMascota` | `TipoMascota` (enum tipado, nombre de constante) | ninguna | `MascotaRequestUpdateDTO.java:12` |
| `urlFoto` | `String` | `@URL("Debe ingresar una URL válida.")` | `MascotaRequestUpdateDTO.java:14-15` |

Regla de negocio no cubierta por Bean Validation: si los 4 campos vienen `null`, `MascotaService.modificar` lanza `IllegalArgumentException("Debe proporcionar al menos un campo para modificar.")` → 400 (`MascotaService.java:79-84`, mapeado en `GlobalHandlerException.java:106-110`).

## C. Delta entidad ↔ DTO

| Campo entidad | ¿En `MascotaDetailDTO`? | ¿En `MascotaRequestDTO`? | ¿En `MascotaRequestUpdateDTO`? | Nota |
|---|---|---|---|---|
| `id` | Sí (`id`) | No | No (va en el path `{id}`) | — |
| `nombre` | Sí (`nombre`) | Sí (`nombre`, opcional) | Sí (`nombre`, opcional) | — |
| `estadoMascota` | Sí, como `String` (`estadoMascota` = `valorFront`) | Sí, como enum tipado (`estadoMascota`, obligatorio) | Sí, como enum tipado (`estadoMascota`, opcional) | Enum request≠response (ver checklist) |
| `tipoMascota` | Sí, como `String` (`tipoMascota` = `valorFront`) | Sí, como enum tipado (`tipoMascota`, obligatorio) | Sí, como enum tipado (`tipoMascota`, opcional) | Enum request≠response |
| `esActivo` | Sí, pero **renombrado a `activo`** | No (siempre `true` al crear, fijado en el mapper) | No (no modificable vía `PUT`; sólo cambia vía `DELETE`, a `false`) | Ver `MascotaMapper.java:25`, `MascotaService.java:66` |
| `miembroId` | **No** (no viaja en el DTO de detalle) | No (se toma del JWT autenticado, no del body) | No (no se puede reasignar dueño) | `MascotaController.java:39`, `MascotaService.java:52` |
| `urlFoto` | Sí (`urlFoto`) | Sí (`urlFoto`, opcional, validado `@URL`) | Sí (`urlFoto`, opcional, validado `@URL`) | — |

## D. Endpoints

Todos los endpoints están en `pet_finder.controllers.MascotaController`, ruta base `/mascotas` (`MascotaController.java:18`), y **todos** requieren `@PreAuthorize("hasRole('MIEMBRO')")` (`MascotaController.java:27,34,44,54,63`) — no hay ningún endpoint accesible sólo por `ADMINISTRADOR` ni público en este recurso.

Orden real en el archivo: `GET /mascotas/id/{id}`, `POST /mascotas`, `PUT /mascotas/{id}`, `DELETE /mascotas/{id}`, `GET /mascotas` (5 endpoints en total, no hay más — confirmado leyendo el archivo completo de 76 líneas).

---

### 1. `GET /mascotas/id/{id}`

- **Método/URL**: `GET /mascotas/id/{id}` (`MascotaController.java:28`)
- **Path params**: `id` (`Long`)
- **Query params**: ninguno
- **Request body**: ninguno
- **Seguridad**: `@PreAuthorize("hasRole('MIEMBRO')")` (`MascotaController.java:27`)
- **Lógica de servicio**: `service.obtenerDetallePorId(id)` → internamente `obtenerPorId` valida que exista (`EntityNotFoundException` si no) y que `esActivo == true` (si `false`, `IllegalStateException`) (`MascotaService.java:35-44`, `MascotaValidation.java:20-29`).
- **Status éxito**: `200 OK` con `MascotaDetailDTO` (`MascotaController.java:31`, `ResponseEntity.ok(...)`)
- **Errores posibles**:
  | Caso | Excepción | Status |
  |---|---|---|
  | No existe una mascota con ese `id` | `EntityNotFoundException` | 404 |
  | La mascota existe pero `esActivo == false` (dada de baja) | `IllegalStateException("La mascota ya fue dada de baja.")` | 409 |

**Ejemplo response (200)**:
```json
{
  "id": 12,
  "nombre": "Firulais",
  "estadoMascota": "perdido",
  "tipoMascota": "perro",
  "activo": true,
  "urlFoto": "https://ejemplo.com/foto.jpg"
}
```

---

### 2. `POST /mascotas`

- **Método/URL**: `POST /mascotas` (`MascotaController.java:35`)
- **Path/query params**: ninguno
- **Request body**: `MascotaRequestDTO`, `@Valid` (`MascotaController.java:36`), `consumes` no declarado explícitamente ⚠️ NO DETERMINADO más allá del default de Spring (`application/json`)
- **Autenticación usada por el negocio**: el `miembroId` dueño de la mascota se toma de `@AuthenticationPrincipal MiembroUserDetails userDetails` (el usuario logueado por JWT), **no** del body (`MascotaController.java:37,39`)
- **Seguridad**: `@PreAuthorize("hasRole('MIEMBRO')")` (`MascotaController.java:34`)
- **Regla de negocio no visible en el DTO**: `MascotaService.guardar` fuerza `esActivo = true` siempre al crear, vía `MascotaMapper.aEntidad` (`MascotaMapper.java:25`, comentario: *"La Mascota siempre es creada con Activo = true"*)
- **Status éxito real**: `200 OK` (⚠️ **no** es 201 — el controller usa `ResponseEntity.ok(...)` sin `HttpStatus.CREATED`, `MascotaController.java:41`)
- **Response body**: `MascotaDetailDTO`
- **Errores posibles**:
  | Caso | Excepción | Status |
  |---|---|---|
  | `estadoMascota` o `tipoMascota` ausentes, o `urlFoto` no es URL válida | `MethodArgumentNotValidException` (`@Valid`) | 400 |
  | `estadoMascota`/`tipoMascota` con un valor de texto que no matchea ninguna constante del enum | Error de deserialización de Jackson (`HttpMessageNotReadableException`) — ⚠️ NO DETERMINADO si `GlobalHandlerException` lo intercepta explícitamente (no está en la tabla de excepciones de `00-base.md`); probablemente cae en el handler genérico `Exception` → 500, a confirmar en runtime | ⚠️ NO DETERMINADO |

**Ejemplo request**:
```json
{
  "nombre": "Firulais",
  "estadoMascota": "PERDIDA",
  "tipoMascota": "PERRO",
  "urlFoto": "https://ejemplo.com/foto.jpg"
}
```

**Ejemplo response (200)**:
```json
{
  "id": 12,
  "nombre": "Firulais",
  "estadoMascota": "perdido",
  "tipoMascota": "perro",
  "activo": true,
  "urlFoto": "https://ejemplo.com/foto.jpg"
}
```

---

### 3. `PUT /mascotas/{id}`

- **Método/URL**: `PUT /mascotas/{id}` (`MascotaController.java:45`)
- **Path params**: `id` (`Long`)
- **Request body**: `MascotaRequestUpdateDTO`, `@Valid` (`MascotaController.java:46`) — todos los campos opcionales
- **Seguridad**: `@PreAuthorize("hasRole('MIEMBRO')")` (`MascotaController.java:44`) **+** validación de negocio: sólo el dueño (`miembroId` de la mascota == id del usuario logueado) puede modificar (`MiembroValidation.estaLogeado`, `MascotaService.java:76`)
- **Lógica de servicio** (`MascotaService.modificar`, `MascotaService.java:71-105`):
  1. Valida que la mascota exista y esté activa (mismo camino que `obtenerPorId`).
  2. Valida propiedad: si `existente.getMiembroId() != userDetails.getId()`, lanza `OperacionNoPermitidaException`.
  3. Valida que al menos un campo del body no sea `null`, si no, `IllegalArgumentException`.
  4. Actualiza sólo los campos no-`null` (actualización parcial campo a campo, no reemplazo total).
- **Status éxito**: `200 OK` con `MascotaDetailDTO` actualizado (`MascotaController.java:51`)
- **Errores posibles**:
  | Caso | Excepción | Status |
  |---|---|---|
  | No existe la mascota | `EntityNotFoundException` | 404 |
  | Mascota dada de baja (`esActivo == false`) | `IllegalStateException` | 409 |
  | El usuario logueado no es el dueño de la mascota | `OperacionNoPermitidaException` | 403 |
  | Body con los 4 campos `null` | `IllegalArgumentException` | 400 |
  | `urlFoto` inválida | `MethodArgumentNotValidException` | 400 |

**Ejemplo request** (actualización parcial, sólo estado):
```json
{
  "estadoMascota": "ENCONTRADA"
}
```

**Ejemplo response (200)**:
```json
{
  "id": 12,
  "nombre": "Firulais",
  "estadoMascota": "encontrado",
  "tipoMascota": "perro",
  "activo": true,
  "urlFoto": "https://ejemplo.com/foto.jpg"
}
```

---

### 4. `DELETE /mascotas/{id}`

- **Método/URL**: `DELETE /mascotas/{id}` (`MascotaController.java:55`)
- **Path params**: `id` (`Long`)
- **Request body**: ninguno
- **Seguridad**: `@PreAuthorize("hasRole('MIEMBRO')")` (`MascotaController.java:54`)
- **Confirmado — baja lógica**: `service.eliminar(id)` no borra el registro; valida existencia y que `esActivo == true`, y luego setea `esActivo = false` y hace `save` (`MascotaService.java:58-69`, comentario en el controller: *"baja logica, no se elimina el registro"*, `MascotaController.java:58`).
- **Status éxito**: `204 No Content`, **sin body** (`ResponseEntity.noContent().build()`, `MascotaController.java:60`, tipo de retorno `ResponseEntity<Void>`)
- **Errores posibles**:
  | Caso | Excepción | Status |
  |---|---|---|
  | No existe la mascota | `EntityNotFoundException` | 404 |
  | Ya estaba dada de baja (`esActivo == false`) | `IllegalStateException("La mascota ya fue dada de baja.")` | 409 |

⚠️ Nota: a diferencia de otros recursos del inventario (`00-base.md`), este `DELETE` **no** devuelve texto plano ni requiere confirmación de dueño explícita en el código leído — no hay chequeo de `miembroId` en `eliminar()` (`MascotaService.java:58-69`), cualquier `MIEMBRO` autenticado puede dar de baja cualquier mascota activa. ⚠️ NO DETERMINADO si esto es intencional o un descuido, sólo se documenta lo que el código hace.

**Ejemplo request**: sin body.
**Ejemplo response**: `204 No Content`, sin body.

---

### 5. `GET /mascotas`

- **Método/URL**: `GET /mascotas` (`MascotaController.java:64`)
- **Path/query params**: ninguno
- **Request body**: ninguno
- **Seguridad**: `@PreAuthorize("hasRole('MIEMBRO')")` (`MascotaController.java:63`)
- **Lógica de servicio**: `service.listar()` usa `mascotaRepository.findAllByEsActivoTrue()` — **sólo** devuelve mascotas con `esActivo == true`, sin filtrar por dueño (trae las de todos los miembros) (`MascotaService.java:108-110`, `MascotaRepository.java:11`)
- **Status éxito confirmado**:
  - Si la lista **no está vacía**: `200 OK` con `List<MascotaDetailDTO>` (`MascotaController.java:72`)
  - Si la lista **está vacía**: `204 No Content`, **sin body** (`MascotaController.java:69-71`) — ⚠️ no es `200` con `[]`
- **Errores posibles**: no hay excepciones de negocio en este endpoint (no valida nada más allá de la sesión/rol).

**Ejemplo response (200, con datos)**:
```json
[
  {
    "id": 12,
    "nombre": "Firulais",
    "estadoMascota": "perdido",
    "tipoMascota": "perro",
    "activo": true,
    "urlFoto": "https://ejemplo.com/foto.jpg"
  },
  {
    "id": 13,
    "nombre": null,
    "estadoMascota": "en_adopcion",
    "tipoMascota": "gato",
    "activo": true,
    "urlFoto": null
  }
]
```

**Ejemplo response (lista vacía)**: `204 No Content`, sin body.

---

## E. Pendientes

- ⚠️ NO DETERMINADO: el status/formato exacto cuando el cliente envía un valor de `estadoMascota`/`tipoMascota` que no matchea ninguna constante del enum en `POST`/`PUT` (falla de deserialización de Jackson antes de llegar al `@Valid`); no está en la tabla de excepciones mapeadas de `GlobalHandlerException` documentada en `00-base.md`.
- ⚠️ NO DETERMINADO: `consumes`/`Content-Type` exacto exigido en `POST /mascotas` y `PUT /mascotas/{id}` — no está declarado explícitamente en las anotaciones del controller (se asume `application/json` por default de Spring, no confirmado por código propio).
- Confirmado como hallazgo relevante: `DELETE /mascotas/{id}` **no** valida que el solicitante sea el dueño de la mascota (a diferencia de `PUT`, que sí llama `miembroValidation.estaLogeado`). Cualquier `MIEMBRO` autenticado puede dar de baja cualquier mascota ajena activa.
- `MascotaValidation.validarCambioEstado(Mascota, EstadoMascota)` (`MascotaValidation.java:51-57`) existe pero **no se usa en ningún endpoint de `MascotaController`** — sólo lo invoca `PublicacionService.java:215`, fuera del alcance de este recurso; se menciona para no confundirlo con lógica expuesta acá.
- `MascotaMapper` implementa la interfaz genérica `Mapper<MascotaRequestDTO, MascotaDetailDTO, Mascota>` — no tiene método propio para `MascotaRequestUpdateDTO` (la actualización parcial se resuelve a mano en `MascotaService.modificar`, no vía mapper).
