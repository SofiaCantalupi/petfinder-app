# 00 — Base del API

## Prefijo y puerto

- El proyecto es Spring Boot 3.5.0 sobre Java 21 (`pom.xml:8`, `pom.xml:30`).
- No hay dependencia de `springdoc`, `lombok` ni `mapstruct` en `pom.xml` (bloque de dependencias `pom.xml:32-81`). Los DTOs y mappers están escritos a mano.
- `src/main/resources/application.properties` no define `server.servlet.context-path` ni `server.port` (archivo completo, `application.properties:1-15`). Esto implica que no hay prefijo de API (las rutas de los controllers son la raíz, p. ej. `/auth`, `/miembros`) y que el puerto es el default de Spring Boot (8080), ya que no hay ninguna propiedad que lo modifique.
- Base de datos: MySQL vía `spring.datasource.url=jdbc:mysql://localhost:3306/petFinder_db` (`application.properties:3`).

## Configuración de Jackson

- ⚠️ NO DETERMINADO: no existe ninguna clase de configuración de Jackson (`ObjectMapper` bean, `Jackson2ObjectMapperBuilderCustomizer`, etc.) ni propiedades `spring.jackson.*` en `application.properties` (verificado con búsqueda en todo `src/main/java/pet_finder` y en el archivo de propiedades — el único hallazgo es el `@JsonFormat` puntual descripto abajo). No hay naming strategy global ni `@JsonInclude` global configurados en el código.
- El único formateo de fechas explícito encontrado es en `ErrorResponse`: el campo `timestamp` usa `@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")` (`src/main/java/pet_finder/exceptions/model/ErrorResponse.java:9`), lo que serializa por ejemplo como `"2026-07-30T14:32:10"`.
- El resto de las fechas (`LocalDate`/`LocalDateTime` en los DTOs de detalle, p. ej. `SolicitudAdopcionDetailDTO.fecha` en `src/main/java/pet_finder/dtos/solicitud/SolicitudAdopcionDetailDTO.java:8` o `MensajeDetailDTO.fechaEnvio` en `src/main/java/pet_finder/dtos/mensaje/MensajeDetailDTO.java:10`) no tienen `@JsonFormat` propio. ⚠️ NO DETERMINADO: el formato exacto que produce Jackson para esos campos no está fijado por código propio del repo (depende de la auto-configuración de `jackson-datatype-jsr310` que trae `spring-boot-starter-web`, no hay override local).

## Formatos transversales

| Aspecto | Detalle | Cita |
|---|---|---|
| Tipo de IDs | `Long` en todos los modelos (`Comentario`, `Mascota`, `Mensaje`, `Miembro`, `NormaComunidad`, `Notificacion`, `Publicacion`, `SolicitudAdopcion`, `Ubicacion`) | `src/main/java/pet_finder/models/Mascota.java:12`, `src/main/java/pet_finder/models/Miembro.java:12`, etc. |
| `BigDecimal` | No se encontró ningún uso de `BigDecimal` en el proyecto (búsqueda en todo `src/main/java/pet_finder`). | — |
| Coordenadas | `latitud`/`longitud` son `Double` | `src/main/java/pet_finder/dtos/ubicacion/UbicacionDetailDTO.java:7-8` |
| Fecha (`LocalDate`) | Ejemplo: `PublicacionDetailDTO.fecha` | `src/main/java/pet_finder/dtos/publicacion/PublicacionDetailDTO.java:16` |
| Fecha-hora (`LocalDateTime`) | Ejemplo: `SolicitudAdopcionDetailDTO.fecha`, `fechaResolucion` | `src/main/java/pet_finder/dtos/solicitud/SolicitudAdopcionDetailDTO.java:8`, `:26` |
| Fecha-hora en error | `"timestamp": "2026-07-30T14:32:10"` (formato fijo `yyyy-MM-dd'T'HH:mm:ss`) | `src/main/java/pet_finder/exceptions/model/ErrorResponse.java:9` |

## Autenticación y autorización

