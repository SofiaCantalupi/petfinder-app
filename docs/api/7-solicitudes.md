# 7 — Solicitudes de adopción

> Formatos transversales (auth, forma de errores, Jackson, paginación, etc.) están documentados en `docs/api/00-base.md`. Este documento es autocontenido para las tablas propias del recurso `solicitudes`.

Controller: `pet_finder.controllers.SolicitudAdopcionController`, ruta base `/solicitudes` (`src/main/java/pet_finder/controllers/SolicitudAdopcionController.java:18`). Todos los endpoints requieren `@PreAuthorize("hasRole('MIEMBRO')")` (`SolicitudAdopcionController.java:26,35,44,53,62`).

## A. Entidad

`pet_finder.models.SolicitudAdopcion`, tabla `solicitudes` (`src/main/java/pet_finder/models/SolicitudAdopcion.java:11-12`).

| Campo Java | Tipo | Notas | Línea |
|---|---|---|---|
| `id` | `Long` | `@GeneratedValue(IDENTITY)` | `SolicitudAdopcion.java:16-17` |
| `fecha` | `LocalDateTime` | Seteado en el constructor a `LocalDateTime.now()` | `SolicitudAdopcion.java:19,57` |
| `estado` | `EstadoSolicitud` (`@Enumerated(STRING)`) | Seteado en el constructor a `EstadoSolicitud.PENDIENTE` | `SolicitudAdopcion.java:21-22,58` |
| `publicacion` | `Publicacion` (`@ManyToOne`, `LAZY`, columna `publicacion_id`, `nullable = false`) | | `SolicitudAdopcion.java:24-26` |
| `miembroSolicitante` | `Miembro` (`@ManyToOne`, `LAZY`, columna `miembro_solicitante_id`, `nullable = false`) | | `SolicitudAdopcion.java:28-30` |
| `celular` | `String` | | `SolicitudAdopcion.java:32` |
| `tipoHogar` | `TipoHogar` (`@Enumerated(STRING)`) | | `SolicitudAdopcion.java:34-35` |
| `hayMascotaEnHogar` | `boolean` | | `SolicitudAdopcion.java:37` |
| `tienePatio` | `boolean` | | `SolicitudAdopcion.java:39` |
| `aceptaCondiciones` | `boolean` | | `SolicitudAdopcion.java:41` |
| `motivoAdopcion` | `String` (`columnDefinition = "TEXT"`) | | `SolicitudAdopcion.java:43-44` |
| `tipoMascotasEnHogar` | `TipoMascotasEnHogar` (`@Enumerated(STRING)`) | | `SolicitudAdopcion.java:46-47` |
| `fechaResolucion` | `LocalDateTime` | Comentario propio del código: `// nullable` | `SolicitudAdopcion.java:49` |
| `comentarioResolucion` | `String` | Comentario propio del código: `// nullable` | `SolicitudAdopcion.java:51` |
| `motivoRechazo` | `MotivoRechazo` (`@Enumerated(STRING)`) | Comentario propio del código: `//nullable` | `SolicitudAdopcion.java:53-54` |

## B. DTOs

### `SolicitudAdopcionRequestDTO` (body de `POST /solicitudes`)

Clase mutable (no record), `src/main/java/pet_finder/dtos/solicitud/SolicitudAdopcionRequestDTO.java:9`.

| Campo JSON | Tipo Java | Validación | Línea |
|---|---|---|---|
| `idPublicacion` | `Long` | sin anotación de validación | `SolicitudAdopcionRequestDTO.java:10` |
| `celular` | `String` | `@NotBlank(message = "Debe ingresar un celular.")` | `:12-13` |
| `tipoHogar` | `TipoHogar` (enum **tipado**, deserializado por nombre de constante: `"CASA"` / `"DEPARTAMENTO"`) | `@NotNull(message = "Debe indicar un tipo de hogar")` | `:15-16` |
| `hayMascotaEnHogar` | `Boolean` | `@NotNull(message = "Debe indicar si hay mascotas en su hogar.")` | `:18-19` |
| `tipoMascotasEnHogar` | `TipoMascotasEnHogar` (enum **tipado**: `"PERRO"` / `"GATO"` / `"PERRO_Y_GATO"`) | sin `@NotNull` directo, pero ver regla cruzada abajo | `:21` |
| `tienePatio` | `Boolean` | `@NotNull(message = "Debe indicar si tiene patio.")` | `:23-24` |
| `aceptaCondiciones` | `boolean` | `@AssertTrue(message = "Debe aceptar las condiciones establecidas para la adopción.")` | `:26-27` |
| `motivoAdopcion` | `String` | sin anotación de validación | `:29` |

