# 4 — Publicaciones

> Ver `docs/api/00-base.md` para: formato de errores, autenticación, formatos transversales y tabla maestra de enums. Este documento es autocontenido para las tablas propias de `publicaciones`.

## A. Entidad

`Publicacion` (`src/main/java/pet_finder/models/Publicacion.java:10`)

| Campo | Tipo Java | Anotaciones / relación | Cita |
|---|---|---|---|
| `id` | `Long` | `@Id`, `@GeneratedValue(strategy = GenerationType.IDENTITY)` | `Publicacion.java:12-14` |
| `descripcion` | `String` | `@Column(columnDefinition = "TEXT")` | `Publicacion.java:16-17` |
| `fecha` | `LocalDate` | Sin `@Column` explícito; se setea a `LocalDate.now()` en el constructor | `Publicacion.java:19`, `:43`, `:52` |
| `mascota` | `Mascota` | `@OneToOne`, `@JoinColumn(name = "mascota_id")` | `Publicacion.java:21-23` |
| `miembro` | `Miembro` | `@ManyToOne`, `@JoinColumn(name = "id_miembro", nullable = false)` | `Publicacion.java:25-27` |
| `ubicacion` | `Ubicacion` | `@OneToOne(fetch = EAGER, cascade = {PERSIST, MERGE})`, `@JoinColumn(name = "ubicacion_id")`. Comentario en el código: el `fetch` permite recibir `Ubicacion` junto con la `Publicacion`, y el `cascade` permite crear o modificar la `Ubicacion` a través de la `Publicacion` | `Publicacion.java:29-33` |
| `activo` | `Boolean` | `@Column(nullable = false)`, `true` por defecto en ambos constructores (baja lógica) | `Publicacion.java:35-36`, `:42`, `:51` |
| `comentarios` | `List<Comentario>` | `@OneToMany(mappedBy = "publicacion")` | `Publicacion.java:38-39` |

No hay campo de auditoría adicional (no hay `fechaModificacion`, `fechaBaja`, etc.) — confirmado por lectura completa del archivo.

## B. DTOs

### `PublicacionRequestDTO` (body de `POST /publicaciones`)

`src/main/java/pet_finder/dtos/publicacion/PublicacionRequestDTO.java:8`

| Campo JSON | Tipo | Validación | Cita |
|---|---|---|---|
| `descripcion` | `String` | `@NotBlank` — "debe ingresar una descripción con información relevante." | `PublicacionRequestDTO.java:10-11` |
| `mascotaId` | `Long` | `@NotNull` — "Debe indicar la mascota." | `PublicacionRequestDTO.java:13-14` |
| `ubicacion` | objeto `UbicacionRequestDTO` (anidado) | `@Valid` (sin `@NotNull` propio a nivel del campo) | `PublicacionRequestDTO.java:16-17` |

### `PublicacionRequestUpdateDTO` (body de `PUT /publicaciones/{id}`)

`src/main/java/pet_finder/dtos/publicacion/PublicacionRequestUpdateDTO.java:8`

| Campo JSON | Tipo | Validación | Cita |
|---|---|---|---|
| `descripcion` | `String` | `@NotBlank` — "La descripcion tiene que tener texto"; `@Size(max = 1500)` — "Máximo 1500 caracteres" | `PublicacionRequestUpdateDTO.java:13-15` |
| `ubicacion` | objeto `UbicacionRequestDTO` (anidado) | `@Valid` | `PublicacionRequestUpdateDTO.java:17-18` |

⚠️ El `@NotBlank` de `descripcion` a nivel de Bean Validation choca con la regla de negocio del service (ver sección D, `PUT /{id}`): el service permite mandar `descripcion` vacía/null siempre que `ubicacion` venga cargada (ambos "vacíos" es lo único que el service rechaza explícitamente, `PublicacionService.java:178-180`). Sin embargo, como `@Valid` corre antes que el service, si `descripcion` viaja como `""` o ausente, `MethodArgumentNotValidException` (400) se dispara igual por el `@NotBlank` — la lógica del service de "al menos un campo" en la práctica sólo aplica si `descripcion` es un string no vacío. ⚠️ NO DETERMINADO por prueba en runtime, sólo por lectura estática de ambas capas.