- Esquema: header `Authorization: Bearer <token>`. El filtro `JwtAuthFilter` lee el header `Authorization` (`src/main/java/pet_finder/config/JwtAuthFilter.java:35`), exige que empiece con `"Bearer "` (`JwtAuthFilter.java:41`) y descarta ese prefijo de 7 caracteres para extraer el JWT (`JwtAuthFilter.java:47`). Si no hay header o no empieza con `Bearer `, la request sigue sin autenticar (`JwtAuthFilter.java:41-44`).
- Autenticación: `SecurityConfig` usa sesión `STATELESS` (`src/main/java/pet_finder/config/SecurityConfig.java:64`) y agrega `JwtAuthFilter` antes de `UsernamePasswordAuthenticationFilter` (`SecurityConfig.java:65`).
- Rutas públicas (`permitAll`): únicamente `/auth/login` y `/auth/registro` (`SecurityConfig.java:53`). Todo el resto de las rutas requiere `authenticated()` (`SecurityConfig.java:56`).
- Autorización por rol: se usa `@EnableMethodSecurity` (`SecurityConfig.java:23`) y anotaciones `@PreAuthorize` a nivel de método en cada endpoint de los controllers (p. ej. `@PreAuthorize("hasRole('ADMINISTRADOR')")` en `src/main/java/pet_finder/controllers/MiembroController.java:27`).
- Las autoridades de Spring Security se arman como `"ROLE_" + rol.name()` (`src/main/java/pet_finder/config/MiembroUserDetails.java:22`), por eso `@PreAuthorize` usa `hasRole('ADMINISTRADOR')` / `hasRole('MIEMBRO')` (sin el prefijo `ROLE_`, que Spring agrega implícitamente).
- Roles existentes: `MIEMBRO`, `ADMINISTRADOR` (`src/main/java/pet_finder/enums/RolUsuario.java:5-6`).
- CORS: habilitado para `http://127.0.0.1:5500`, `http://localhost:5500`, `http://localhost:4200`, métodos `GET, POST, PUT, DELETE, OPTIONS`, todos los headers, con credenciales (`SecurityConfig.java:40-43`).
- ⚠️ NO DETERMINADO: no se encontró configuración de `AuthenticationEntryPoint` ni `AccessDeniedHandler` personalizados (búsqueda de `exceptionHandling`, `AuthenticationEntryPoint`, `AccessDeniedHandler`, `httpBasic`, `formLogin` en todo `src/main/java/pet_finder` sin resultados). Por lo tanto el cuerpo/formato exacto de las respuestas 401 (sin token o token inválido) y 403 (rol insuficiente, rechazado en el filtro de seguridad) no está fijado por código propio del repo — no pasan por `GlobalHandlerException`, que sólo intercepta excepciones lanzadas dentro de la ejecución de los controllers (`src/main/java/pet_finder/exceptions/handler/GlobalHandlerException.java:18-19`).

## Estructura de errores

Toda excepción manejada por `GlobalHandlerException` (`@RestControllerAdvice`, `src/main/java/pet_finder/exceptions/handler/GlobalHandlerException.java:18`) devuelve un `ErrorResponse` con esta forma (`src/main/java/pet_finder/exceptions/model/ErrorResponse.java:8-21`):

```json
{
  "timestamp": "2026-07-30T14:32:10",
  "estado": 404,
  "error": "Not Found",
  "mensaje": "No se encontró un miembro con ese email"
}
```

`mensaje` puede ser un `String` o un `Map<String, String>` (comentario en el propio código, `ErrorResponse.java:13`), según el caso.

Tabla de excepciones y status HTTP mapeados por `GlobalHandlerException`:

