# 6 — Mensajes

Recurso base: `/mensajes` (`src/main/java/pet_finder/controllers/MensajeController.java:18`). Todos los endpoints requieren rol `MIEMBRO` (`@PreAuthorize("hasRole('MIEMBRO')")` en los tres métodos, `MensajeController.java:27,35,48`) y el usuario autenticado se obtiene de `@AuthenticationPrincipal MiembroUserDetails userDetails` (`MensajeController.java:29,37,50`).

Para el formato transversal de errores, fechas, enums y auth, ver `00-base.md`. Este documento es autocontenido para las tablas propias del recurso.

## A. Entidad

`Mensaje` (`src/main/java/pet_finder/models/Mensaje.java:8`), tabla `mensajes`:

| Campo | Tipo Java | Columna / anotación | Línea |
|---|---|---|---|
| `id` | `Long` | `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` | `Mensaje.java:10-12` |
| `texto` | `String` | `@Column(nullable = false, length = 500)` | `Mensaje.java:14-15` |
| `fechaEnvio` | `LocalDateTime` | `@Column(nullable = false)`; se setea a `LocalDateTime.now()` en ambos constructores (`Mensaje.java:32,38`) | `Mensaje.java:17-18` |
| `leido` | `Boolean` | `@Column(nullable = false)`; se inicializa en `false` en ambos constructores (`Mensaje.java:33,39`) | `Mensaje.java:20-21` |
| `emisor` | `Miembro` | `@ManyToOne(fetch = FetchType.LAZY)` `@JoinColumn(name = "id_emisor", nullable = false)` | `Mensaje.java:23-25` |
| `receptor` | `Miembro` | `@ManyToOne(fetch = FetchType.LAZY)` `@JoinColumn(name = "id_receptor", nullable = false)` | `Mensaje.java:27-29` |

No hay relación con `Publicacion`: `Mensaje` sólo referencia a `Miembro` (emisor/receptor). No existe ningún campo `publicacion`/`idPublicacion` en la entidad, ni en los DTOs (verificado leyendo el archivo completo, `Mensaje.java:1-87`).

## B. DTOs

### Índice

| DTO | Tipo | Usado en | Archivo |
|---|---|---|---|
| `MensajeDetailDTO` | `record` | Response de `POST /mensajes`, elemento de la lista en `GET /mensajes/conversacion/{idMiembro}` | `src/main/java/pet_finder/dtos/mensaje/MensajeDetailDTO.java` |
| `MensajeRequestDTO` | clase (`@Valid`) | Body de `POST /mensajes` | `src/main/java/pet_finder/dtos/mensaje/MensajeRequestDTO.java` |
| `ConversacionDetailDTO` | `record` | Elemento de la lista en `GET /mensajes/conversaciones` | `src/main/java/pet_finder/dtos/mensaje/ConversacionDetailDTO.java` |

`MensajeDetailDTO` representa **un mensaje individual** (con su emisor y receptor). `ConversacionDetailDTO` representa el **agregado/resumen de una conversación** con un contacto (no incluye los mensajes en sí, sólo datos del contacto y un contador de no leídos). Son estructuras completamente distintas y aparecen en endpoints distintos.

### `MensajeDetailDTO` (campo a campo)

Record con constructor de transformación que recibe la entidad `Mensaje` (`MensajeDetailDTO.java:17-28`):

| Campo JSON | Tipo | Origen / transformación | Línea |
|---|---|---|---|
| `id` | `Long` | `mensaje.getId()` | `MensajeDetailDTO.java:19` |
| `texto` | `String` | `mensaje.getTexto()` | `MensajeDetailDTO.java:20` |
| `fechaEnvio` | `LocalDateTime` | `mensaje.getFechaEnvio()` | `MensajeDetailDTO.java:21` |
| `leido` | `Boolean` | `mensaje.getLeido()` | `MensajeDetailDTO.java:22` |
| `idEmisor` | `Long` | `mensaje.getEmisor().getId()` | `MensajeDetailDTO.java:23` |
| `nombreEmisor` | `String` | `mensaje.getEmisor().getNombre()` | `MensajeDetailDTO.java:24` |
| `idReceptor` | `Long` | `mensaje.getReceptor().getId()` | `MensajeDetailDTO.java:25` |
| `nombreReceptor` | `String` | `mensaje.getReceptor().getNombre()` | `MensajeDetailDTO.java:26` |