### `UbicacionRequestDTO` anidado (mini-tabla; detalle completo campo a campo en `docs/api/9-ubicacion.md`)

`src/main/java/pet_finder/dtos/ubicacion/UbicacionRequestDTO.java:8`

| Campo JSON | Tipo | Validación | Cita |
|---|---|---|---|
| `direccion` | `String` | `@NotBlank`, `@Size(max = 100)` | `UbicacionRequestDTO.java:10-12` |
| `altura` | `Integer` | `@Min(0)` (no tiene `@NotNull`, es opcional) | `UbicacionRequestDTO.java:14-15` |
| `latitud` | `Double` | `@NotNull` | `UbicacionRequestDTO.java:17-18` |
| `longitud` | `Double` | `@NotNull` | `UbicacionRequestDTO.java:20-21` |

Además, el service exige que la ubicación sea geocodificable dentro de un rango fijo de coordenadas (ver "Reglas de negocio" en la sección D).

### `PublicacionDetailDTO` (record de respuesta)

`src/main/java/pet_finder/dtos/publicacion/PublicacionDetailDTO.java:12`

Campos del record, en el orden declarado, y de dónde sale cada valor (constructor de transformación, `PublicacionDetailDTO.java:32-56`):

| Campo JSON | Tipo | Origen | Cita |
|---|---|---|---|
| `id` | `Long` | `publicacion.getId()` | `PublicacionDetailDTO.java:38` |
| `activo` | `Boolean` | `publicacion.getActivo()` | `:39` |
| `descripcion` | `String` | `publicacion.getDescripcion()` | `:40` |
| `fecha` | `LocalDate` | `publicacion.getFecha()` | `:41` |
| `idMiembro` | `Long` | `miembro.id()` (del `MiembroDetailDTO` ya mapeado) | `:43` |
| `nombreCompleto` | `String` | `miembro.nombre() + " " + miembro.apellido()` (concatenado en el constructor del record) | `:44` |
| `nombreMascota` | `String` | `mascota.nombre()` | `:46` |
| `tipoMascota` | `String` | `mascota.tipoMascota()` — ya es el `valorFront` del enum `TipoMascota` (viene de `MascotaDetailDTO`, que llama `.getValorFront()`) | `:47`; `MascotaDetailDTO.java:11` |
| `estadoMascota` | `String` | `mascota.estadoMascota()` — `valorFront` del enum `EstadoMascota` | `:48`; `MascotaDetailDTO.java:10` |
| `urlFoto` | `String` | `mascota.urlFoto()` | `:49` |
| `ubicacion` | `String` | `ubicacion.ubicacion()` — string ya compuesto como `direccion + " " + altura` (armado en `UbicacionDetailDTO`, ver mini-tabla abajo) | `:51`; `UbicacionDetailDTO.java:12` |
| `latitud` | `Double` | `ubicacion.latitud()` | `:52` |
| `longitud` | `Double` | `ubicacion.longitud()` | `:53` |
| `comentarios` | `List<ComentarioDetailDTO>` | comentarios de la publicación, **filtrados por `Comentario::getActivo`** antes de mapear (sólo comentarios activos) | `PublicacionMapper.java:56-60` |