**Regla cruzada `isTipoMascotasEnHogarConsistente()`** (`SolicitudAdopcionRequestDTO.java:97-106`), `@AssertTrue`, mensaje: `"El tipo de mascotas en el hogar es inconsistente con si hay mascotas en el hogar."`
- Si `hayMascotaEnHogar` es `null` → la regla devuelve `true` (deja que `@NotNull` de ese campo reporte el error, para evitar doble mensaje).
- Si `hayMascotaEnHogar == false` → válido solo si `tipoMascotasEnHogar == null`.
- Si `hayMascotaEnHogar == true` → válido solo si `tipoMascotasEnHogar != null`.

### `ResolucionSolicitudRequestDTO` (body de `PUT /solicitudes/estado/{id}`)

`src/main/java/pet_finder/dtos/solicitud/ResolucionSolicitudRequestDTO.java:5`.

| Campo JSON | Tipo Java | Validación | Línea |
|---|---|---|---|
| `estado` | **`String` plano** (no `EstadoSolicitud` tipado) | `@NotBlank` | `:6-7` |
| `comentarioResolucion` | `String` | sin anotación | `:9` |

**Confirmado — excepción al patrón general de enums**: `estado` es `String`, no `EstadoSolicitud`. Se convierte manualmente en `SolicitudAdopcionValidation.validarYConvertirResolucion(String)`:
```java
estado = EstadoSolicitud.valueOf(estadoResolucion.toUpperCase());
```
(`src/main/java/pet_finder/validations/SolicitudAdopcionValidation.java:56`)

Esto significa:
- Acepta el **nombre de la constante del enum**, en cualquier combinación de mayúsculas/minúsculas (por el `.toUpperCase()`) — ej. `"APROBADA"`, `"aprobada"`, `"Aprobada"` son todos válidos y equivalentes.
- **No** compara contra `getValorFront()`; sin embargo, para `EstadoSolicitud` el `valorFront` de cada constante coincide textualmente con el nombre en minúsculas (`APROBADA`→`"aprobada"`, `RECHAZADA`→`"rechazada"`, ver `EstadoSolicitud.java:4-7`), por lo que en la práctica enviar el `valorFront` en minúsculas también funciona — pero es una coincidencia de este enum puntual, no el mecanismo real.
- Después de convertir, se valida explícitamente (`SolicitudAdopcionValidation.java:61-63`) que el resultado sea **sólo** `APROBADA` o `RECHAZADA`; cualquier otro valor válido del enum (`PENDIENTE`, `CANCELADA`) o cualquier string que no matchee ninguna constante lanza `IllegalArgumentException` → **400 Bad Request** con mensaje `"Una solucitud de adopción sólo puede ser aceptada o rechazada."` (si no matchea ninguna constante: `"Estado de resolucion invalido."`, `SolicitudAdopcionValidation.java:58`).

El mismo mecanismo (`EstadoSolicitud.valueOf(estado.toUpperCase())`) se usa para el `@RequestParam String estado` de `listarRecibidas`/`listarEnviadas`, vía `validarYConvertirEstadoSolicitud` (`SolicitudAdopcionValidation.java:68-74`) — ahí sí se acepta cualquiera de las 4 constantes (`PENDIENTE`, `RECHAZADA`, `APROBADA`, `CANCELADA`), no sólo dos.

### `SolicitudAdopcionDetailDTO` (response de todos los endpoints)

Record, `src/main/java/pet_finder/dtos/solicitud/SolicitudAdopcionDetailDTO.java:5-29`. Es el DTO más "aplanado" del sistema: combina campos propios de `SolicitudAdopcion` con datos leídos de `Publicacion` → `Mascota` y de `Miembro` (ver sección C para el detalle campo por campo).