Nota: `emisor` y `receptor` **no** se serializan como objetos anidados; se "aplanan" a `idEmisor`/`nombreEmisor` e `idReceptor`/`nombreReceptor`. No se expone el apellido ni el email del emisor/receptor en este DTO.

### `MensajeRequestDTO` (campo a campo)

Clase (no record), body de `POST /mensajes` (`MensajeRequestDTO.java:7-26`):

| Campo JSON | Tipo | Validación | Línea |
|---|---|---|---|
| `texto` | `String` | `@NotBlank(message = "El mensaje no puede estar vacío")`, `@Size(max = 500, message = "Máximo 500 caracteres")` | `MensajeRequestDTO.java:9-10` |
| `idReceptor` | `Long` | `@NotNull(message = "Debe indicar el receptor del mensaje")` | `MensajeRequestDTO.java:13-14` |

No tiene campo `idEmisor`: el emisor se toma del usuario autenticado (`userDetails.getId()`, `MensajeController.java:30`), no del body.

### `ConversacionDetailDTO` (campo a campo)

Record simple, sin constructor de transformación propio; se construye directamente en `MensajeService.listarConversaciones` (`MensajeService.java:77-82`):

| Campo JSON | Tipo | Origen | Línea |
|---|---|---|---|
| `idMiembro` | `Long` | `contacto.getId()` | `ConversacionDetailDTO.java:4`, `MensajeService.java:78` |
| `nombre` | `String` | `contacto.getNombre()` | `ConversacionDetailDTO.java:5`, `MensajeService.java:79` |
| `apellido` | `String` | `contacto.getApellido()` | `ConversacionDetailDTO.java:6`, `MensajeService.java:80` |
| `mensajesNoLeidos` | `Long` | `mensajeRepository.countMensajesNoLeidos(idUsuario, contacto.getId())` | `ConversacionDetailDTO.java:7`, `MensajeService.java:81` |

`contacto` es un `Miembro` completo (obtenido de `miembroRepository.findAllById(idsContactos)`, `MensajeService.java:74`), pero el DTO sólo expone id/nombre/apellido — no email, no rol, no estado `activo`.

## C. Delta entidad ↔ DTO

| Campo entidad `Mensaje` | ¿Aparece en `MensajeDetailDTO`? | Cómo |
|---|---|---|
| `id` | Sí | igual |
| `texto` | Sí | igual |
| `fechaEnvio` | Sí | igual |
| `leido` | Sí | igual |
| `emisor` (objeto `Miembro`) | Sí, aplanado | `idEmisor` + `nombreEmisor` (sólo id y nombre, no el objeto completo) |
| `receptor` (objeto `Miembro`) | Sí, aplanado | `idReceptor` + `nombreReceptor` (sólo id y nombre, no el objeto completo) |

`ConversacionDetailDTO` no deriva de la entidad `Mensaje` sino de la entidad `Miembro` (contacto) más un valor calculado (`mensajesNoLeidos`) obtenido por query agregada al repositorio de mensajes; no hay una entidad "Conversación" en el modelo de datos.

## D. Endpoints

Orden de aparición en `MensajeController.java`.

---

### `POST /mensajes`

`MensajeController.java:28-33`

| Aspecto | Detalle |
|---|---|
| Rol requerido | `MIEMBRO` (`MensajeController.java:27`) |
| Body | `MensajeRequestDTO` (`@Valid @RequestBody`) |
| Emisor | Se toma de `userDetails.getId()` (usuario autenticado), no del body (`MensajeController.java:30`) |
| Status éxito | **201 Created** — `ResponseEntity.status(HttpStatus.CREATED).body(enviado)` (`MensajeController.java:32`) |
| Response body éxito | `MensajeDetailDTO` (JSON, único objeto, no lista) |

