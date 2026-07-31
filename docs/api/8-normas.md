# 8 — Normas de comunidad

> Formatos transversales (auth, estructura de errores, Jackson, paginación, wrapper de respuesta) están documentados en `docs/api/00-base.md`. Esta ficha es autocontenida para lo específico de este recurso.

Controller: `pet_finder.controllers.NormaComunidadController`, ruta base `/normas` (`src/main/java/pet_finder/controllers/NormaComunidadController.java:16`).

## A. Entidad

`pet_finder.models.NormaComunidad` (`src/main/java/pet_finder/models/NormaComunidad.java:5-34`), mapeada a la tabla `normas` (`NormaComunidad.java:6`).

| Campo | Tipo Java | Anotaciones JPA | Cita |
|---|---|---|---|
| `id` | `Long` | `@Id`, `@GeneratedValue(strategy = GenerationType.IDENTITY)` | `NormaComunidad.java:9-11` |
| `texto` | `String` | `@Column(nullable = false)` | `NormaComunidad.java:13-14` |

No hay ningún otro campo (sin fechas de auditoría, sin relaciones `@ManyToOne`/`@OneToMany`, sin enum propio). La entidad tiene únicamente constructor vacío y getters/setters (`NormaComunidad.java:16-33`).

## B. DTOs

### `NormaComunidadDetailDTO` (response)

`record` en `src/main/java/pet_finder/dtos/norma/NormaComunidadDetailDTO.java:5-9`:

```java
public record NormaComunidadDetailDTO (Long id, String texto) {
    public NormaComunidadDetailDTO (NormaComunidad norma){
        this(norma.getId(), norma.getTexto());
    }
}
```

| Campo JSON | Tipo | Cita |
|---|---|---|
| `id` | `Long` (número) | `NormaComunidadDetailDTO.java:5` |
| `texto` | `String` | `NormaComunidadDetailDTO.java:5` |

Al ser un `record` sin anotaciones Jackson especiales, se serializa con los nombres de los componentes del record tal cual (`id`, `texto`).

### `NormaComunidadRequestDTO` (request)

Clase en `src/main/java/pet_finder/dtos/norma/NormaComunidadRequestDTO.java:5-18`:

| Campo JSON | Tipo | Validación | Cita |
|---|---|---|---|
| `texto` | `String` | `@NotBlank(message = "Debe ingresar una norma.")` | `NormaComunidadRequestDTO.java:7-8` |

Es un campo `final`, sin setter — se llena únicamente vía el constructor `NormaComunidadRequestDTO(String texto)` (`NormaComunidadRequestDTO.java:10-12`), que Jackson usa para deserializar (no hay `@JsonCreator` explícito, pero es el único constructor).

## C. Delta entidad ↔ DTO

- **No existe `NormaComunidadMapper`**: se confirmó buscando en todo el repo (`Glob **/NormaComunidad*` y `Grep NormaComunidad`) — solo existen `NormaComunidad.java` (modelo), `NormaComunidadRepository.java`, `NormaComunidadDetailDTO.java`, `NormaComunidadRequestDTO.java`, `NormaComunidadService.java` y `NormaComunidadController.java`. No hay ningún archivo `NormaComunidadMapper.java` ni `NormaComunidadValidation.java`.
- **Entidad → DTO**: se hace mediante el constructor del propio record `NormaComunidadDetailDTO(NormaComunidad norma)`, que copia `id` y `texto` (`NormaComunidadDetailDTO.java:6-8`). Se usa tanto en el listado (`NormaComunidadService.java:22`, dentro de un `.map(NormaComunidadDetailDTO::new)`) como en la creación (`NormaComunidadService.java:27`).
- **DTO (request) → Entidad**: es manual, directamente en el controller, no en el service ni en un mapper. En `NormaComunidadController.crear()` se instancia una `NormaComunidad` nueva con `new NormaComunidad()` y se le setea el texto con `norma.setTexto(request.getTexto())` (`NormaComunidadController.java:40-41`); recién después esa entidad se pasa a `service.crear(norma)`.
- No hay ningún enum involucrado en este recurso — ni en la entidad ni en los DTOs (confirmado por inspección de ambos archivos; `NormaComunidad` solo tiene `id` y `texto`, ambos sin enum).
- No hay validación dedicada (`NormaComunidadValidation.java` no existe): la única validación es la anotación Bean Validation `@NotBlank` en el DTO de request, disparada por `@Valid` en el controller (`NormaComunidadController.java:38`).

## D. Endpoints

### 1. `GET /normas` — listar