Notas importantes sobre este record:
- **No** es un `record` puro con constructor canónico simple: tiene un segundo constructor de transformación (`PublicacionDetailDTO(Publicacion, MiembroDetailDTO, MascotaDetailDTO, UbicacionDetailDTO, List<ComentarioDetailDTO>)`) que es el que arma efectivamente el JSON — cumple la pista del enunciado de que las transformaciones viven en el constructor del record, no en el mapper (`PublicacionDetailDTO.java:32-56`).
- `Mascota` **no** viaja como objeto anidado ni como solo-id: viaja **desagregado en campos planos** con prefijo (`nombreMascota`, `tipoMascota`, `estadoMascota`, `urlFoto`), sin un `id` de mascota expuesto en absoluto en `PublicacionDetailDTO` (no hay campo `mascotaId`/`idMascota` en el record). ⚠️ El `id` de la mascota no es recuperable desde este DTO.
- `Ubicacion` **tampoco** viaja como objeto anidado en `PublicacionDetailDTO`: viaja desagregada en 3 campos planos (`ubicacion` como string ya formateado, `latitud`, `longitud`). Sólo 3 de los 4 campos de `UbicacionDetailDTO` llegan aquí (no hay separación entre `direccion` y `altura`, están concatenados en el string `ubicacion`).
- Si `publicacion.getUbicacion()` es `null`, el mapper pasa `ubicacionDTO = null` (`PublicacionMapper.java:65-67`) y el constructor del record llama `ubicacion.ubicacion()` sobre ese `null` → **`NullPointerException` no capturada por `GlobalHandlerException`** (no está en la tabla de excepciones mapeadas de `00-base.md`), lo que en teoría produciría un 500 con mensaje genérico si alguna vez ocurriera. ⚠️ NO DETERMINADO si este caso es alcanzable en la práctica (la relación es `@JoinColumn(name = "ubicacion_id")` sin `nullable = false`, así que a nivel de esquema no está garantizada la no-nulidad).

### `UbicacionDetailDTO` anidado — mini-tabla (detalle completo en `docs/api/9-ubicacion.md`)

`src/main/java/pet_finder/dtos/ubicacion/UbicacionDetailDTO.java:5`

| Campo del DTO | Cómo llega a `PublicacionDetailDTO` |
|---|---|
| `ubicacion` (= `direccion + " " + altura`) | Directo → campo `ubicacion` |
| `latitud` | Directo → campo `latitud` |
| `longitud` | Directo → campo `longitud` |

## C. Delta entidad ↔ DTO

| Campo de `Publicacion` (entidad) | ¿Aparece en `PublicacionDetailDTO`? | Cómo |
|---|---|---|
| `id` | Sí | igual |
| `descripcion` | Sí | igual |
| `fecha` | Sí | igual |
| `mascota` | Sí, desagregada | `nombreMascota`, `tipoMascota`, `estadoMascota`, `urlFoto` (sin id de mascota) |
| `miembro` | Sí, desagregado | `idMiembro`, `nombreCompleto` (concatenación de nombre+apellido) |
| `ubicacion` | Sí, desagregada | `ubicacion` (string), `latitud`, `longitud` (sin id de ubicación, sin altura/dirección separadas) |
| `activo` | Sí | igual |
| `comentarios` | Sí, filtrados | sólo comentarios con `activo = true`, mapeados a `ComentarioDetailDTO` |

Campos que **no** existen en la entidad `Publicacion` pero sí en el DTO de respuesta: `idMiembro`, `nombreCompleto`, `nombreMascota`, `tipoMascota`, `estadoMascota`, `urlFoto`, `ubicacion` (string), `latitud`, `longitud` — todos derivados de las relaciones `miembro`, `mascota`, `ubicacion` de la entidad.

## D. Endpoints

Ruta base: `/publicaciones` (`PublicacionController.java:20`). Todos los endpoints requieren autenticación (JWT); no hay ninguno público.

---

### 1. `POST /publicaciones`

`PublicacionController.java:29-39`