| Campo JSON | Tipo serializado | Línea (declaración) |
|---|---|---|
| `id` | `Long` | `:6` |
| `estado` | `String` | `:7` |
| `fecha` | `LocalDateTime` | `:8` |
| `idPublicacion` | `Long` | `:10` |
| `nombreMascota` | `String` | `:11` |
| `estadoMascota` | `String` | `:12` |
| `tipoMascota` | `String` | `:13` |
| `celular` | `String` | `:15` |
| `idMiembroSolicitante` | `Long` | `:16` |
| `nombreCompletoSolicitante` | `String` | `:17` |
| `tipoHogar` | `String` | `:19` |
| `hayMascotaEnHogar` | `boolean` | `:20` |
| `tipoMascotasEnHogar` | `String` (nullable) | `:21` |
| `tienePatio` | `boolean` | `:22` |
| `aceptaCondiciones` | `boolean` | `:23` |
| `motivoAdopcion` | `String` | `:24` |
| `fechaResolucion` | `LocalDateTime` (nullable) | `:26` |
| `comentarioResolucion` | `String` (nullable) | `:27` |
| `motivoRechazo` | `String` (nullable) | `:28` |

**Tabla de enums serializados como `String` vía `getValorFront()` en este DTO:**

| Campo JSON | Enum origen | Valores posibles (`valorFront`) | Cita del `.getValorFront()` |
|---|---|---|---|
| `estado` | `EstadoSolicitud` | `"pendiente"`, `"rechazada"`, `"aprobada"`, `"cancelada"` | `SolicitudAdopcionDetailDTO.java:33` |
| `estadoMascota` | `EstadoMascota` | `"perdido"`, `"encontrado"`, `"reencontrado"`, `"en_adopcion"`, `"adoptado"` | `SolicitudAdopcionDetailDTO.java:38` |
| `tipoMascota` | `TipoMascota` | `"perro"`, `"gato"` | `SolicitudAdopcionDetailDTO.java:39` |
| `tipoHogar` | `TipoHogar` | `"casa"`, `"departamento"` | `SolicitudAdopcionDetailDTO.java:45` |
| `tipoMascotasEnHogar` | `TipoMascotasEnHogar` | `"perro"`, `"gato"`, `"perro_y_gato"`, o `null` si `hayMascotaEnHogar` es `false` | `SolicitudAdopcionDetailDTO.java:47` |
| `motivoRechazo` | `MotivoRechazo` | `"manual"`, `"auto_otra_aprobada"`, `"auto_publicacion_eliminada"`, `"auto_cambio_estado_mascota"`, o `null` si la solicitud nunca fue rechazada | `SolicitudAdopcionDetailDTO.java:54` |

## C. Delta entidad ↔ DTO

Tabla especial: cada campo de `SolicitudAdopcionDetailDTO`, su expresión Java exacta en el constructor y de qué entidad(es) sale (`SolicitudAdopcionDetailDTO.java:30-56`).

