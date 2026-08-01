# 9 — Ubicación (objeto anidado, sin endpoints propios)

`Ubicacion` no tiene `Controller` propio. No hay ninguna referencia a `UbicacionService` en `src/main/java/pet_finder/controllers` ni en `src/main/java/pet_finder/config` (confirmado también en `docs/api/00-base.md`, fila 9 de la tabla "Inventario de recursos"). Se usa exclusivamente como objeto anidado dentro de `Publicacion`.

## A. Entidad

Clase `pet_finder.models.Ubicacion` (`src/main/java/pet_finder/models/Ubicacion.java:7`), anotada `@Entity` (`Ubicacion.java:5`), tabla `ubicaciones` (`@Table(name = "ubicaciones")`, `Ubicacion.java:6`).

| Campo | Tipo Java | Anotaciones JPA | Nullable | Length | Cita |
|---|---|---|---|---|---|
| `id` | `Long` | `@Id`, `@GeneratedValue(strategy = GenerationType.IDENTITY)` | *(PK, autogenerado)* | — | `Ubicacion.java:9-11` |
| `direccion` | `String` | *(sin anotación de columna)* | ⚠️ NO DETERMINADO a nivel JPA (sin `@Column`); a nivel DTO de entrada es obligatorio, ver sección B | ⚠️ NO DETERMINADO a nivel JPA (sin `@Column`, sin `length`) | `Ubicacion.java:13` |
| `altura` | `Integer` | *(sin anotación de columna)* | ⚠️ NO DETERMINADO a nivel JPA | — | `Ubicacion.java:14` |
| `latitud` | `Double` | *(sin anotación de columna)* | ⚠️ NO DETERMINADO a nivel JPA | — | `Ubicacion.java:16` |
| `longitud` | `Double` | *(sin anotación de columna)* | ⚠️ NO DETERMINADO a nivel JPA | — | `Ubicacion.java:17` |
| `activo` | `Boolean` | `@Column(nullable = false)` | `false` (no nulo) | — | `Ubicacion.java:19-20` |

Constructor sin argumentos: inicializa `activo = true` con comentario `// Activo por default` (`Ubicacion.java:22-24`). No hay ningún otro constructor en la entidad.

### Validaciones (`UbicacionValidation`, `src/main/java/pet_finder/validations/UbicacionValidation.java`)

| Método | Qué valida | Excepción | Mensaje exacto | Cita |
|---|---|---|---|---|
| `esInactivo(Ubicacion ubicacion)` | Que la ubicación esté activa (`ubicacion.getActivo()`); si NO lo está, lanza excepción | `IllegalStateException` | `"La ubicación con ID : " + ubicacion.getId() + " esta inactiva."` | `UbicacionValidation.java:16-20` |
| `validarGeocodificacion(Ubicacion ubicacion)` | 1) que `latitud` y `longitud` no sean `null`; 2) que las coordenadas caigan dentro del rectángulo de Mar del Plata (`latMin=-38.15, latMax=-37.90, longMin=-57.70, longMax=-57.50`) | `UbicacionInvalidaException` (mapeada a 400 Bad Request, ver `00-base.md`) | Caso 1: `"La ubicación debe tener latitud y longitud."` — Caso 2: `"Las coordenadas se encuentran fuera de Mar del Plata."` | `UbicacionValidation.java:24-44` |
| `contenidoIgualA(Ubicacion original, UbicacionRequestDTO nueva)` | Compara `direccion` y `altura` (no compara `latitud`/`longitud`) entre la ubicación existente y el request nuevo; devuelve `boolean`. Si `nueva == null`, devuelve `false`. Comentario en el código: *"se usa para indicar si dos ubicaciones son iguales para ser implementadas en una actualización"* | — (no lanza excepción, es un predicado) | — | `UbicacionValidation.java:48-53` |

`⚠️ NO DETERMINADO`: no hay ninguna validación de formato de dirección (regex, longitud mínima, etc.) más allá de las anotaciones `@NotBlank`/`@Size` del DTO de request (sección B). No existe ningún enum de tipo de vía, provincia, localidad, etc. asociado a `Ubicacion` — búsqueda en `src/main/java/pet_finder/enums` sin resultados relacionados a ubicación/dirección/provincia.

## B. DTOs