| Excepción | Status | Línea |
|---|---|---|
| `Exception` (genérica) | 500 Internal Server Error | `GlobalHandlerException.java:23-28` |
| `MethodArgumentNotValidException` (`@Valid` fallido) | 400 Bad Request | `GlobalHandlerException.java:31-45` |
| `EntityNotFoundException` (JPA) | 404 Not Found | `GlobalHandlerException.java:50-54` |
| `EmailYaRegistradoException` | 409 Conflict | `GlobalHandlerException.java:57-61` |
| `UsuarioNoEncontradoException` | 404 Not Found | `GlobalHandlerException.java:64-68` |
| `FormatoInvalidoException` | 400 Bad Request | `GlobalHandlerException.java:71-75` |
| `MiembroInactivoException` | 400 Bad Request | `GlobalHandlerException.java:78-82` |
| `EntidadInactivaException` | 400 Bad Request | `GlobalHandlerException.java:85-89` |
| `UbicacionInvalidaException` | 400 Bad Request | `GlobalHandlerException.java:92-96` |
| `OperacionNoPermitidaException` | 403 Forbidden | `GlobalHandlerException.java:99-103` |
| `IllegalArgumentException` | 400 Bad Request | `GlobalHandlerException.java:106-110` |
| `IllegalStateException` | 409 Conflict | `GlobalHandlerException.java:113-117` |
| `ErrorEnRolException` | 409 Conflict | `GlobalHandlerException.java:120-124` |

Ejemplos reales por código (estructura idéntica en todos, sólo cambian `estado`/`error`/`mensaje`):

**400 — validación de `@Valid`** (mapa campo → mensaje, `GlobalHandlerException.java:32-44`):
```json
{
  "timestamp": "2026-07-30T14:32:10",
  "estado": 400,
  "error": "Bad Request",
  "mensaje": {
    "email": "El correo electronico no es válido",
    "contrasenia": "La contraseña debe tener al menos 6 caracteres"
  }
}
```

**400 — de negocio** (p. ej. `FormatoInvalidoException`, mensaje simple `String`):
```json
{
  "timestamp": "2026-07-30T14:32:10",
  "estado": 400,
  "error": "Bad Request",
  "mensaje": "La contraseña no es válida"
}
```

**403 — `OperacionNoPermitidaException`**:
```json
{
  "timestamp": "2026-07-30T14:32:10",
  "estado": 403,
  "error": "Forbidden",
  "mensaje": "<mensaje de la excepción>"
}
```

**404 — `EntityNotFoundException` / `UsuarioNoEncontradoException`**:
```json
{
  "timestamp": "2026-07-30T14:32:10",
  "estado": 404,
  "error": "Not Found",
  "mensaje": "No se encontró al miembro."
}
```

**409 — `EmailYaRegistradoException` / `IllegalStateException` / `ErrorEnRolException`**:
```json
{
  "timestamp": "2026-07-30T14:32:10",
  "estado": 409,
  "error": "Conflict",
  "mensaje": "<mensaje de la excepción>"
}
```

**500 — genérico** (mensaje fijo, no expone el detalle real de la excepción, `GlobalHandlerException.java:26`):
```json
{
  "timestamp": "2026-07-30T14:32:10",
  "estado": 500,
  "error": "Internal Server Error",
  "mensaje": "Ocurrió un error inesperado."
}
```

**Nota sobre 401/403 de Spring Security**: los rechazos de autenticación/autorización que ocurren en la cadena de filtros de seguridad (token ausente/inválido, o `@PreAuthorize` que falla) **no** pasan por `GlobalHandlerException`, porque este `@RestControllerAdvice` sólo captura excepciones lanzadas dentro de la ejecución de los controllers. No hay `AuthenticationEntryPoint`/`AccessDeniedHandler` propios en el repo, así que el formato exacto de esas respuestas queda ⚠️ NO DETERMINADO por el código del proyecto.

## Paginación

No se encontró ningún uso de `Pageable` ni `org.springframework.data.domain.Page` en el proyecto (búsqueda en todo `src/main/java/pet_finder`, sin resultados). Todos los endpoints de listado devuelven un `List<...>` completo (p. ej. `ResponseEntity<List<MascotaDetailDTO>>` en `src/main/java/pet_finder/controllers/MascotaController.java:65`). No hay paginación implementada.

## Wrapper de respuesta genérico

No existe ninguna clase tipo `ApiResponse<T>` ni wrapper genérico de respuesta (búsqueda de `class ApiResponse`/`record ApiResponse`/`class ResponseWrapper` en todo `src`, sin resultados). Los controllers devuelven directamente el DTO, la lista de DTOs, o texto plano según el endpoint.

Endpoints que devuelven **texto plano** (`ResponseEntity<String>`) en vez de JSON estructurado:

| Endpoint | Controller | Línea |
|---|---|---|
| `PUT /auth/cambiar-contrasenia` | `AuthController` | `src/main/java/pet_finder/config/AuthController.java:45` |
| `PUT /miembros/hacer-administrador/{id}` | `MiembroController` | `src/main/java/pet_finder/controllers/MiembroController.java:69` |
| `DELETE /miembros/{id}` | `MiembroController` | `src/main/java/pet_finder/controllers/MiembroController.java:79` |
| `DELETE /publicaciones/admin/{id}` | `PublicacionController` | `src/main/java/pet_finder/controllers/PublicacionController.java:140` |
| `DELETE /publicaciones/propia/{id}` | `PublicacionController` | `src/main/java/pet_finder/controllers/PublicacionController.java:151` |
| `DELETE /comentarios/id/{id}` | `ComentarioController` | `src/main/java/pet_finder/controllers/ComentarioController.java:48` |
| `DELETE /comentarios/propio/{id}` | `ComentarioController` | `src/main/java/pet_finder/controllers/ComentarioController.java:57` |

Caso particular: `MensajeController` declara dos endpoints como `ResponseEntity<?>` que devuelven **JSON** (una lista de DTOs) en el caso normal, pero un **`String` en texto plano** cuando la lista está vacía:
- `GET /mensajes/conversacion/{idMiembro}`: devuelve `List<MensajeDetailDTO>` o, si está vacía, el string `"No hay mensajes en esta conversación."` (`src/main/java/pet_finder/controllers/MensajeController.java:37-46`).
- `GET /mensajes/conversaciones`: devuelve `List<ConversacionDetailDTO>` o, si está vacía, el string `"No tenés conversaciones aún."` (`MensajeController.java:50-59`).

## Tabla maestra de enums