| Campo JSON | Expresión Java exacta | Entidad(es) origen | Línea |
|---|---|---|---|
| `id` | `solicitud.getId()` | `SolicitudAdopcion` | `:32` |
| `estado` | `solicitud.getEstado().getValorFront()` | `SolicitudAdopcion.estado` | `:33` |
| `fecha` | `solicitud.getFecha()` | `SolicitudAdopcion` | `:34` |
| `idPublicacion` | `solicitud.getPublicacion().getId()` | `Publicacion` (a través de la relación `SolicitudAdopcion.publicacion`) | `:36` |
| `nombreMascota` | `solicitud.getPublicacion().getMascota().getNombre()` | `Mascota` (a través de `Publicacion.mascota`) | `:37` |
| `estadoMascota` | `solicitud.getPublicacion().getMascota().getEstadoMascota().getValorFront()` | `Mascota.estadoMascota` | `:38` |
| `tipoMascota` | `solicitud.getPublicacion().getMascota().getTipoMascota().getValorFront()` | `Mascota.tipoMascota` | `:39` |
| `celular` | `solicitud.getCelular()` | `SolicitudAdopcion` | `:41` |
| `idMiembroSolicitante` | `solicitud.getMiembroSolicitante().getId()` | `Miembro` (a través de `SolicitudAdopcion.miembroSolicitante`) | `:42` |
| `nombreCompletoSolicitante` | `solicitud.getMiembroSolicitante().getNombre() + " " + solicitud.getMiembroSolicitante().getApellido()` (concatenación con un espacio literal) | `Miembro.nombre` + `Miembro.apellido` | `:43` |
| `tipoHogar` | `solicitud.getTipoHogar().getValorFront()` | `SolicitudAdopcion.tipoHogar` | `:45` |
| `hayMascotaEnHogar` | `solicitud.isHayMascotaEnHogar()` | `SolicitudAdopcion` | `:46` |
| `tipoMascotasEnHogar` | `solicitud.getTipoMascotasEnHogar() != null ? solicitud.getTipoMascotasEnHogar().getValorFront() : null` | `SolicitudAdopcion.tipoMascotasEnHogar` | `:47` |
| `tienePatio` | `solicitud.isTienePatio()` | `SolicitudAdopcion` | `:48` |
| `aceptaCondiciones` | `solicitud.isAceptaCondiciones()` | `SolicitudAdopcion` | `:49` |
| `motivoAdopcion` | `solicitud.getMotivoAdopcion()` | `SolicitudAdopcion` | `:50` |
| `fechaResolucion` | `solicitud.getFechaResolucion()` | `SolicitudAdopcion` | `:52` |
| `comentarioResolucion` | `solicitud.getComentarioResolucion()` | `SolicitudAdopcion` | `:53` |
| `motivoRechazo` | `solicitud.getMotivoRechazo() != null ? solicitud.getMotivoRechazo().getValorFront() : null` | `SolicitudAdopcion.motivoRechazo` | `:54` |

Nota: el constructor accede a `solicitud.getPublicacion()` y `.getMascota()` directamente (sin chequeo de null) — dado que `publicacion` es `nullable = false` en la entidad (`SolicitudAdopcion.java:26`) y toda `Publicacion` tiene una `Mascota` asociada, esto no está expuesto como caso de error documentado en el código; no hay manejo explícito si alguna de esas relaciones fuera `null`.

## D. Endpoints

### `POST /solicitudes` — crear

- **Método/ruta**: `POST /solicitudes` (`SolicitudAdopcionController.java:27`).
- **Seguridad**: `hasRole('MIEMBRO')` (`:26`). El `idMiembroSolicitante` se toma del JWT (`@AuthenticationPrincipal MiembroUserDetails userDetails`, `:28-29`), no del body.
- **Request body** (`application/json`, implícito por `@RequestBody`): `SolicitudAdopcionRequestDTO` (ver sección B).
- **Status de éxito real**: **201 Created** (`ResponseEntity.status(HttpStatus.CREATED)`, `SolicitudAdopcionController.java:32`).
- **Response body**: `SolicitudAdopcionDetailDTO`.
- **Reglas de negocio** (`SolicitudAdopcionService.guardar`, `SolicitudAdopcionService.java:39-58`):
  1. Se busca la `Publicacion` por `idPublicacion` (si no existe → 404, vía `publicacionService.obtenerPorId`).
  2. `validarEstadoMascotaParaAdopcion`: la mascota de la publicación debe tener `estadoMascota == EN_ADOPCION`; si no, **400** `"La mascota de la publicación no está disponible para adopción."` (`SolicitudAdopcionValidation.java:27-31`).
  3. `validarQueNoSeaDuenioPublicacion`: el solicitante no puede ser el dueño de la publicación; si no, **400** `"No podés solicitar la adopción de tu propia mascota publicada."` (`:33-37`).
  4. `validarSinSolicitudBloqueante`: si el miembro ya tiene, para esa misma publicación, una solicitud en estado `PENDIENTE`/`APROBADA`, **o** una `RECHAZADA` con `motivoRechazo == MANUAL`, se rechaza con **400** `"Ya tenés una solicitud de adopción asociada a esta publicación."` (`:41-49`). Nótese que si la solicitud anterior fue rechazada automáticamente (`AUTO_*`), no bloquea un nuevo intento.
  5. La entidad nueva nace con `estado = PENDIENTE` (constructor de `SolicitudAdopcion`, `SolicitudAdopcion.java:58`).