| Aspecto | Detalle |
|---|---|
| Seguridad | `@PreAuthorize("hasRole('MIEMBRO')")` (`:29`) |
| Consumes | JSON (`@RequestBody PublicacionRequestDTO`), validado con `@Valid` |
| Body | Ver tabla `PublicacionRequestDTO` en sección B |
| Miembro asociado | Se toma del JWT (`@AuthenticationPrincipal MiembroUserDetails`), no del body — el cliente no puede elegir el dueño de la publicación (`:35-37`) |
| Status éxito | **201 Created** (`HttpStatus.CREATED`, `:38`) |
| Response body | `PublicacionDetailDTO` (ver sección B) |
| Reglas de negocio (service, `PublicacionService.guardar`, `:61-79`) | 1) la mascota (`mascotaId`) debe estar activa, si no → `IllegalStateException` (409) "La mascota ya fue dada de baja." (`MascotaValidation.esActivo`, `MascotaValidation.java:25-29`). 2) la mascota no debe estar ya asociada a otra publicación, si no → `IllegalArgumentException` (400) "La mascota se encuentra asociada a otra publicación." (`PublicacionValidation.mascotaYaAsignada`, `PublicacionValidation.java:24-28`). 3) la ubicación debe ser geocodificable dentro de un rango fijo de lat/long (`latMin=-38.15, latMax=-37.90, longMin=-57.70, longMax=-57.50` — zona de Mar del Plata), si no → `UbicacionInvalidaException` (400) (`UbicacionValidation.java:24-34`). 4) el miembro del token debe existir. |
| Errores posibles | 400 (validación `@Valid`, mascota ya asignada, ubicación fuera de rango), 404 (`mascotaId` inexistente, vía `mascotaService.obtenerPorId` en el mapper — `PublicacionMapper.java:45`), 409 (mascota inactiva) |

**Request ejemplo:**
```json
{
  "descripcion": "Perrito perdido en el barrio, collar rojo",
  "mascotaId": 12,
  "ubicacion": {
    "direccion": "Av. Colón",
    "altura": 3456,
    "latitud": -38.0055,
    "longitud": -57.5426
  }
}
```

**Response 201 ejemplo:**
```json
{
  "id": 7,
  "activo": true,
  "descripcion": "Perrito perdido en el barrio, collar rojo",
  "fecha": "2026-07-31",
  "idMiembro": 3,
  "nombreCompleto": "Sofía Cantalupi",
  "nombreMascota": "Rocky",
  "tipoMascota": "perro",
  "estadoMascota": "perdido",
  "urlFoto": "https://ejemplo.com/rocky.jpg",
  "ubicacion": "Av. Colón 3456",
  "latitud": -38.0055,
  "longitud": -57.5426,
  "comentarios": []
}
```

---

### 2. `PUT /publicaciones/{id}`

`PublicacionController.java:41-48`

| Aspecto | Detalle |
|---|---|
| Seguridad | `@PreAuthorize("hasRole('MIEMBRO')")` (`:41`), y el service exige además ser el dueño de la publicación (`miembroValidation.estaLogeado`, `PublicacionService.java:171`) |
| Path param | `id` (`Long`) |
| Consumes | JSON `PublicacionRequestUpdateDTO`, validado con `@Valid` |
| Status éxito | **200 OK** (`ResponseEntity.ok(...)`, `:47`) |
| Response body | `PublicacionDetailDTO` |
| Reglas de negocio (`PublicacionService.modificar`, `:165-199`) | Sólo modifica `descripcion` (si viene no vacía y distinta de la actual) y/o `ubicacion` (si viene y su contenido —`direccion`+`altura`— difiere del actual); si ambos campos vienen "vacíos" (`descripcion` blank/null **y** `ubicacion` null) → `IllegalArgumentException` (400) "Debe proporcionar al menos una descripción o una ubicación para modificar la publicación." (`:178-180`). Si la ubicación cambia, se revalida geocodificación (mismo rango que en creación). No modifica `mascota` ni `activo`. |
| Errores posibles | 400 (validación, ambos campos vacíos, ubicación fuera de rango), 403 (`OperacionNoPermitidaException` si no es el dueño), 404 (publicación inexistente), 400/409 según `esActivo` de la publicación (`IllegalArgumentException`, ver más abajo) |

**Request ejemplo:**
```json
{
  "descripcion": "Perrito perdido, ya con más detalles del collar",
  "ubicacion": {
    "direccion": "Av. Colón",
    "altura": 3500,
    "latitud": -38.0060,
    "longitud": -57.5430
  }
}
```

**Response 200 ejemplo:** misma forma que la de `POST` (sección 1), con los valores actualizados.

---

### 3. `PUT /publicaciones/{id}/estado/{estado}`

`PublicacionController.java:50-57`

