# 6 — Mensajes

Recurso base: `/mensajes` (`src/main/java/pet_finder/controllers/MensajeController.java:18`). Los cuatro endpoints requieren rol `MIEMBRO` (`@PreAuthorize("hasRole('MIEMBRO')")` en los cuatro métodos, `MensajeController.java:27,35,44,54`) y el usuario autenticado se obtiene de `@AuthenticationPrincipal MiembroUserDetails userDetails`.

Para el formato transversal de errores, fechas, enums y auth, ver `00-base.md`. Este documento es autocontenido para las tablas propias del recurso.

## A. Entidad

`Mensaje` (`src/main/java/pet_finder/models/Mensaje.java:8`), tabla `mensajes`:

| Campo | Tipo Java | Columna / anotación | Línea |
|---|---|---|---|
| `id` | `Long` | `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` | `Mensaje.java:10-12` |
| `texto` | `String` | `@Column(nullable = false, length = 500)` | `Mensaje.java:14-15` |
| `fechaEnvio` | `LocalDateTime` | `@Column(nullable = false)`; se setea a `LocalDateTime.now()` en ambos constructores | `Mensaje.java:17-18` |
| `leido` | `Boolean` | `@Column(nullable = false)`; se inicializa en `false` en ambos constructores | `Mensaje.java:20-21` |
| `emisor` | `Miembro` | `@ManyToOne(fetch = FetchType.LAZY)` `@JoinColumn(name = "id_emisor", nullable = false)` | `Mensaje.java:23-25` |
| `receptor` | `Miembro` | `@ManyToOne(fetch = FetchType.LAZY)` `@JoinColumn(name = "id_receptor", nullable = false)` | `Mensaje.java:27-29` |

No hay relación con `Publicacion`: `Mensaje` sólo referencia a `Miembro` (emisor/receptor). No existe ningún campo `publicacion`/`idPublicacion` en la entidad ni en los DTOs.

## B. DTOs

### Índice

| DTO | Tipo | Usado en | Archivo |
|---|---|---|---|
| `MensajeDetailDTO` | `record` | Response de `POST /mensajes`, elemento de la lista en `GET /mensajes/conversacion/{idMiembro}` | `src/main/java/pet_finder/dtos/mensaje/MensajeDetailDTO.java` |
| `MensajeRequestDTO` | clase (`@Valid`) | Body de `POST /mensajes` | `src/main/java/pet_finder/dtos/mensaje/MensajeRequestDTO.java` |
| `ConversacionDetailDTO` | `record` | Elemento de la lista en `GET /mensajes/conversaciones` | `src/main/java/pet_finder/dtos/mensaje/ConversacionDetailDTO.java` |

`MensajeDetailDTO` representa **un mensaje individual** (con su emisor y receptor). `ConversacionDetailDTO` representa el **resumen de una conversación** con un contacto: datos del contacto, contador de no leídos y una vista previa del último mensaje. No incluye los mensajes en sí. Son estructuras distintas y aparecen en endpoints distintos.

### `MensajeDetailDTO` (campo a campo)

Componentes del record

| Campo JSON | Tipo Java | Tipo JSON | Origen / transformación |
|---|---|---|---|
| `id` | `Long` | number | `mensaje.getId()` |
| `texto` | `String` | string | `mensaje.getTexto()` |
| `fechaEnvio` | `LocalDateTime` | string ISO 8601 | `mensaje.getFechaEnvio()` |
| `leido` | `Boolean` | boolean | `mensaje.getLeido()` |
| `idEmisor` | `Long` | number | `mensaje.getEmisor().getId()` |
| `nombreEmisor` | `String` | string | `mensaje.getEmisor().getNombre()` |
| `idReceptor` | `Long` | number | `mensaje.getReceptor().getId()` |
| `nombreReceptor` | `String` | string | `mensaje.getReceptor().getNombre()` |

- `emisor` y `receptor` **no** se serializan como objetos anidados: se "aplanan" a `idEmisor`/`nombreEmisor` e `idReceptor`/`nombreReceptor`.
- `nombreEmisor`/`nombreReceptor` son **sólo el nombre de pila** (`getNombre()`), no incluyen apellido. Si la UI necesita el nombre completo del otro miembro tiene que sacarlo de otro lado (por ejemplo de `ConversacionDetailDTO`, que sí trae `apellido`).
- **No existe ningún campo tipo `esPropio`.** El cliente lo deriva comparando `idEmisor` contra el id del usuario logueado.