- **Ejemplo request**:
```json
{
  "idPublicacion": 12,
  "celular": "1122334455",
  "tipoHogar": "CASA",
  "hayMascotaEnHogar": true,
  "tipoMascotasEnHogar": "GATO",
  "tienePatio": false,
  "aceptaCondiciones": true,
  "motivoAdopcion": "Quiero darle un hogar."
}
```
- **Ejemplo response (201)**:
```json
{
  "id": 5,
  "estado": "pendiente",
  "fecha": "2026-07-30T14:32:10.123456",
  "idPublicacion": 12,
  "nombreMascota": "Firulais",
  "estadoMascota": "en_adopcion",
  "tipoMascota": "perro",
  "celular": "1122334455",
  "idMiembroSolicitante": 3,
  "nombreCompletoSolicitante": "Sofía Cantalupi",
  "tipoHogar": "casa",
  "hayMascotaEnHogar": true,
  "tipoMascotasEnHogar": "gato",
  "tienePatio": false,
  "aceptaCondiciones": true,
  "motivoAdopcion": "Quiero darle un hogar.",
  "fechaResolucion": null,
  "comentarioResolucion": null,
  "motivoRechazo": null
}
```
⚠️ NO DETERMINADO: el formato exacto de fracción de segundos que produce Jackson para `LocalDateTime` (ver nota en `00-base.md`); el ejemplo usa un formato ISO plausible pero no está fijado por código propio del repo.

### `GET /solicitudes/recibidas` — listarRecibidas

- **Método/ruta**: `GET /solicitudes/recibidas` (`SolicitudAdopcionController.java:36`).
- **Seguridad**: `hasRole('MIEMBRO')` (`:35`).
- **Query params**: `estado` (`String`, opcional — `@RequestParam(required = false)`, `:38`).
- **Semántica**: devuelve las solicitudes recibidas por el miembro autenticado, es decir, las asociadas a publicaciones **de su propiedad** que estén **activas** — `solicitudRepository.findByPublicacion_Miembro_IdAndPublicacion_ActivoTrue(idMiembroDuenio)` (`SolicitudAdopcionService.java:62`).
- **Filtro `estado`**:
  - Si no se manda, o se manda vacío/blank, **no se filtra**: trae todas las solicitudes recibidas sin importar el estado (`SolicitudAdopcionService.java:64-67`, condición `estadoParam != null && !estadoParam.isBlank()`).
  - Si se manda, se convierte con `validarYConvertirEstadoSolicitud` → `EstadoSolicitud.valueOf(estado.toUpperCase())` (`SolicitudAdopcionValidation.java:68-74`). Literal esperado: **nombre de la constante**, case-insensitive — `"PENDIENTE"`, `"RECHAZADA"`, `"APROBADA"` o `"CANCELADA"` (en cualquier capitalización). Un valor que no matchee ninguna constante → **400 Bad Request**, `"Estado de solicitud inválido: <valor>"`.
- **Response body**: `List<SolicitudAdopcionDetailDTO>` (status 200, `ResponseEntity.ok`, `:41`).
- **Ejemplo**: `GET /solicitudes/recibidas?estado=PENDIENTE`
```json
[
  {
    "id": 5,
    "estado": "pendiente",
    "fecha": "2026-07-30T14:32:10.123456",
    "idPublicacion": 12,
    "nombreMascota": "Firulais",
    "estadoMascota": "en_adopcion",
    "tipoMascota": "perro",
    "celular": "1122334455",
    "idMiembroSolicitante": 3,
    "nombreCompletoSolicitante": "Sofía Cantalupi",
    "tipoHogar": "casa",
    "hayMascotaEnHogar": true,
    "tipoMascotasEnHogar": "gato",
    "tienePatio": false,
    "aceptaCondiciones": true,
    "motivoAdopcion": "Quiero darle un hogar.",
    "fechaResolucion": null,
    "comentarioResolucion": null,
    "motivoRechazo": null
  }
]
```

### `GET /solicitudes/enviadas` — listarEnviadas

