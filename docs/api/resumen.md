# Resumen — Documentación del API pet-finder

> Documento de cierre que consolida los 10 documentos de `docs/api/`. No reemplaza a ninguno de ellos: cada afirmación remite al documento fuente donde está la cita exacta al código.

## Índice de recursos

| # | Recurso | Documento | Ruta base | Controller |
|---|---|---|---|---|
| — | Base / transversal | [`00-base.md`](./00-base.md) | *(no aplica)* | *(no aplica)* |
| 1 | Autenticación | [`1-auth.md`](./1-auth.md) | `/auth` | `pet_finder.config.AuthController` |
| 2 | Miembros | [`2-miembros.md`](./2-miembros.md) | `/miembros` | `pet_finder.controllers.MiembroController` |
| 3 | Mascotas | [`3-mascotas.md`](./3-mascotas.md) | `/mascotas` | `pet_finder.controllers.MascotaController` |
| 4 | Publicaciones | [`4-publicaciones.md`](./4-publicaciones.md) | `/publicaciones` | `pet_finder.controllers.PublicacionController` |
| 5 | Comentarios | [`5-comentarios.md`](./5-comentarios.md) | `/comentarios` | `pet_finder.controllers.ComentarioController` |
| 6 | Mensajes | [`6-mensajes.md`](./6-mensajes.md) | `/mensajes` | `pet_finder.controllers.MensajeController` |
| 7 | Solicitudes de adopción | [`7-solicitudes.md`](./7-solicitudes.md) | `/solicitudes` | `pet_finder.controllers.SolicitudAdopcionController` |
| 8 | Normas de comunidad | [`8-normas.md`](./8-normas.md) | `/normas` | `pet_finder.controllers.NormaComunidadController` |
| 9 | Ubicación | [`9-ubicacion.md`](./9-ubicacion.md) | *(sin controller propio, anidado en Publicación)* | *(ninguno)* |
| — | Notificaciones | *(sin ficha propia — documentado en `00-base.md`)* | *(sin controller propio, stub)* | *(ninguno)* |

## Dependencias entre recursos

| Origen | Destino | Tipo de relación (modelo) | Cómo viaja en el DTO de respuesta | Fuente |
|---|---|---|---|---|
| `Publicacion` | `Mascota` | `@OneToOne` | **Desagregada** en campos planos con prefijo (`nombreMascota`, `tipoMascota`, `estadoMascota`, `urlFoto`); no expone `id` de la mascota | `4-publicaciones.md` |
| `Publicacion` | `Ubicacion` | `@OneToOne(EAGER, cascade PERSIST/MERGE)` | En `PublicacionDetailDTO`: **desagregada** en 3 campos planos (`ubicacion` string, `latitud`, `longitud`). En `PublicacionRequestDTO`/`RequestUpdateDTO`: **objeto anidado completo** (`ubicacion: {...}`) | `4-publicaciones.md`, `9-ubicacion.md` |
| `Publicacion` | `Miembro` | `@ManyToOne` (dueño) | **Desagregada**: `idMiembro` + `nombreCompleto` (concatenado) | `4-publicaciones.md` |
| `Mascota` | `Miembro` | `Long miembroId` — **no es relación JPA** (FK manual, sin `@ManyToOne`) | No se expone en `MascotaDetailDTO` (ningún campo `miembroId`) | `3-mascotas.md` |
| `Comentario` | `Publicacion` | `@ManyToOne` | **Id plano**: `idPublicacion` | `5-comentarios.md` |
| `Comentario` | `Miembro` | `@ManyToOne` (autor) | **Id + campos planos**: `idMiembro`, `nombreUsuario`, `apellidoUsuario` | `5-comentarios.md` |
| `Mensaje` | `Miembro` (emisor) | `@ManyToOne` | **Id + campo plano**: `idEmisor`, `nombreEmisor` | `6-mensajes.md` |
| `Mensaje` | `Miembro` (receptor) | `@ManyToOne` | **Id + campo plano**: `idReceptor`, `nombreReceptor` | `6-mensajes.md` |
| `Mensaje` | `Publicacion` | **No existe.** Confirmado por lectura completa de la entidad y DTOs: los mensajes son 1 a 1 entre miembros, sin asociación a publicación/mascota | — | `6-mensajes.md` |
| `SolicitudAdopcion` | `Publicacion` → `Mascota` | `@ManyToOne` a `Publicacion`, que a su vez tiene `Mascota` | **Desagregada** (indirecta, 2 niveles): `idPublicacion`, `nombreMascota`, `tipoMascota`, `estadoMascota` | `7-solicitudes.md` |
| `SolicitudAdopcion` | `Miembro` (solicitante) | `@ManyToOne` | **Desagregada**: `idMiembroSolicitante`, `nombreCompletoSolicitante` (concatenado) | `7-solicitudes.md` |
| `Miembro` | `Ubicacion` | **No existe.** Confirmado por búsqueda exhaustiva en `Miembro.java`, `MiembroDetailDTO`, `MiembroRequestDTO`, `MiembroRequestUpdateDTO` y `RegistroRequestDTO` — contradice el enunciado de partida de la documentación | — | `2-miembros.md`, `9-ubicacion.md`, `1-auth.md` |
| `NormaComunidad` | *(ninguno)* | Entidad aislada, sólo `id` + `texto`, sin relaciones | No aplica | `8-normas.md` |
| `Notificacion` / `TipoNotificacion` | *(ninguno funcional)* | Enum y `NotificacionService` stub, sin `@Service`, sin controller, no referenciado desde ningún DTO ni endpoint | No aplica | `00-base.md` |
| `Ubicacion` | *(ninguno)* | Sólo es referenciada, no referencia a otros recursos. Sin controller propio; `UbicacionService` sólo se usa internamente desde `PublicacionService` | No aplica | `9-ubicacion.md` |