### `MensajeRequestDTO` (campo a campo)

Clase (no record), body de `POST /mensajes` (`MensajeRequestDTO.java:7-26`):

| Campo JSON | Tipo | Validación | Línea |
|---|---|---|---|
| `texto` | `String` | `@NotBlank(message = "El mensaje no puede estar vacío")`, `@Size(max = 500, message = "Máximo 500 caracteres")` | `MensajeRequestDTO.java:9-10` |
| `idReceptor` | `Long` | `@NotNull(message = "Debe indicar el receptor del mensaje")` | `MensajeRequestDTO.java:13-14` |

No tiene campo `idEmisor`: el emisor se toma del usuario autenticado (`userDetails.getId()`, `MensajeController.java:30`), no del body. 

### `ConversacionDetailDTO` (campo a campo)

| Campo JSON | Tipo Java | Tipo JSON | Origen | ¿Nuevo? |
|---|---|---|---|---|
| `idMiembro` | `Long` | number | id del contacto (el otro miembro de la conversación) | — |
| `nombre` | `String` | string | nombre del contacto | — |
| `apellido` | `String` | string | apellido del contacto | — |
| `mensajesNoLeidos` | `Long` | number | conteo de mensajes recibidos de ese contacto sin leer | — |
| `ultimoMensaje` | `String` | string | texto del último mensaje de la conversación | 
| `fechaUltimoMensaje` | `LocalDateTime` | string ISO 8601 | fecha del último mensaje de la conversación 
| `activo` | `boolean` | referencia al miembro

Notas para el cliente:

- El campo de fecha se llama **`fechaUltimoMensaje`**. No `LocalDateTime` — ese es el tipo Java, no el nombre del componente del record.
- No hay entidad `Conversacion` en el modelo de datos: este DTO se arma a partir del `Miembro` contacto más valores calculados sobre los mensajes. **Una conversación se identifica por `idMiembro`**, el id del otro miembro.
- El DTO expone del contacto sólo id/nombre/apellido — no email, no rol, no estado `activo`.

## C. Delta entidad ↔ DTO

| Campo entidad `Mensaje` | ¿Aparece en `MensajeDetailDTO`? | Cómo |
|---|---|---|
| `id` | Sí | igual |
| `texto` | Sí | igual |
| `fechaEnvio` | Sí | igual |
| `leido` | Sí | igual |
| `emisor` (objeto `Miembro`) | Sí, aplanado | `idEmisor` + `nombreEmisor` (sólo id y nombre) |
| `receptor` (objeto `Miembro`) | Sí, aplanado | `idReceptor` + `nombreReceptor` (sólo id y nombre) |

`ConversacionDetailDTO` no deriva de la entidad `Mensaje` sino de la entidad `Miembro` (contacto) más tres valores calculados sobre los mensajes de esa conversación (`mensajesNoLeidos`, `ultimoMensaje`, `fechaUltimoMensaje`). No hay una entidad "Conversación".

## D. Endpoints

Orden de aparición en `MensajeController.java`. **Son cuatro** 

---

### `POST /mensajes`

`MensajeController.java:27-33`

| Aspecto | Detalle |
|---|---|
| Rol requerido | `MIEMBRO` (`MensajeController.java:27`) |
| Path | `@PostMapping` sin path adicional: el id del emisor **no** va en la URL |
| Body | `MensajeRequestDTO` (`@Valid @RequestBody`) |
| Emisor | `userDetails.getId()` (usuario autenticado), no del body ni de la URL (`MensajeController.java:30`) |
| Status éxito | **201 Created** (`MensajeController.java:32`) |
| Tipo de retorno | `ResponseEntity<MensajeDetailDTO>` — tipado, no wildcard (`MensajeController.java:29`) |
| Response body éxito | `MensajeDetailDTO` (objeto único, no lista) |

**Reglas de negocio** 

| Regla | Excepción | Status |
|---|---|---|
| `idReceptor` no puede ser igual al emisor autenticado | `OperacionNoPermitidaException("No podés enviarte mensajes a vos mismo")` | 403 Forbidden |
| El emisor autenticado debe existir | `UsuarioNoEncontradoException` | 404 Not Found |
| El `idReceptor` debe existir | `UsuarioNoEncontradoException` | 404 Not Found |
| El receptor debe estar activo | `OperacionNoPermitidaException("No se puede enviar mensajes a un usuario inactivo")` | 403 Forbidden |

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


---