- **Método/ruta**: `GET /solicitudes/enviadas` (`SolicitudAdopcionController.java:45`).
- **Seguridad**: `hasRole('MIEMBRO')` (`:44`).
- **Query params**: `estado` (`String`, opcional, `:47`) — mismo mecanismo/valores que en `listarRecibidas`.
- **Semántica**: devuelve las solicitudes **enviadas** por el miembro autenticado sobre publicaciones activas — `solicitudRepository.findByMiembroSolicitante_IdAndPublicacion_ActivoTrue(idMiembroSolicitante)` (`SolicitudAdopcionService.java:74`).
- **Response body**: `List<SolicitudAdopcionDetailDTO>` (status 200, `:50`).
- Ejemplo de respuesta: análogo al de `listarRecibidas` (misma forma de ítem).

### `PUT /solicitudes/estado/{id}` — resolver

- **Método/ruta**: `PUT /solicitudes/estado/{id}` (`SolicitudAdopcionController.java:54`). `{id}` = id de la `SolicitudAdopcion`.
- **Seguridad**: `hasRole('MIEMBRO')` (`:53`). Además, en el service, sólo el **dueño de la publicación** asociada a la solicitud puede resolverla (no el rol en general).
- **Request body**: `ResolucionSolicitudRequestDTO` (ver sección B) — `{ "estado": "...", "comentarioResolucion": "..." }`.
- **Response body**: `SolicitudAdopcionDetailDTO`, status **200 OK** (`ResponseEntity.ok`, `:59`).
- **Quién puede resolver / errores** (`SolicitudAdopcionService.resolverSolicitudAdopcion`, `:96-141`):
  1. La solicitud debe existir (si no, **404**, `EntityNotFoundException`, `SolicitudAdopcionValidation.java:22-25`).
  2. Sólo el dueño de la publicación (`solicitud.getPublicacion().getMiembro().getId()`) puede resolver; si no → **403 Forbidden**, `OperacionNoPermitidaException("Solo el dueño de la publicación puede resolver la solicitud de adopción.")` (`:100-102`).
  3. La solicitud debe estar en estado `PENDIENTE`; si no → **400**, `IllegalArgumentException("Esta solicitud ya fue resuelta.")` (`:105-107`).
  4. La mascota de la publicación debe seguir con `estadoMascota == EN_ADOPCION`; si no → **400**, `"La publicación ya no está disponible para adopción."` (`:110-112`).
  5. `estado` del body se convierte con `validarYConvertirResolucion` — sólo acepta (case-insensitive, por nombre de constante) `"APROBADA"` o `"RECHAZADA"`; cualquier otro valor → **400** (ver detalle en sección B).
- **Transiciones de estado válidas**: `PENDIENTE → APROBADA` o `PENDIENTE → RECHAZADA`. No hay transición válida desde `APROBADA`, `RECHAZADA` ni `CANCELADA` (paso 3 arriba lo bloquea con 400).
- **Efectos según el nuevo estado**:
  - Siempre: `fechaResolucion = LocalDateTime.now()` (`:119`); si `comentarioResolucion` viene no-blank en el body, se guarda (`:128-130`).
  - Si `nuevoEstado == RECHAZADA`: `motivoRechazo = MotivoRechazo.MANUAL` (`:123-125`).
  - Si `nuevoEstado == APROBADA`:
    - `motivoRechazo` **no** se toca (queda `null` salvo que ya tuviera uno de antes, lo cual no aplica porque venía de `PENDIENTE`).
    - Se llama a `publicacionService.modificarEstado(idPublicacion, idMiembroLoggeado, "ADOPTADA")` → cambia `Mascota.estadoMascota` a `ADOPTADA` (`:134`).
    - Se llama a `revertirPendientes(idPublicacion, MotivoRechazo.AUTO_POR_OTRA_APROBADA)` (`:135`): **todas las demás solicitudes en `PENDIENTE` de la misma publicación** pasan a `RECHAZADA`, con `motivoRechazo = AUTO_POR_OTRA_APROBADA` y `fechaResolucion = now()` (`SolicitudAdopcionService.java:85-93`). **Confirmado: rechazo automático en cascada de otras solicitudes al aprobar una.**