- **URL final**: `GET /normas`
- **Path/query params**: ninguno.
- **Request body**: ninguno.
- **Seguridad**: `@PreAuthorize("hasAnyRole('ADMINISTRADOR', 'MIEMBRO')")` (`NormaComunidadController.java:24`).
- **Lógica del service**: `verNormas()` trae todas las normas de la tabla (`repository.findAll()`, sin filtro, sin orden explícito) y las mapea a `NormaComunidadDetailDTO` (`NormaComunidadService.java:19-24`).
- **Status de éxito real**:
  - **200 OK** con `List<NormaComunidadDetailDTO>` en el body, si hay al menos una norma (`NormaComunidadController.java:33`).
  - **204 No Content** (sin body) si la lista está vacía — regla de negocio explícita del controller: `if(normas.isEmpty()){ return ResponseEntity.noContent().build(); }` (`NormaComunidadController.java:29-31`). Esto difiere del patrón de otros recursos que devuelven `200` con lista vacía; acá el controller decide explícitamente devolver `204`.
- **Errores**: no hay manejo de excepciones propio de este endpoint; solo aplican los genéricos de `GlobalHandlerException` (ver `00-base.md`), aunque en la práctica un `findAll()` no debería lanzar excepciones de negocio.
- **Ejemplo de response (200)**:
```json
[
  {
    "id": 1,
    "texto": "No se permite maltrato animal."
  },
  {
    "id": 2,
    "texto": "Las publicaciones deben incluir una foto real de la mascota."
  }
]
```
- **Ejemplo de response (204)**: sin body.

### 2. `POST /normas` — crear

- **URL final**: `POST /normas`
- **Path/query params**: ninguno.
- **Request body** (`@Valid @RequestBody NormaComunidadRequestDTO`, `NormaComunidadController.java:38`), `Content-Type: application/json` (consumes implícito de `@RequestBody`):
```json
{
  "texto": "No se permite maltrato animal."
}
```
- **Validación**: `texto` no puede ser blank (`@NotBlank`, mensaje `"Debe ingresar una norma."`) — si falla, dispara `MethodArgumentNotValidException` → **400 Bad Request** con el formato de mapa campo→mensaje descripto en `00-base.md` (`GlobalHandlerException.java:31-45`).
- **Seguridad**: `@PreAuthorize("hasRole('ADMINISTRADOR')")` (`NormaComunidadController.java:37`) — a diferencia de `GET`, solo `ADMINISTRADOR` puede crear.
- **Lógica del controller/service**: el controller arma la entidad manualmente (`new NormaComunidad()` + `setTexto`), y el service simplemente persiste y mapea de vuelta (`repository.save(norma)` → `new NormaComunidadDetailDTO(...)`, `NormaComunidadService.java:26-28`). No hay reglas de negocio adicionales (no valida duplicados, no normaliza texto, etc.).
- **Status de éxito real**: **201 Created**, verificado explícitamente en código: `ResponseEntity.status(HttpStatus.CREATED).body(creada)` (`NormaComunidadController.java:46`).
- **Response body**: `NormaComunidadDetailDTO` de la norma recién creada (con `id` generado por la base).
- **Errores**: 400 por validación fallida (arriba); genéricos de `GlobalHandlerException` para el resto (`00-base.md`); 401/403 de Spring Security si falta token o el rol no es `ADMINISTRADOR` (formato ⚠️ NO DETERMINADO, ver `00-base.md`).
- **Ejemplo de response (201)**:
```json
{
  "id": 3,
  "texto": "No se permite maltrato animal."
}
```

No hay más endpoints en `NormaComunidadController` — el archivo completo tiene solo estos dos métodos (`NormaComunidadController.java:1-48`). No existen endpoints de `PUT`/`PATCH`/`DELETE` para normas en el repo.

## E. Pendientes

- ⚠️ NO DETERMINADO: el formato exacto de las respuestas 401/403 de Spring Security (token ausente/inválido, o rol insuficiente en `@PreAuthorize`) — no pasan por `GlobalHandlerException` (ver detalle en `00-base.md`, sección "Autenticación y autorización").
- ⚠️ NO DETERMINADO: no hay endpoint para editar o eliminar una norma existente ni para obtener una norma puntual por `id` — el recurso solo soporta listar todas y crear una nueva. Si el frontend necesita editar/borrar normas, esa funcionalidad no existe actualmente en el backend.
- ⚠️ NO DETERMINADO: no hay control de duplicados de `texto` a nivel de base de datos ni de service (no hay `unique` en la columna ni chequeo en `crear()`), por lo que se pueden crear dos normas con el mismo texto.