| Aspecto | Detalle |
|---|---|
| Seguridad | `@PreAuthorize("hasRole('MIEMBRO')")` (`:50`); además debe ser el dueño de la publicación |
| Path params | `id` (`Long`), `estado` (`String` **sin tipar**, no es un enum de Spring — se convierte manualmente en el service) |
| Literales aceptados para `estado` | El service llama `mascotaValidation.validarYConvertirEstadoMascota(estado)` (`PublicacionService.java:211`), que hace `EstadoMascota.valueOf(estado.toUpperCase())` (`MascotaValidation.java:43-49`). Es decir, hay que mandar el **nombre de la constante Java** (case-insensitive porque se aplica `.toUpperCase()`), NO el `valorFront`: `PERDIDA`, `ENCONTRADA`, `REENCONTRADA`, `EN_ADOPCION`, `ADOPTADA` (o sus variantes en minúscula/mixtas, ya que se normaliza a mayúsculas). Mandar `"perdido"` (el `valorFront`) **falla** con 400 "Estado de mascota inválido." porque no coincide con ningún nombre de constante. |
| Status éxito | **200 OK** (`ResponseEntity.ok(...)`, `:56`) |
| Response body | `PublicacionDetailDTO` (refleja el nuevo `estadoMascota` ya en formato `valorFront`) |
| Reglas de negocio (`PublicacionService.modificarEstado`, `:203-226`) | 1) valida que el nuevo estado sea distinto del actual, si no → `OperacionNoPermitidaException` (403) "La mascota ya posee ese estado." (`MascotaValidation.validarCambioEstado`, `:51-57`). 2) **Efecto secundario sobre solicitudes de adopción**: si el estado actual de la mascota es `EN_ADOPCION` y el nuevo estado es `ENCONTRADA` o `PERDIDA`, se llama `solicitudService.revertirPendientes(publicacionId, MotivoRechazo.AUTO_CAMBIO_ESTADO_MASCOTA)` (`:217-219`), que pasa **todas** las solicitudes de adopción en estado `PENDIENTE` asociadas a la publicación a `RECHAZADA`, seteando `motivoRechazo = AUTO_CAMBIO_ESTADO_MASCOTA` y `fechaResolucion = LocalDateTime.now()` (`SolicitudAdopcionService.java:85-93`). Esto confirma la pista del enunciado: cambiar el estado de la mascota de una publicación (de "en adopción" a "perdida"/"encontrada") auto-rechaza las solicitudes pendientes. 3) el nuevo estado se aplica a la `Mascota` (no a la `Publicacion`). |
| Errores posibles | 400 (`estado` no es un nombre de constante válido — `IllegalArgumentException`), 403 (no dueño, o mismo estado), 404 (publicación inexistente) |

**Request ejemplo:** `PUT /publicaciones/7/estado/ENCONTRADA` (sin body)

**Response 200 ejemplo:**
```json
{
  "id": 7,
  "activo": true,
  "descripcion": "Perrito perdido en el barrio, collar rojo",
  "fecha": "2026-07-31",
  "idMiembro": 3,
  "nombreCompleto": "Sofía Cantalupi",
  "nombreMascota": "Rocky",
  "tipoMascota": "perro",
  "estadoMascota": "encontrado",
  "urlFoto": "https://ejemplo.com/rocky.jpg",
  "ubicacion": "Av. Colón 3456",
  "latitud": -38.0055,
  "longitud": -57.5426,
  "comentarios": []
}
```

---

### 4. `GET /publicaciones/{id}`

`PublicacionController.java:59-64`

| Aspecto | Detalle |
|---|---|
| Seguridad | `@PreAuthorize("hasAnyRole('MIEMBRO', 'ADMINISTRADOR')")` (`:59`) — sin restricción de dueño, cualquier miembro o admin autenticado puede consultar cualquier publicación por id |
| Path param | `id` (`Long`) |
| Status éxito | **200 OK** |
| Response body | `PublicacionDetailDTO` |
| Reglas de negocio (`PublicacionService.obtenerPorId`, `:81-89`) | Valida que exista (404 si no) y que esté activa — si `activo = false` → `IllegalArgumentException` (400) "La publicacion se encuentra inactiva." (`PublicacionValidation.esActivo`, `PublicacionValidation.java:17-21`). Es decir, publicaciones eliminadas (baja lógica) no son recuperables por este endpoint. |
| Errores posibles | 400 (inactiva), 404 (no existe) |