| DTO | Tipo Java | Paquete | Uso |
|---|---|---|---|
| `UbicacionDetailDTO` | `record` | `pet_finder.dtos.ubicacion` | Salida (serialización de respuesta) |
| `UbicacionRequestDTO` | clase (con getters, sin setters salvo implícitos) | `pet_finder.dtos.ubicacion` | Entrada (deserialización de request, anidado dentro de `PublicacionRequestDTO`/`PublicacionRequestUpdateDTO`) |

### `UbicacionDetailDTO` (`src/main/java/pet_finder/dtos/ubicacion/UbicacionDetailDTO.java:5-9`)

Record con 3 componentes. JSON que efectivamente se serializa:

```json
{
  "ubicacion": "Av. Colón 1234",
  "latitud": -37.9945,
  "longitud": -57.5626
}
```

| Campo JSON | Tipo | Origen / construcción | Cita |
|---|---|---|---|
| `ubicacion` | `String` | Se arma en el constructor auxiliar como `ubicacion.getDireccion() + " " + ubicacion.getAltura()` — **no** es un campo propio de la entidad, es la concatenación de `direccion` + `" "` + `altura` | `UbicacionDetailDTO.java:12` |
| `latitud` | `Double` | `ubicacion.getLatitud()` (tal cual, sin transformación) | `UbicacionDetailDTO.java:13` |
| `longitud` | `Double` | `ubicacion.getLongitud()` (tal cual, sin transformación) | `UbicacionDetailDTO.java:14` |

Notar: **no** expone `id` ni `activo`. Si `altura` es `null`, la concatenación produce el literal `"...null"` (comportamiento de Java al concatenar `String + null`); no hay manejo especial en el código para ese caso — `⚠️ NO DETERMINADO` si esto es intencional.

### `UbicacionRequestDTO` (`src/main/java/pet_finder/dtos/ubicacion/UbicacionRequestDTO.java:8-40`)

Clase (no record), con constructor vacío y sin setters para `latitud`/`longitud` visibles más allá de los getters (no tiene setters en absoluto — se deserializa vía Jackson usando el constructor por defecto + reflection/campos, ya que no hay `@JsonCreator` ni setters explícitos). JSON de entrada esperado:

```json
{
  "direccion": "Av. Colón",
  "altura": 1234,
  "latitud": -37.9945,
  "longitud": -57.5626
}
```

| Campo JSON | Tipo Java | Validación | Mensaje exacto | Cita |
|---|---|---|---|---|
| `direccion` | `String` | `@NotBlank` + `@Size(max = 100)` | `"La direccion no puede estar vacia."` / `"La dirección no puede tener más de 100 caracteres."` | `UbicacionRequestDTO.java:10-12` |
| `altura` | `Integer` | `@Min(value = 0)` | `"La altura no puede ser negativa."` | `UbicacionRequestDTO.java:14-15` |
| `latitud` | `Double` | `@NotNull` | `"La latitud no puede ser nula"` | `UbicacionRequestDTO.java:17-18` |
| `longitud` | `Double` | `@NotNull` | `"La longitud no puede ser nula"` | `UbicacionRequestDTO.java:20-21` |

Nota: `altura` no tiene `@NotNull` ni `@NotBlank` (solo `@Min`), por lo que puede omitirse/ser `null` sin disparar error de validación `@Valid`; en ese caso el `UbicacionDetailDTO.ubicacion` resultante contendría el literal `"...null"` al final (ver arriba).

Estas validaciones `@Valid`/`@NotBlank`/`@NotNull`/`@Size`/`@Min` sólo se disparan cuando `UbicacionRequestDTO` está anotado con `@Valid` en el DTO contenedor (confirmado en `PublicacionRequestDTO.java:16` y `PublicacionRequestUpdateDTO.java:17`) y producen un 400 con mapa de errores vía `MethodArgumentNotValidException` (ver `00-base.md`, sección "Estructura de errores").

## C. Delta entidad ↔ DTO