**Nota de modelado inconsistente**: `Mascota→Miembro` es la única relación "dueño" del sistema resuelta con un `Long` plano sin `@ManyToOne`, mientras que `Publicacion→Miembro`, `Comentario→Miembro`, `Mensaje→Miembro` y `SolicitudAdopcion→Miembro` sí son relaciones JPA reales.

## Inconsistencias internas del API

### 1. Ubicación de controllers en el código

| Inconsistencia | Detalle | Fuente |
|---|---|---|
| `AuthController` vive en el paquete `config`, no en `controllers` | Único controller fuera de `pet_finder.controllers`; el resto (Miembro, Mascota, Publicacion, Comentario, Mensaje, SolicitudAdopcion, NormaComunidad) sí vive en `pet_finder.controllers` | `00-base.md`, `1-auth.md` |

### 2. Status code de creación (`POST .../crear`) inconsistente entre recursos

| Recurso / endpoint | Status real | Fuente |
|---|---|---|
| `POST /mascotas` | **200 OK** (`ResponseEntity.ok`, no `HttpStatus.CREATED`) — **outlier** | `3-mascotas.md` |
| `POST /miembros` | 201 Created | `2-miembros.md` |
| `POST /auth/registro` | 201 Created | `1-auth.md` |
| `POST /publicaciones` | 201 Created | `4-publicaciones.md` |
| `POST /comentarios` | 201 Created | `5-comentarios.md` |
| `POST /mensajes` | 201 Created | `6-mensajes.md` |
| `POST /solicitudes` | 201 Created | `7-solicitudes.md` |
| `POST /normas` | 201 Created | `8-normas.md` |

`Mascota` es el único recurso cuyo alta no devuelve 201 pese a crear un registro nuevo.

### 3. Listas vacías: tres comportamientos distintos conviven

| Patrón | Recursos / endpoints | Fuente |
|---|---|---|
| **204 No Content, sin body** | `GET /mascotas` (lista vacía); `GET /publicaciones`, `/publicaciones/propias` y los 3 filtros (`tipoMascota`, `estadoMascota`, `filtro`); `GET /normas` | `3-mascotas.md`, `4-publicaciones.md`, `8-normas.md` |
| **200 OK con `[]`** | `GET /miembros` (siempre 200, nunca 204, incluso sin miembros activos); `GET /comentarios/publicacion/{id}` (siempre 200, sin manejo especial de vacío); `GET /solicitudes/recibidas`, `/solicitudes/enviadas` (sin manejo especial documentado, se infiere 200 con `[]`) | `2-miembros.md`, `5-comentarios.md`, `7-solicitudes.md` |
| **200 OK con texto plano en vez de `[]`** | `GET /mensajes/conversacion/{idMiembro}` → `"No hay mensajes en esta conversación."`; `GET /mensajes/conversaciones` → `"No tenés conversaciones aún."` | `6-mensajes.md`, `00-base.md` |

### 4. Falta de validación de propiedad

| Endpoint | Problema | Fuente |
|---|---|---|
| `DELETE /mascotas/{id}` | No valida que el `MIEMBRO` autenticado sea el dueño de la mascota (a diferencia de `PUT /mascotas/{id}`, que sí llama `miembroValidation.estaLogeado`). Cualquier `MIEMBRO` autenticado puede dar de baja mascotas ajenas activas | `3-mascotas.md` |
| `POST /publicaciones` | No valida que la `Mascota` referenciada por `mascotaId` pertenezca al miembro que publica; sólo valida que no esté ya asociada a **otra publicación** | `4-publicaciones.md` |

### 5. Otras inconsistencias detectadas al comparar documentos

| Inconsistencia | Detalle | Fuente |
|---|---|---|
| `GET /publicaciones/propias` no filtra por `activo` | A diferencia de `GET /publicaciones`, que sí filtra `activo=true`; puede devolver publicaciones dadas de baja del propio miembro | `4-publicaciones.md` |
| `PUT /solicitudes/cancelar/{id}` no valida el estado previo | A diferencia de `resolver` (que exige `PENDIENTE`), `cancelarSolicitudPropia` permite cancelar una solicitud en **cualquier** estado (incluso `APROBADA`/`RECHAZADA`), mientras sea del solicitante | `7-solicitudes.md` |
| `ComentarioMapper.aDetail` usa el constructor canónico (8 argumentos) en vez del constructor de transformación de 1 argumento `ComentarioDetailDTO(Comentario)` | Redundancia de código, mismo resultado, dos caminos | `5-comentarios.md` |