### `GET /mensajes/conversacion/{idMiembro}`

`MensajeController.java:35-42`

| Aspecto | Detalle |
|---|---|
| Rol requerido | `MIEMBRO` (`MensajeController.java:35`) |
| Path variable | `idMiembro` (`Long`) — id del otro miembro de la conversación |
| Query param | `desdeId` (`Long`), `@RequestParam(defaultValue = "0")` — **opcional**; en `0` trae la conversación completa (`MensajeController.java:37`) |
| Usuario autenticado | `idUsuario = userDetails.getId()` (`MensajeController.java:38`) |
| Firma | `ResponseEntity<?>` (wildcard) pero **siempre** devuelve `List<MensajeDetailDTO>` (`MensajeController.java:37,41`) |
| Status éxito | **200 OK** |
| Response body | `List<MensajeDetailDTO>` en JSON. Lista vacía → `[]` (JSON válido) |

**El comportamiento dual desapareció.** El controller hace `return ResponseEntity.ok(mensajes);` incondicionalmente (`MensajeController.java:41`): ya no existe la rama que devolvía el string en texto plano `"No hay mensajes en esta conversación."`. Ver sección F.

El `ResponseEntity<?>` quedó como wildcard vestigial: no hay ninguna rama que devuelva algo distinto de la lista.

⚠️ NO DETERMINADO (dependen de `MensajeService.obtenerConversacion`, no re-verificado):

- La semántica exacta de `desdeId` — el controller sólo lo pasa a `mensajeService.obtenerConversacion(idUsuario, idMiembro, desdeId)` (`MensajeController.java:39`). Presumiblemente filtra `id > desdeId` para carga incremental, pero no está verificado.
- Si el GET **sigue marcando como leídos** los mensajes recibidos, como hacía en la revisión anterior. Ahora existe un endpoint dedicado (`PUT .../leidos`), lo que sugiere que el efecto colateral se movió ahí, pero no está verificado. **El cliente no debería asumir ninguna de las dos cosas.**
- El orden de los mensajes (la revisión anterior documentaba ascendente por `fechaEnvio` vía `MensajeRepository.findConversacion`).
- Si valida que `idMiembro` exista (la revisión anterior documentaba 404 vía `validarExistenciaPorId`).

Response 200 de ejemplo:
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

Response 200 — conversación vacía:
```json
[]
```

---

### `PUT /mensajes/conversacion/{idMiembro}/leidos`

`MensajeController.java:44-52` — **endpoint nuevo**, no existía en la revisión anterior del documento.

| Aspecto | Detalle |
|---|---|
| Método | `marcarConversacionLeida` (`MensajeController.java:46`) |
| Rol requerido | `MIEMBRO` (`MensajeController.java:44`) |
| Path variable | `idMiembro` (`Long`) — id del otro miembro de la conversación |
| Body de request | Ninguno |
| Usuario autenticado | `userDetails.getId()`, pasado como primer argumento al service (`MensajeController.java:50`) |
| Firma | `ResponseEntity<Void>` — tipado, no wildcard (`MensajeController.java:46`) |
| Status éxito | **204 No Content** (`ResponseEntity.noContent().build()`, `MensajeController.java:51`) |
| Response body | Ninguno |

Marca como leídos los mensajes de esa conversación mediante `mensajeService.marcarLeidos(userDetails.getId(), idMiembro)` (`MensajeController.java:50`).

⚠️ NO DETERMINADO (dependen de `MensajeService.marcarLeidos`, no re-verificado):

- Qué mensajes marca exactamente. Por el orden de los argumentos, presumiblemente los recibidos por el usuario autenticado desde `idMiembro` — no los que el usuario envió. No verificado.
- Si valida que `idMiembro` exista, y con qué status falla si no.
- Si es idempotente / qué pasa al llamarlo sobre una conversación sin mensajes no leídos (lo esperable es 204 igual, pero no está verificado).

---

### `GET /mensajes/conversaciones`

`MensajeController.java:54-61`

| Aspecto | Detalle |
|---|---|
| Rol requerido | `MIEMBRO` (`MensajeController.java:54`) |
| Parámetros | Ninguno (sólo el usuario autenticado, `MensajeController.java:57`) |
| Firma | `ResponseEntity<?>` (wildcard) pero **siempre** devuelve `List<ConversacionDetailDTO>` (`MensajeController.java:56,60`) |
| Status éxito | **200 OK** |
| Response body | `List<ConversacionDetailDTO>` en JSON. Lista vacía → `[]` (JSON válido) |