| Aspecto | Entidad `Ubicacion` | `UbicacionDetailDTO` (salida) | `UbicacionRequestDTO` (entrada) |
|---|---|---|---|
| `id` | Sí (`Long`, PK) | **No se expone** | No aplica (no se puede fijar por request) |
| `direccion` | Campo propio `String` | No aparece como campo propio; se concatena dentro de `ubicacion` | Sí, campo propio, validado `@NotBlank`/`@Size(max=100)` |
| `altura` | Campo propio `Integer` | No aparece como campo propio; se concatena dentro de `ubicacion` | Sí, campo propio, validado `@Min(0)`, no obligatorio |
| `ubicacion` (string compuesto) | No existe en la entidad | Sí, calculado como `direccion + " " + altura` | No existe en el request (se arma después del `direccion`/`altura` recibidos) |
| `latitud` | Campo propio `Double` | Sí, igual | Sí, igual, validado `@NotNull` |
| `longitud` | Campo propio `Double` | Sí, igual | Sí, igual, validado `@NotNull` |
| `activo` | Campo propio `Boolean`, `nullable=false`, default `true` en constructor | **No se expone** | No existe en el request (no se puede fijar por request; el mapper crea siempre una `Ubicacion` nueva vía `new Ubicacion()`, que arranca en `true`) |

Mapeo entidad↔DTO vive en `UbicacionMapper` (`src/main/java/pet_finder/mappers/UbicacionMapper.java`), que implementa `Mapper<UbicacionRequestDTO, UbicacionDetailDTO, Ubicacion>`:
- `aEntidad(UbicacionRequestDTO)`: crea `new Ubicacion()` y setea `direccion`, `altura`, `latitud`, `longitud` desde el request (`UbicacionMapper.java:19-25`). El `id` queda `null` (nueva entidad) y `activo` queda en `true` por el constructor de `Ubicacion`.
- `aDetail(Ubicacion)`: delega en el constructor auxiliar de `UbicacionDetailDTO` (`UbicacionMapper.java:29-32`).
- `deEntidadesAdetails(List<Ubicacion>)`: mapea una lista completa (`UbicacionMapper.java:35-40`). ⚠️ No se detectó ningún llamador de este método ni de `UbicacionService.listarTodas()` en ningún controller (no hay endpoint de listado de ubicaciones, consistente con que no hay controller propio).

No existe una clase `UbicacionRequestUpdateDTO` separada: la actualización de una `Publicacion` reutiliza el mismo `UbicacionRequestDTO` (`PublicacionRequestUpdateDTO.java:18`).

## D. Dónde aparece anidada

⚠️ **Hallazgo respecto del brief**: se buscó explícitamente un campo de tipo `Ubicacion` en `src/main/java/pet_finder/models/Miembro.java` (grep de `Ubicacion`/`ubicacion` sobre ese archivo, sobre `src/main/java/pet_finder/dtos/miembro/*` y sobre `src/main/java/pet_finder/dtos/auth/RegistroRequestDTO.java`) y **no se encontró ninguna coincidencia**. `Miembro.java` no declara ningún campo `Ubicacion`, `MiembroDetailDTO`/`MiembroRequestDTO` no incluyen `ubicacion` en su JSON, y `RegistroRequestDTO` tampoco. Una búsqueda global de `Ubicacion`/`ubicacion` en todo `src/main/java/pet_finder` (`Grep pattern="Ubicacion"`) devuelve únicamente 15 archivos, todos pertenecientes a los paquetes `services`, `mappers`, `exceptions`, `models` (solo `Publicacion.java`), `dtos/ubicacion` y `dtos/publicacion`, y `validations`. **`Publicacion` es el único punto de anidación confirmado por código.**

| DTO contenedor | Recurso | Campo(s) | Forma en el JSON | Cita |
|---|---|---|---|---|
| `PublicacionDetailDTO` | Publicación | `ubicacion` (string), `latitud`, `longitud` | **Aplanada / resumida**: no es un objeto `{ "ubicacion": {...} }` anidado, sino que los 3 campos de `UbicacionDetailDTO` se copian directamente como campos de primer nivel de `PublicacionDetailDTO` (`ubicacion.ubicacion()`, `ubicacion.latitud()`, `ubicacion.longitud()`) | `src/main/java/pet_finder/dtos/publicacion/PublicacionDetailDTO.java:26-28,51-53` |
| `PublicacionRequestDTO` | Publicación (alta) | `ubicacion` | **Objeto anidado completo**: `private UbicacionRequestDTO ubicacion;` con `@Valid`, serializado/deserializado como objeto JSON `{ "direccion": "...", "altura": ..., "latitud": ..., "longitud": ... }` bajo la clave `"ubicacion"` | `src/main/java/pet_finder/dtos/publicacion/PublicacionRequestDTO.java:16-17` |
| `PublicacionRequestUpdateDTO` | Publicación (modificación) | `ubicacion` | **Objeto anidado completo**, igual forma que en `PublicacionRequestDTO`; campo opcional (si es `null`, `PublicacionService.modificar` lo trata como "no se quiere modificar la ubicación", `PublicacionService.java:175,190-194`) | `src/main/java/pet_finder/dtos/publicacion/PublicacionRequestUpdateDTO.java:17-18` |