**Reglas de negocio percibidas por el cliente** (`MensajeService.enviarMensaje`, `MensajeService.java:38-53`, y `MensajeValidation.java`):

| Regla | Excepción | Status (según `GlobalHandlerException`, ver `00-base.md`) |
|---|---|---|
| `idReceptor` no puede ser igual al emisor autenticado (`validarNoAutoMensaje`) | `OperacionNoPermitidaException("No podés enviarte mensajes a vos mismo")` | 403 Forbidden (`MensajeValidation.java:23-26`) |
| El emisor autenticado debe existir (`miembroValidation.validarExistenciaPorId`) | `UsuarioNoEncontradoException("No se encontró un usuario con el ID: " + Id)` | 404 Not Found (`MiembroValidation.java:42-45`) |
| El `idReceptor` debe existir (`validarReceptorExiste`) | `UsuarioNoEncontradoException("No se encontró el usuario receptor con ID: " + idReceptor)` | 404 Not Found (`MensajeValidation.java:18-21`) |
| El receptor debe estar activo (`validarReceptorActivo`, chequea `Miembro.activo`) | `OperacionNoPermitidaException("No se puede enviar mensajes a un usuario inactivo")` | 403 Forbidden (`MensajeValidation.java:29-33`) |

Request de ejemplo:
```json
{
  "texto": "Hola, ¿la mascota sigue disponible?",
  "idReceptor": 7
}
```

Response 201 de ejemplo:
```json
{
  "id": 15,
  "texto": "Hola, ¿la mascota sigue disponible?",
  "fechaEnvio": "2026-07-30T18:22:41.0912345",
  "leido": false,
  "idEmisor": 3,
  "nombreEmisor": "Sofía",
  "idReceptor": 7,
  "nombreReceptor": "Juan"
}
```
⚠️ NO DETERMINADO: el formato exacto (cantidad de decimales) con que Jackson serializa `LocalDateTime` no está fijado por código propio del repo (ver `00-base.md`, sección Jackson).

---

### `GET /mensajes/conversacion/{idMiembro}`

`MensajeController.java:36-46`

| Aspecto | Detalle |
|---|---|
| Rol requerido | `MIEMBRO` (`MensajeController.java:35`) |
| Path variable | `idMiembro` (`Long`) — id del otro miembro de la conversación |
| Usuario autenticado | `idUsuario = userDetails.getId()` (`MensajeController.java:38`) |
| Firma del método | `ResponseEntity<?> obtenerConversacion(...)` — tipo de retorno deliberadamente no fijo (`MensajeController.java:37`) |
| Validación previa | `miembroValidation.validarExistenciaPorId(idOtro)`: si `idMiembro` no existe, lanza `UsuarioNoEncontradoException` → 404 (`MensajeService.java:57`, `MiembroValidation.java:42-45`) |
| Efecto colateral | Todos los mensajes de la conversación donde el receptor es `idUsuario` y `leido = false` se marcan como `leido = true` y se persisten (`mensajeRepository.saveAll`) **como parte de este GET** (`MensajeService.java:61-64`) |
| Orden | Ascendente por `fechaEnvio` (`MensajeRepository.findConversacion`, `MensajeRepository.java:14`) |

**Comportamiento dual (trampa central de este recurso):**

- Si `mensajes` NO está vacía → `200 OK` con `List<MensajeDetailDTO>` en JSON (`MensajeController.java:45`).
- Si `mensajes` está vacía → `200 OK` con el **string en texto plano** `"No hay mensajes en esta conversación."` (`MensajeController.java:41-43`, texto literal en `MensajeController.java:42`).

En ambos casos el status HTTP es 200; lo que cambia es el `Content-Type`/forma del body, no el status. El cliente debe intentar parsear JSON y manejar el caso de que la respuesta sea un string plano.

Response 200 — caso con datos (JSON):
```json
[
  {
    "id": 12,
    "texto": "Hola, ¿la mascota sigue disponible?",
    "fechaEnvio": "2026-07-28T10:15:00",
    "leido": true,
    "idEmisor": 3,
    "nombreEmisor": "Sofía",
    "idReceptor": 7,
    "nombreReceptor": "Juan"
  },
  {
    "id": 13,
    "texto": "Sí, todavía está disponible",
    "fechaEnvio": "2026-07-28T10:20:00",
    "leido": true,
    "idEmisor": 7,
    "nombreEmisor": "Juan",
    "idReceptor": 3,
    "nombreReceptor": "Sofía"
  }
]
```