**Response 200 ejemplo:** misma forma que sección 1.

---

### 5. `GET /publicaciones/propias`

`PublicacionController.java:66-76`

| Aspecto | Detalle |
|---|---|
| Seguridad | `@PreAuthorize("hasRole('MIEMBRO')")` (`:66`) |
| Miembro | El del JWT (`@AuthenticationPrincipal`) |
| Status éxito | **200 OK** con lista, o **204 No Content** (sin body) si la lista está vacía (`:71-73`) |
| Response body | `List<PublicacionDetailDTO>` |
| Nota | `publicacionRepository.findByMiembroId` — **no filtra por `activo`** en este endpoint (a diferencia de `listarActivas`), es decir puede incluir publicaciones dadas de baja del propio miembro (`PublicacionService.java:109-111`; comparar con `:103-105`). ⚠️ Confirmar contra intención de negocio si esto es deliberado — no hay comentario en el código que lo aclare. |

**Response 200 ejemplo:**
```json
[
  {
    "id": 7,
    "activo": true,
    "descripcion": "Perrito perdido en el barrio, collar rojo",
    "fecha": "2026-07-31",
    "idMiembro": 3,
    "nombreCompleto": "Sofía Cantalupi",
    "nombreMascota": "Rocky",
    "tipoMascota": "perro",
    "estadoMascota": "perdido",
    "urlFoto": "https://ejemplo.com/rocky.jpg",
    "ubicacion": "Av. Colón 3456",
    "latitud": -38.0055,
    "longitud": -57.5426,
    "comentarios": []
  }
]
```

---

### 6. `GET /publicaciones`

`PublicacionController.java:79-90`

| Aspecto | Detalle |
|---|---|
| Seguridad | `@PreAuthorize("hasAnyRole('MIEMBRO', 'ADMINISTRADOR')")` (`:79`) |
| Status éxito | **200 OK** con lista, o **204 No Content** si vacía |
| Response body | `List<PublicacionDetailDTO>` |
| Filtro aplicado | Sólo publicaciones con `activo = true` (`publicacionRepository.findAllByActivoTrue()`, `PublicacionService.java:104`) |

---

### 7. `GET /publicaciones/tipoMascota/{tipoMascota}`

`PublicacionController.java:93-104`

| Aspecto | Detalle |
|---|---|
| Seguridad | `@PreAuthorize("hasAnyRole('MIEMBRO', 'ADMINISTRADOR')")` (`:93`) |
| Path param | `tipoMascota` (`String` **sin tipar**) |
| Literales aceptados | `mascotaValidation.validarYConvertirTipoMascota(tipoString)` hace `TipoMascota.valueOf(tipoString.toUpperCase())` (`MascotaValidation.java:33-40`). Se debe mandar el **nombre de la constante**: `PERRO` o `GATO` (case-insensitive por el `.toUpperCase()`). Mandar `"perro"` funciona porque se normaliza a mayúsculas, pero mandar el `valorFront` de otro enum no serviría — en este caso puntual coincide en texto pero **no** en general (ver `estadoMascota` abajo, donde el `valorFront` NO coincide con el nombre de constante). |
| Status éxito | **200 OK** con lista, o **204 No Content** si vacía |
| Response body | `List<PublicacionDetailDTO>` |
| Filtro | Publicaciones cuya mascota tiene ese `TipoMascota`, y además `activo = true` (`PublicacionService.filtrarPorTipoMascota`, `:115-128`) |
| Errores | 400 `IllegalArgumentException` "Tipo de mascota inválido." si el string no matchea ningún nombre de constante |

**Ejemplo:** `GET /publicaciones/tipoMascota/PERRO` (o `/perro`, ambos válidos por la normalización a mayúsculas).

---

### 8. `GET /publicaciones/estadoMascota/{estadoMascota}`

`PublicacionController.java:107-119`