No hay ninguna otra aparición de `Ubicacion`/`UbicacionDetailDTO`/`UbicacionRequestDTO` en ningún otro DTO del proyecto (confirmado por el grep global citado arriba).

### Detalle de comportamiento en `Publicacion`

- La relación JPA es `@OneToOne(fetch = FetchType.EAGER, cascade = {CascadeType.PERSIST, CascadeType.MERGE})` sobre `Ubicacion ubicacion` en `Publicacion`, con comentario explícito en el código: *"fetch me permite recibir Ubicacion a la vez que obtengo PublicacionById"* y *"cascade me permite crear o modificar la Ubicacion mediante la Publicacion"* (`src/main/java/pet_finder/models/Publicacion.java:29-33`).
- Alta (`PublicacionService.guardar`, `PublicacionService.java:61-79`): el mapper crea la `Ubicacion` a partir del `UbicacionRequestDTO` anidado (`PublicacionMapper.aEntidad`, `PublicacionMapper.java:48`), y antes de guardar se valida geocodificación (`ubicacionValidation.validarGeocodificacion(...)`, `PublicacionService.java:72`). Gracias al `cascade` de la relación, guardar la `Publicacion` persiste también la `Ubicacion` nueva.
- Modificación (`PublicacionService.modificar`, `PublicacionService.java:164-199`): si viene `ubicacion` en el request y su contenido (`direccion`+`altura`) difiere del existente (`ubicacionValidation.contenidoIgualA`), se valida geocodificación de la nueva ubicación y se reemplaza la `Ubicacion` completa de la publicación (no se actualiza in-place, se crea una `Ubicacion` nueva vía `ubicacionMapper.aEntidad`).
- Baja lógica: `PublicacionService.eliminar` da de baja lógica también la `Ubicacion` asociada, llamando a `ubicacionService.eliminar(publicacion.getUbicacion().getId())` (`PublicacionService.java:236`), que a su vez usa `UbicacionValidation.esInactivo` para evitar dar de baja dos veces.
- `UbicacionService.obtenerPorIdPublicacion(Long id)` obtiene la `Ubicacion` a partir del `id` de una `Publicacion` (`UbicacionService.java:45-56`), pero no está expuesto por ningún controller propio; ⚠️ no se encontró ningún llamador de este método en el resto del código (`Grep` de `obtenerPorIdPublicacion` sin más resultados que su propia definición).

## E. Pendientes

- ⚠️ NO DETERMINADO: nullabilidad/longitud reales a nivel de columna SQL de `direccion`, `altura`, `latitud`, `longitud` — la entidad no usa `@Column` para esos campos, así que dependen del DDL real (no versionado en el repo como script SQL) o del default de Hibernate (`nullable=true` sin longitud fija).
- ⚠️ NO DETERMINADO: comportamiento exacto cuando `altura` es `null` en `UbicacionDetailDTO.ubicacion` (queda como `"<direccion> null"` por concatenación de Java) — no hay evidencia de que sea un caso manejado intencionalmente.
- ⚠️ NO DETERMINADO: no existe ningún endpoint HTTP que exponga `UbicacionService.listarTodas()`, `obtenerPorId()` u `obtenerPorIdPublicacion()` — toda la clase `UbicacionService` sólo se usa internamente desde `PublicacionService`.
- El campo `Miembro`/`RegistroRequestDTO` mencionados en el brief como "relación confirmada" con `Ubicacion` **no existen en el código actual** (ver hallazgo en sección D) — se documenta como discrepancia respecto de lo indicado en el encargo, no como relación real.