- **Otras transiciones automáticas a `RECHAZADA` (fuera de este endpoint, mismo mecanismo `revertirPendientes`, sólo afectan solicitudes en `PENDIENTE`)**:
  | Disparador | `motivoRechazo` resultante | Cita |
  |---|---|---|
  | Se aprueba otra solicitud de la misma publicación (`PUT /solicitudes/estado/{id}` con `estado=APROBADA`) | `AUTO_POR_OTRA_APROBADA` | `SolicitudAdopcionService.java:135` |
  | El dueño cambia el estado de la mascota (`PUT /publicaciones/.../estado` — fuera de este recurso) de `EN_ADOPCION` a `ENCONTRADA` o `PERDIDA` | `AUTO_CAMBIO_ESTADO_MASCOTA` | `PublicacionService.java:217-218` |
  | Se elimina la publicación asociada (`DELETE /publicaciones/...` — fuera de este recurso) | `AUTO_POR_PUBLICACION_ELIMINADA` | `PublicacionService.java:243` |
- **Ejemplo request (aprobar)**:
```json
{
  "estado": "APROBADA",
  "comentarioResolucion": "Bienvenida a la familia."
}
```
- **Ejemplo response (200)**:
```json
{
  "id": 5,
  "estado": "aprobada",
  "fecha": "2026-07-28T09:00:00",
  "idPublicacion": 12,
  "nombreMascota": "Firulais",
  "estadoMascota": "adoptado",
  "tipoMascota": "perro",
  "celular": "1122334455",
  "idMiembroSolicitante": 3,
  "nombreCompletoSolicitante": "Sofía Cantalupi",
  "tipoHogar": "casa",
  "hayMascotaEnHogar": true,
  "tipoMascotasEnHogar": "gato",
  "tienePatio": false,
  "aceptaCondiciones": true,
  "motivoAdopcion": "Quiero darle un hogar.",
  "fechaResolucion": "2026-07-30T14:32:10",
  "comentarioResolucion": "Bienvenida a la familia.",
  "motivoRechazo": null
}
```
Nota: `estadoMascota` en el response refleja el estado **actual** de la mascota al momento de serializar (`Mascota.estadoMascota` ya fue cambiado a `ADOPTADA` en el mismo request), por lo que aparece `"adoptado"` aun cuando la validación previa exigía `EN_ADOPCION`.

### `PUT /solicitudes/cancelar/{id}` — cancelarPropia

- **Método/ruta**: `PUT /solicitudes/cancelar/{id}` (`SolicitudAdopcionController.java:63`). `{id}` = id de la `SolicitudAdopcion`.
- **Seguridad**: `hasRole('MIEMBRO')` (`:62`). Además, en el service, sólo el **propio solicitante** (`solicitud.getMiembroSolicitante().getId()`) puede cancelarla — `validarQueSolicitudSeaPropia` (`SolicitudAdopcionValidation.java:76-84`); si no → **400**, `IllegalArgumentException("La solicitud debe ser tuya para cancelarla.")`.
- **Request body**: ninguno.
- **Response body**: `SolicitudAdopcionDetailDTO`, status **200 OK** (`ResponseEntity.ok`, `:67`).
- **Lógica** (`SolicitudAdopcionService.cancelarSolicitudPropia`, `:144-150`):
  - Sólo hace `solicitud.setEstado(EstadoSolicitud.CANCELADA)` (`:147`) y devuelve el DTO. **No** setea `fechaResolucion`, `comentarioResolucion` ni `motivoRechazo` — quedan como estaban (en el caso normal, `null`, porque sólo se puede cancelar algo que nunca fue resuelto formalmente… aunque el código **no valida el estado previo**).
  - ⚠️ Confirmado en el código: a diferencia de `resolver`, este método **no verifica** que `solicitud.getEstado() == PENDIENTE` antes de cancelar. No hay ningún chequeo de estado previo en `cancelarSolicitudPropia` (`SolicitudAdopcionService.java:144-150`) ni en `validarQueSolicitudSeaPropia` (`SolicitudAdopcionValidation.java:76-84`). Es decir, en el código tal cual está, **cualquier estado puede transicionar a `CANCELADA`** (incluso una ya `APROBADA` o `RECHAZADA`), mientras la solicitud sea del miembro autenticado.
  - Tampoco hay `@Transactional`... en realidad sí lo tiene (`@Transactional` en `:143`), pero no llama a `solicitudRepository.save(...)` explícitamente; el `save` ocurre implícitamente por el mecanismo de *dirty checking* de JPA dentro de la transacción (la entidad `solicitud` fue cargada en la misma transacción vía `existePorId`/`findById`).
  - No dispara ningún efecto secundario sobre `Mascota` ni sobre otras solicitudes (no llama a `revertirPendientes` ni a `publicacionService`).