**El comportamiento dual desapareció** acá también: `return ResponseEntity.ok(conversaciones);` incondicional (`MensajeController.java:60`). Ya no devuelve el string `"No tenés conversaciones aún."`. Ver sección F.

⚠️ NO DETERMINADO (dependen de `MensajeService.listarConversaciones`, no re-verificado):

- **El orden de las conversaciones.** La revisión anterior lo marcaba como no garantizado (sin `ORDER BY` ni `.sorted()`). Con la incorporación de `fechaUltimoMensaje` es razonable suponer que ahora se ordenan por actividad descendente, pero **eso no está verificado contra el código**. Si el cliente depende del orden, conviene confirmarlo o reordenar del lado del front.
- Cómo se arma la lista de contactos y cómo se calculan los campos derivados.

Response 200 de ejemplo:
```json
[
  {
    "idMiembro": 7,
    "nombre": "Juan",
    "apellido": "Pérez",
    "mensajesNoLeidos": 2,
    "ultimoMensaje": "Sí, todavía está disponible",
    "fechaUltimoMensaje": "2026-07-28T10:20:00"
  },
  {
    "idMiembro": 9,
    "nombre": "Ana",
    "apellido": "Gómez",
    "mensajesNoLeidos": 0,
    "ultimoMensaje": "Gracias!",
    "fechaUltimoMensaje": "2026-07-21T19:03:12"
  }
]
```

Response 200 — sin conversaciones:
```json
[]
```

## E. Pendientes

- ⚠️ NO DETERMINADO: formato exacto de serialización de `LocalDateTime` (`fechaEnvio`, `fechaUltimoMensaje`) — sin `@JsonFormat` propio ni configuración Jackson global conocida (ver `00-base.md`). Tampoco está determinado si los `LocalDateTime` se emiten en la zona horaria del servidor; como no llevan offset, un cliente que los parsee como hora local mostrará horas corridas si el servidor no está en la misma zona.
- ⚠️ NO DETERMINADO: todo lo listado por endpoint en la sección D que dependa de `MensajeService`, `MensajeValidation` o `MensajeRepository` (no re-verificados en esta revisión).
- Pendiente de re-verificación: la sección A (entidad) y `MensajeRequestDTO`, que se arrastran sin cambios de la revisión anterior.
- Confirmado (controller re-verificado): `Mensaje` no tiene relación con `Publicacion`. Los mensajes son 1 a 1 entre `Miembro`s, sin asociación a una publicación/mascota.
- Confirmado (controller re-verificado): no existe endpoint de borrado ni de edición de mensajes. Los únicos cuatro son los de la sección D.

## F. Cambios respecto de la revisión anterior

Dos correcciones que invalidan afirmaciones del documento viejo. Si escribiste código del lado del cliente contra la versión anterior, revisá estos dos puntos.

### 1. El endpoint `PUT .../leidos` **sí existe**

La revisión anterior afirmaba que sólo había tres endpoints y que marcar como leído era exclusivamente un efecto colateral del `GET /conversacion/{idMiembro}`. Es falso desde el cambio de backend: existe `PUT /mensajes/conversacion/{idMiembro}/leidos` → 204 (`MensajeController.java:44-52`).

### 2. Las listas vacías ya **no** vuelven como texto plano

La revisión anterior documentaba como "trampa central" que los dos GET respondían `200 OK` con un `String` en texto plano cuando no había resultados (`"No hay mensajes en esta conversación."` / `"No tenés conversaciones aún."`) en vez de una lista JSON. **Eso ya no pasa**: los dos hacen `ResponseEntity.ok(lista)` incondicionalmente y una lista vacía se serializa como `[]`.

Consecuencia práctica: ya no hace falta el workaround de pedir la respuesta como texto y parsearla a mano para evitar que el `JSON.parse` interno del cliente HTTP rompa con un 200. Se puede consumir como JSON tipado directamente.

### 3. `GET /conversacion/{idMiembro}` acepta `desdeId`

Query param opcional `@RequestParam(defaultValue = "0")` para carga incremental (`MensajeController.java:37`). No estaba documentado antes.

### 4. `ConversacionDetailDTO` tiene dos campos nuevos

`ultimoMensaje` (`String`) y `fechaUltimoMensaje` (`LocalDateTime`). El resumen de conversación ahora alcanza para renderizar una vista previa del último mensaje sin pedir la conversación completa.