| Enum | Constante (request) | valorFront (response) | Archivo:línea |
|---|---|---|---|
| `RolUsuario` | `MIEMBRO` | *(sin `valorFront`; se serializa con `.name()` → `"MIEMBRO"`)* | `src/main/java/pet_finder/enums/RolUsuario.java:5` |
| `RolUsuario` | `ADMINISTRADOR` | *(sin `valorFront`; `.name()` → `"ADMINISTRADOR"`)* | `src/main/java/pet_finder/enums/RolUsuario.java:6` |
| `TipoMascota` | `PERRO` | `"perro"` | `src/main/java/pet_finder/enums/TipoMascota.java:5` |
| `TipoMascota` | `GATO` | `"gato"` | `src/main/java/pet_finder/enums/TipoMascota.java:6` |
| `EstadoMascota` | `PERDIDA` | `"perdido"` | `src/main/java/pet_finder/enums/EstadoMascota.java:5` |
| `EstadoMascota` | `ENCONTRADA` | `"encontrado"` | `src/main/java/pet_finder/enums/EstadoMascota.java:6` |
| `EstadoMascota` | `REENCONTRADA` | `"reencontrado"` | `src/main/java/pet_finder/enums/EstadoMascota.java:7` |
| `EstadoMascota` | `EN_ADOPCION` | `"en_adopcion"` | `src/main/java/pet_finder/enums/EstadoMascota.java:8` |
| `EstadoMascota` | `ADOPTADA` | `"adoptado"` | `src/main/java/pet_finder/enums/EstadoMascota.java:9` |
| `EstadoSolicitud` | `PENDIENTE` | `"pendiente"` | `src/main/java/pet_finder/enums/EstadoSolicitud.java:4` |
| `EstadoSolicitud` | `RECHAZADA` | `"rechazada"` | `src/main/java/pet_finder/enums/EstadoSolicitud.java:5` |
| `EstadoSolicitud` | `APROBADA` | `"aprobada"` | `src/main/java/pet_finder/enums/EstadoSolicitud.java:6` |
| `EstadoSolicitud` | `CANCELADA` | `"cancelada"` | `src/main/java/pet_finder/enums/EstadoSolicitud.java:7` |
| `TipoHogar` | `CASA` | `"casa"` | `src/main/java/pet_finder/enums/TipoHogar.java:4` |
| `TipoHogar` | `DEPARTAMENTO` | `"departamento"` | `src/main/java/pet_finder/enums/TipoHogar.java:5` |
| `TipoMascotasEnHogar` | `PERRO` | `"perro"` | `src/main/java/pet_finder/enums/TipoMascotasEnHogar.java:4` |
| `TipoMascotasEnHogar` | `GATO` | `"gato"` | `src/main/java/pet_finder/enums/TipoMascotasEnHogar.java:5` |
| `TipoMascotasEnHogar` | `PERRO_Y_GATO` | `"perro_y_gato"` | `src/main/java/pet_finder/enums/TipoMascotasEnHogar.java:6` |
| `TipoNotificacion` | `NUEVO_COMENTARIO` | *(sin `valorFront`; enum no usado en ningún DTO ni controller — ver nota)* | `src/main/java/pet_finder/enums/TipoNotificacion.java:4` |
| `TipoNotificacion` | `RESPUESTA_ADOPCION` | *(ídem)* | `src/main/java/pet_finder/enums/TipoNotificacion.java:5` |
| `TipoNotificacion` | `SOLICITUD_ADOPCION` | *(ídem)* | `src/main/java/pet_finder/enums/TipoNotificacion.java:6` |
| `TipoNotificacion` | `ADOPCION_DISPONIBLE_NUEVAMENTE` | *(ídem)* | `src/main/java/pet_finder/enums/TipoNotificacion.java:7` |
| `TipoNotificacion` | `NUEVO_MENSAJE` | *(ídem)* | `src/main/java/pet_finder/enums/TipoNotificacion.java:8` |
| `MotivoRechazo` | `MANUAL` | `"manual"` | `src/main/java/pet_finder/enums/MotivoRechazo.java:4` |
| `MotivoRechazo` | `AUTO_POR_OTRA_APROBADA` | `"auto_otra_aprobada"` | `src/main/java/pet_finder/enums/MotivoRechazo.java:5` |
| `MotivoRechazo` | `AUTO_POR_PUBLICACION_ELIMINADA` | `"auto_publicacion_eliminada"` | `src/main/java/pet_finder/enums/MotivoRechazo.java:6` |
| `MotivoRechazo` | `AUTO_CAMBIO_ESTADO_MASCOTA` | `"auto_cambio_estado_mascota"` | `src/main/java/pet_finder/enums/MotivoRechazo.java:7` |

**Notas sobre el patrón request/response:**
- Confirmado en al menos 4 DTOs: los `*DetailDTO` (records) tipan los campos de enum como `String` y los llenan con `getValorFront()` del enum — `MascotaDetailDTO.java:10-11`, `SolicitudAdopcionDetailDTO.java:33,38-39,45,47,54`. Para `RolUsuario` (que no tiene `valorFront`), se usa `.name()` en su lugar — `MiembroDetailDTO.java:13` y `AuthService.java:82` (para `AuthResponseDTO.rol`).
- Confirmado en al menos 3 `*RequestDTO`: conservan el tipo enum real, deserializado por Jackson según el nombre de la constante — `MascotaRequestDTO.java:12` (`EstadoMascota`), `MascotaRequestDTO.java:15` (`TipoMascota`), `SolicitudAdopcionRequestDTO.java:16` (`TipoHogar`), `SolicitudAdopcionRequestDTO.java:21` (`TipoMascotasEnHogar`), `MascotaRequestUpdateDTO.java:11-12`.
- **Excepción al patrón**: `ResolucionSolicitudRequestDTO.estado` es un `String` simple, no un `EstadoSolicitud` tipado (`src/main/java/pet_finder/dtos/solicitud/ResolucionSolicitudRequestDTO.java:7`). Del mismo modo, `PublicacionController.modificarEstado` y `filtrarPorTipoMascota`/`filtrarPorEstadoMascota`/`filtrarPorTipoYEstado` reciben el estado/tipo como `@PathVariable String` / `@RequestParam String`, no como enum tipado (`src/main/java/pet_finder/controllers/PublicacionController.java:53`, `:95`, `:109`, `:125-126`).
- `TipoNotificacion` no aparece en ningún DTO ni se serializa en ninguna respuesta: `NotificacionService` es una clase stub sin controller propio ni siquiera anotada `@Service` (`src/main/java/pet_finder/services/NotificacionService.java:1-20`).