| Aspecto | Detalle |
|---|---|
| Seguridad | `@PreAuthorize("hasAnyRole('MIEMBRO', 'ADMINISTRADOR')")` (`:107`) |
| Path param | `estadoMascota` (`String` **sin tipar**) |
| Literales aceptados | Igual mecanismo: `EstadoMascota.valueOf(estadoString.toUpperCase())` (`MascotaValidation.java:43-49`). Hay que mandar el **nombre de la constante**: `PERDIDA`, `ENCONTRADA`, `REENCONTRADA`, `EN_ADOPCION`, `ADOPTADA`. **Ojo**: el comentario del propio controller dice erróneamente que se valida `"perdido"`/`"encontrado"` (`PublicacionController.java:111`, comentario), pero eso es el `valorFront` de respuesta, no lo que acepta el endpoint — `"perdido"` (minúscula, forma `valorFront`) **no** es un nombre de constante válido, así que fallaría con 400. El literal correcto es `"PERDIDA"` (o `"perdida"`, normalizado a mayúsculas). |
| Status éxito | **200 OK** con lista, o **204 No Content** si vacía |
| Response body | `List<PublicacionDetailDTO>` |
| Filtro | Publicaciones cuya mascota tiene ese `EstadoMascota`, y `activo = true` |
| Errores | 400 si el string no matchea ningún nombre de constante |

**Ejemplo:** `GET /publicaciones/estadoMascota/EN_ADOPCION`

---

### 9. `GET /publicaciones/filtro?tipoMascota=...&estadoMascota=...`

`PublicacionController.java:122-135`

| Aspecto | Detalle |
|---|---|
| Seguridad | `@PreAuthorize("hasAnyRole('MIEMBRO', 'ADMINISTRADOR')")` (`:122`) |
| Query params | `tipoMascota` (`String`, requerido, sin `defaultValue`), `estadoMascota` (`String`, requerido) — ambos `@RequestParam String` sin tipar |
| Literales aceptados | Mismos que los endpoints 7 y 8: nombres de constante (`PERRO`/`GATO` para tipo; `PERDIDA`/`ENCONTRADA`/`REENCONTRADA`/`EN_ADOPCION`/`ADOPTADA` para estado), normalizados a mayúsculas internamente |
| Ejemplo documentado en el propio código | `GET http://localhost:8080/publicaciones/filtro?tipoMascota=PERRO&estadoMascota=PERDIDA` (comentario, `PublicacionController.java:121`) |
| Status éxito | **200 OK** con lista, o **204 No Content** si vacía |
| Response body | `List<PublicacionDetailDTO>` |
| Filtro | Intersección de tipo y estado, más `activo = true` (`PublicacionService.filtrarPorTipoYEstado`, `:148-161`) |
| Errores | 400 si cualquiera de los dos strings no matchea un nombre de constante válido |

---

### 10. `DELETE /publicaciones/admin/{id}`

`PublicacionController.java:138-146`

| Aspecto | Detalle |
|---|---|
| Seguridad | `@PreAuthorize("hasRole('ADMINISTRADOR')")` (`:138`) — **sólo admin**, no valida dueño (elimina cualquier publicación) |
| Path param | `id` (`Long`) |
| Status éxito | **200 OK** |
| Response body | **texto plano** (`ResponseEntity<String>`), cuerpo literal `"Publicación eliminada con éxito"` (`:145`), no JSON |
| Reglas de negocio (`PublicacionService.eliminar`, `:230-248`, compartida con el endpoint 11) | 1) Baja lógica de la `Mascota` asociada (`mascotaService.eliminar`). 2) Baja lógica de la `Ubicacion` asociada. 3) Baja lógica de **todos** los comentarios de la publicación. 4) **Efecto secundario sobre solicitudes**: `solicitudService.revertirPendientes(publicacion.getId(), MotivoRechazo.AUTO_POR_PUBLICACION_ELIMINADA)` — todas las solicitudes `PENDIENTE` de esa publicación pasan a `RECHAZADA` con `motivoRechazo = AUTO_POR_PUBLICACION_ELIMINADA` y `fechaResolucion` seteada al momento. Esto confirma la pista: borrar una publicación auto-rechaza sus solicitudes pendientes. 5) Baja lógica de la propia `Publicacion` (`activo = false`) — **no se borra el registro físicamente**. |
| Errores | 404 si `id` no existe (vía `publicacionService.obtenerPorId`, que a su vez usa `PublicacionValidation.existePorId`) |