## Pendientes consolidados

### Transversal (`00-base.md`)

- No existe configuración propia de Jackson (`ObjectMapper` bean, naming strategy, `@JsonInclude` global); el único `@JsonFormat` explícito del repo es el de `ErrorResponse.timestamp`.
- Formato exacto de serialización de `LocalDate`/`LocalDateTime` en el resto de los DTOs (sin `@JsonFormat` propio) depende de la auto-configuración de `jackson-datatype-jsr310`, no fijado por código propio.
- Formato exacto de las respuestas 401 (token ausente/inválido) y 403 (`@PreAuthorize` rechazado) de Spring Security: no hay `AuthenticationEntryPoint`/`AccessDeniedHandler` propios.

### Auth (`1-auth.md`)

- No verificado en runtime: si los campos sin setter (`RegistroRequestDTO.apellido`/`.contrasenia`, `CambiarContraseniaDTO.*`) se deserializan correctamente.
- Formato exacto de 401/403 para `PUT /auth/cambiar-contrasenia`.
- Expiración del JWT hardcodeada en 1 hora; no hay endpoint de refresh token.
- El valor real de `jwt.secret` (env var `JWT_SECRET`) depende del entorno, no está en el repo.

### Miembros (`2-miembros.md`)

- `PUT /miembros/{id}` está marcado "Sin uso" en comentarios del código; no se puede confirmar desde el repo si algún cliente lo invoca.
- `Content-Type` exacto (`text/plain` u otro) de las respuestas de texto plano de este recurso, no confirmado por override explícito.
- Uso real de `MiembroValidation.validarEmailUpdates`/`estaLogeado` fuera del recurso `miembros`, no determinado.

### Mascotas (`3-mascotas.md`)

- Status/formato exacto cuando `estadoMascota`/`tipoMascota` no matchea ninguna constante del enum en `POST`/`PUT` (falla de deserialización de Jackson, no está en la tabla de excepciones de `GlobalHandlerException`).
- `Content-Type`/`consumes` exacto exigido en `POST /mascotas` y `PUT /mascotas/{id}`, no declarado explícitamente en el controller.

### Publicaciones (`4-publicaciones.md`)

- Formato exacto de serialización de `fecha` (`LocalDate`) en `PublicacionDetailDTO`.
- Comportamiento real en runtime si `Publicacion.ubicacion` es `null` al mapear (potencial NPE no capturada).
- Contrato exacto si `mascotaId` referencia una mascota que pertenece a otro miembro (no sólo "ya asociada a otra publicación") — no se encontró validación de propiedad en `guardar()`.

### Comentarios (`5-comentarios.md`)

- Formato exacto de serialización de `LocalDate fechaPublicacion`.

### Mensajes (`6-mensajes.md`)

- Formato exacto de serialización de `LocalDateTime fechaEnvio`.
- `Content-Type` HTTP exacto de las respuestas de texto plano (`"No hay mensajes..."` / `"No tenés conversaciones..."`).
- Orden de los elementos en `GET /mensajes/conversaciones`: no hay `ORDER BY` ni `.sorted()` en el código.

### Solicitudes de adopción (`7-solicitudes.md`)

- Formato exacto (fracción de segundos) de `LocalDateTime` en `fecha`/`fechaResolucion`.
- No se pudo confirmar si el comportamiento permisivo de `PUT /solicitudes/cancelar/{id}` (sin validar estado previo) es intencional o un bug no cubierto por tests.
- Comportamiento si `idPublicacion` es `null` en `SolicitudAdopcionRequestDTO` (no tiene `@NotNull` propio; no se relevó `publicacionService.obtenerPorId(null)`).

### Normas de comunidad (`8-normas.md`)

- Formato exacto de 401/403 de Spring Security para este recurso (remite al pendiente transversal).
- No hay endpoint para editar/eliminar/consultar puntualmente una norma — a confirmar si es una limitación deliberada o falta de alcance.
- No hay control de duplicados de `texto` (ni a nivel de columna ni de service).

### Ubicación (`9-ubicacion.md`)

- Nullabilidad/longitud reales a nivel de columna SQL de `direccion`, `altura`, `latitud`, `longitud` (sin `@Column` en la entidad, depende del DDL real no versionado).
- Comportamiento cuando `altura` es `null`: la concatenación produce el literal `"...null"` en `UbicacionDetailDTO.ubicacion`; no hay evidencia de que sea manejado intencionalmente.
- No existe ningún endpoint HTTP que exponga los métodos de `UbicacionService` (`listarTodas`, `obtenerPorId`, `obtenerPorIdPublicacion`).