## Inventario de recursos

| # | Recurso | Controller | Ruta base | Notas |
|---|---|---|---|---|
| 1 | Autenticación | `pet_finder.config.AuthController` (vive en el paquete `config`, no en `controllers`) | `/auth` (`src/main/java/pet_finder/config/AuthController.java:17`) | `/auth/login` y `/auth/registro` son públicos (`SecurityConfig.java:53`); `/auth/cambiar-contrasenia` requiere rol `ADMINISTRADOR` o `MIEMBRO` y devuelve texto plano (`AuthController.java:43-47`). |
| 2 | Miembros | `pet_finder.controllers.MiembroController` | `/miembros` (`src/main/java/pet_finder/controllers/MiembroController.java:18`) | Casi todos los endpoints requieren rol `ADMINISTRADOR`, salvo `PUT /miembros/modificar-datos` (`ADMINISTRADOR` o `MIEMBRO`, `MiembroController.java:58`). `PUT /miembros/{id}` está marcado como "Sin uso" en un comentario del código (`MiembroController.java:50`). |
| 3 | Mascotas | `pet_finder.controllers.MascotaController` | `/mascotas` (`src/main/java/pet_finder/controllers/MascotaController.java:18`) | Todos los endpoints requieren rol `MIEMBRO`. `DELETE /mascotas/{id}` hace baja lógica, no elimina el registro (comentario en `MascotaController.java:58`). |
| 4 | Publicaciones | `pet_finder.controllers.PublicacionController` | `/publicaciones` (`src/main/java/pet_finder/controllers/PublicacionController.java:20`) | Mezcla de roles según endpoint (`MIEMBRO`, o `MIEMBRO`+`ADMINISTRADOR`). Incluye filtros por query/path param como `String` sin tipar (ver nota de enums arriba). |
| 5 | Comentarios | `pet_finder.controllers.ComentarioController` | `/comentarios` (`src/main/java/pet_finder/controllers/ComentarioController.java:16`) | Borrado admin (`DELETE /comentarios/id/{id}`) vs. borrado propio (`DELETE /comentarios/propio/{id}`); ambos devuelven texto plano. |
| 6 | Mensajes | `pet_finder.controllers.MensajeController` | `/mensajes` (`src/main/java/pet_finder/controllers/MensajeController.java:18`) | Todos los endpoints requieren rol `MIEMBRO`. Dos endpoints devuelven `ResponseEntity<?>` (JSON o texto plano según si hay datos, ver sección "Wrapper de respuesta genérico"). |
| 7 | Solicitudes de adopción | `pet_finder.controllers.SolicitudAdopcionController` | `/solicitudes` (`src/main/java/pet_finder/controllers/SolicitudAdopcionController.java:18`) | Todos los endpoints requieren rol `MIEMBRO`. `estado` como filtro opcional (`@RequestParam(required = false) String estado`, `SolicitudAdopcionController.java:38`). |
| 8 | Normas de comunidad | `pet_finder.controllers.NormaComunidadController` | `/normas` (`src/main/java/pet_finder/controllers/NormaComunidadController.java:16`) | `GET` requiere `ADMINISTRADOR` o `MIEMBRO`; `POST` requiere `ADMINISTRADOR`. |
| 9 | Ubicación | `pet_finder.services.UbicacionService` | *(sin controller propio)* | Confirmado: no hay ninguna referencia a `UbicacionService` en `src/main/java/pet_finder/controllers` ni en `src/main/java/pet_finder/config` (búsqueda sin resultados). Se usa internamente, p. ej. desde `PublicacionController`/`PublicacionService`. |
| 10 | Notificaciones | `pet_finder.services.NotificacionService` | *(sin controller propio)* | Confirmado: no hay ninguna referencia a `NotificacionService` en `controllers`/`config` (búsqueda sin resultados). La clase es un stub sin lógica implementada (`src/main/java/pet_finder/services/NotificacionService.java:1-20`). |