**Response 200 ejemplo (texto plano, no JSON):**
```
Publicación eliminada con éxito
```

---

### 11. `DELETE /publicaciones/propia/{id}`

`PublicacionController.java:149-157`

| Aspecto | Detalle |
|---|---|
| Seguridad | `@PreAuthorize("hasRole('MIEMBRO')")` (`:149`) + validación de dueño en el service (`miembroValidation.estaLogeado`, `PublicacionService.eliminarPublicacionPropia`, `:251-259`) — si el miembro logueado no es el dueño → `OperacionNoPermitidaException` (403) "No tenes permisos para realizar esta operacion." |
| Path param | `id` (`Long`) |
| Status éxito | **200 OK** |
| Response body | **texto plano**, cuerpo literal `"Publicación eliminada con éxito"` (`:156`), no JSON |
| Reglas de negocio | Delega en el mismo `eliminar(...)` que el endpoint admin (ítem 10) — mismos efectos secundarios (baja de mascota, ubicación, comentarios, auto-rechazo de solicitudes pendientes con `AUTO_POR_PUBLICACION_ELIMINADA`, baja lógica de la publicación) |
| Diferencia clave vs. `/admin/{id}` | El endpoint `/admin/{id}` no valida dueño (cualquier publicación, sólo requiere rol admin); `/propia/{id}` exige rol `MIEMBRO` **y** ser el dueño de la publicación. El efecto de negocio (qué se da de baja y qué se auto-rechaza) es idéntico en ambos — comparten la misma llamada a `PublicacionService.eliminar`. |
| Errores | 403 (no es el dueño), 404 (`id` inexistente) |

**Response 200 ejemplo (texto plano, no JSON):**
```
Publicación eliminada con éxito
```

## E. Pendientes

- ⚠️ NO DETERMINADO: formato exacto de serialización de `fecha` (`LocalDate`) — no hay `@JsonFormat` propio en `PublicacionDetailDTO`, depende de la auto-configuración de `jackson-datatype-jsr310` (ver `00-base.md`, sección Jackson). En los ejemplos de este documento se asumió ISO-8601 (`"2026-07-31"`), que es el default típico de esa librería, pero no está fijado por código propio del repo.
- ⚠️ El comentario del código en `filtrarPorEstadoMascota` (`PublicacionController.java:111`) sugiere que se aceptan los literales `valorFront` (`"perdido"`, `"encontrado"`) como filtro, pero la implementación real (`MascotaValidation.validarYConvertirEstadoMascota`) exige el **nombre de la constante** (`PERDIDA`, `ENCONTRADA`, etc.), no el `valorFront`. Es una discrepancia entre comentario y comportamiento real — documentado explícitamente en la sección D, endpoint 8.
- ⚠️ `GET /publicaciones/propias` no filtra por `activo`, a diferencia de `GET /publicaciones` (que sí filtra `activo = true`) — no hay comentario en el código que confirme si es intencional.
- ⚠️ NO DETERMINADO: qué ocurre en runtime si `Publicacion.ubicacion` es `null` al mapear a `PublicacionDetailDTO` (potencial `NullPointerException` no capturada por `GlobalHandlerException`, ver nota en sección B) — no se encontró ningún caso de prueba ni manejo explícito en el código para ese escenario.
- ⚠️ NO DETERMINADO: contrato exacto de qué pasa si `mascotaId` en `PublicacionRequestDTO` referencia una mascota que ya pertenece a otro miembro (no sólo "otra publicación") — el código sólo valida que la mascota no esté ya asociada a **otra publicación** (`PublicacionValidation.mascotaYaAsignada`), no que sea propiedad del miembro que publica; no se encontró validación de propiedad de la mascota en `guardar()`.