- **Ejemplo request**: sin body (`PUT /solicitudes/cancelar/5`, sin payload).
- **Ejemplo response (200)**:
```json
{
  "id": 5,
  "estado": "cancelada",
  "fecha": "2026-07-28T09:00:00",
  "idPublicacion": 12,
  "nombreMascota": "Firulais",
  "estadoMascota": "en_adopcion",
  "tipoMascota": "perro",
  "celular": "1122334455",
  "idMiembroSolicitante": 3,
  "nombreCompletoSolicitante": "Sofía Cantalupi",
  "tipoHogar": "casa",
  "hayMascotaEnHogar": true,
  "tipoMascotasEnHogar": "gato",
  "tienePatio": false,
  "aceptaCondiciones": true,
  "motivoAdopcion": "Quiero darle un hogar.",
  "fechaResolucion": null,
  "comentarioResolucion": null,
  "motivoRechazo": null
}
```

### Resumen de la máquina de estados (`EstadoSolicitud`)

| Estado inicial | Transición | Estado final | Disparador | `motivoRechazo` asociado |
|---|---|---|---|---|
| `PENDIENTE` | resolución manual, aceptar | `APROBADA` | `PUT /solicitudes/estado/{id}` con `estado="APROBADA"`, por el dueño de la publicación | — (`null`) |
| `PENDIENTE` | resolución manual, rechazar | `RECHAZADA` | `PUT /solicitudes/estado/{id}` con `estado="RECHAZADA"`, por el dueño de la publicación | `MANUAL` |
| `PENDIENTE` | rechazo automático en cascada | `RECHAZADA` | otra solicitud de la misma publicación pasa a `APROBADA` | `AUTO_POR_OTRA_APROBADA` |
| `PENDIENTE` | rechazo automático | `RECHAZADA` | el dueño cambia el estado de la mascota fuera de `EN_ADOPCION` (`ENCONTRADA`/`PERDIDA`) | `AUTO_CAMBIO_ESTADO_MASCOTA` |
| `PENDIENTE` | rechazo automático | `RECHAZADA` | se elimina la publicación asociada | `AUTO_POR_PUBLICACION_ELIMINADA` |
| cualquiera | cancelación | `CANCELADA` | `PUT /solicitudes/cancelar/{id}`, por el propio solicitante — **sin chequeo de estado previo en el código** | no se toca |

Transiciones explícitamente bloqueadas por código: `resolver` sobre una solicitud que no está en `PENDIENTE` → **400** `"Esta solicitud ya fue resuelta."` (`SolicitudAdopcionService.java:105-107`).

## E. Pendientes

- ⚠️ NO DETERMINADO: el formato exacto (con o sin fracción de segundos, cantidad de dígitos) que produce Jackson para los campos `LocalDateTime` (`fecha`, `fechaResolucion`) de `SolicitudAdopcionDetailDTO`, ya que no hay `@JsonFormat` propio en el DTO ni configuración global de Jackson en el repo (mismo hallazgo que en `00-base.md`).
- ⚠️ NO DETERMINADO: no se pudo confirmar por código si `PUT /solicitudes/cancelar/{id}` es intencionalmente permisivo respecto al estado previo (podría ser un bug no cubierto por tests) — se documenta el comportamiento tal como está implementado, sin inferir intención.
- ⚠️ NO DETERMINADO: comportamiento si `idPublicacion` en `SolicitudAdopcionRequestDTO` es `null` — no tiene `@NotNull` propio en el DTO; el primer punto de falla sería `publicacionService.obtenerPorId(null)`, cuyo comportamiento exacto no fue relevado en este documento (no se leyó `PublicacionService.obtenerPorId`).