Response 200 — caso lista vacía (texto plano, `Content-Type` no JSON):
```
No hay mensajes en esta conversación.
```

---

### `GET /mensajes/conversaciones`

`MensajeController.java:49-59`

| Aspecto | Detalle |
|---|---|
| Rol requerido | `MIEMBRO` (`MensajeController.java:48`) |
| Parámetros | Ninguno (sólo usuario autenticado, `idUsuario = userDetails.getId()`, `MensajeController.java:51`) |
| Firma del método | `ResponseEntity<?> listarConversaciones(...)` (`MensajeController.java:50`) |
| Lógica de armado | `MensajeService.listarConversaciones` (`MensajeService.java:69-84`): junta en un `Set<Long>` (deduplicado) los ids de todos los miembros a quienes `idUsuario` les envió mensajes (`findIdsReceptores`) y de todos los que le enviaron a `idUsuario` (`findIdsEmisores`); busca esos `Miembro` con `findAllById`; y arma un `ConversacionDetailDTO` por cada uno, con el conteo de mensajes no leídos recibidos de ese contacto | `MensajeService.java:70-83`, `MensajeRepository.java:17-24` |
| Orden | ⚠️ NO DETERMINADO: no hay `ORDER BY` en las queries que alimentan `idsContactos` (`MensajeRepository.java:17,20`) ni un `.sorted()` en el stream (`MensajeService.java:76-83`); el orden final depende de `Set<Long>` → `findAllById`, no está garantizado por código propio. |

**Comportamiento dual (misma trampa):**

- Si `conversaciones` NO está vacía → `200 OK` con `List<ConversacionDetailDTO>` en JSON (`MensajeController.java:58`).
- Si `conversaciones` está vacía → `200 OK` con el **string en texto plano** `"No tenés conversaciones aún."` (`MensajeController.java:54-56`, texto literal en `MensajeController.java:55`).

Response 200 — caso con datos (JSON):
```json
[
  {
    "idMiembro": 7,
    "nombre": "Juan",
    "apellido": "Pérez",
    "mensajesNoLeidos": 2
  },
  {
    "idMiembro": 9,
    "nombre": "Ana",
    "apellido": "Gómez",
    "mensajesNoLeidos": 0
  }
]
```

Response 200 — caso lista vacía (texto plano, `Content-Type` no JSON):
```
No tenés conversaciones aún.
```

## E. Pendientes

- ⚠️ NO DETERMINADO: formato exacto de serialización de `LocalDateTime` (`fechaEnvio`) — no hay `@JsonFormat` propio en `MensajeDetailDTO` ni configuración Jackson global en el repo (ver `00-base.md`).
- ⚠️ NO DETERMINADO: el `Content-Type` HTTP exacto de las respuestas de texto plano (`"No hay mensajes en esta conversación."` / `"No tenés conversaciones aún."`). El código sólo llama a `ResponseEntity.ok(String)`, sin fijar `Content-Type` explícito; el valor efectivo depende del `HttpMessageConverter` que Spring seleccione en tiempo de ejecución, no está fijado por código propio del repo.
- ⚠️ NO DETERMINADO: orden de los elementos en `GET /mensajes/conversaciones` (no hay `ORDER BY` ni `.sorted()` en el código, ver sección D).
- Confirmado (no es un pendiente, aclarado para evitar suposición): `Mensaje` no tiene relación con `Publicacion`. Los mensajes son 1 a 1 entre `Miembro`s (emisor/receptor), sin asociación a una publicación/mascota específica.
- Confirmado: no existe endpoint de borrado ni de edición de mensajes en `MensajeController` — sólo `POST /mensajes`, `GET /mensajes/conversacion/{idMiembro}` y `GET /mensajes/conversaciones` (archivo completo, `MensajeController.java:1-61`).
