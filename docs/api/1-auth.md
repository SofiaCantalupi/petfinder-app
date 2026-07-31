# 1 — Auth

Ver `docs/api/00-base.md` para: formato transversal de errores, autenticación por header `Authorization: Bearer`, tabla maestra de enums y notas generales sobre el patrón request/response. Este documento es autocontenido para las tablas propias del recurso `auth`.

Controller: `pet_finder.config.AuthController`, ruta base `/auth` (`src/main/java/pet_finder/config/AuthController.java:16-17`). **Ojo**: vive en el paquete `config`, no en `controllers`. No existe una entidad "Auth" separada: los tres endpoints operan sobre la entidad `Miembro`.

## A. Entidad

`Miembro` (`src/main/java/pet_finder/models/Miembro.java:8`) — entidad completa documentada en `2-miembros.md`. Campos relevantes a autenticación:

| Campo Java | Tipo | Columna / constraint | Cita |
|---|---|---|---|
| `email` | `String` | `nullable=false, unique=true` | `Miembro.java:20-21` |
| `contrasenia` | `String` | `nullable=false, length=100` (hash BCrypt, ver sección C) | `Miembro.java:23-24` |
| `rolUsuario` | `RolUsuario` (`@Enumerated(EnumType.STRING)`) | `nullable=false` | `Miembro.java:26-28` |
| `activo` | `boolean` | `nullable=false` | `Miembro.java:30-31` |

`RolUsuario` tiene sólo dos constantes, `MIEMBRO` y `ADMINISTRADOR` (`src/main/java/pet_finder/enums/RolUsuario.java:5-6`), sin `valorFront`: se serializa siempre con `.name()`.

## B. DTOs

| DTO | Tipo Java | Usado en | Archivo |
|---|---|---|---|
| `LoginRequestDTO` | `record` | Request de `POST /auth/login` | `src/main/java/pet_finder/dtos/auth/LoginRequestDTO.java` |
| `RegistroRequestDTO` | `class` | Request de `POST /auth/registro` | `src/main/java/pet_finder/dtos/auth/RegistroRequestDTO.java` |
| `AuthResponseDTO` | `record` | Response de `POST /auth/login` | `src/main/java/pet_finder/dtos/auth/AuthResponseDTO.java` |
| `CambiarContraseniaDTO` | `class` | Request de `PUT /auth/cambiar-contrasenia` | `src/main/java/pet_finder/dtos/auth/CambiarContraseniaDTO.java` |
| `MiembroDetailDTO` | `record` | Response de `POST /auth/registro` (mismo DTO que usa el recurso `miembros`, ver `2-miembros.md`) | `src/main/java/pet_finder/dtos/miembro/MiembroDetailDTO.java` |

⚠️ **Hallazgo relevante para el frontend**: `RegistroRequestDTO` **no** tiene un campo `Ubicacion` anidado. El registro sólo pide `nombre`, `apellido`, `email`, `contrasenia` (`RegistroRequestDTO.java:9-21`). No hay forma de mandar ubicación al registrarse.

### B.1 `LoginRequestDTO` (record)

| Campo JSON | Tipo | Validación Bean Validation | Cita |
|---|---|---|---|
| `email` | `String` | `@NotBlank(message="El email es obligatorio")`, `@Email` | `LoginRequestDTO.java:7` |
| `contrasenia` | `String` | `@NotBlank(message="La contraseña es obligatoria")` | `LoginRequestDTO.java:8` |

### B.2 `RegistroRequestDTO` (class)

| Campo JSON | Tipo | Validación Bean Validation | Setter existe | Cita |
|---|---|---|---|---|
| `nombre` | `String` | `@NotBlank(message="El nombre es obligatorio")` | Sí (`setNombre`) | `RegistroRequestDTO.java:9-10,27-29` |
| `apellido` | `String` | `@NotBlank(message="El apellido es obligatorio")` | **No** (sólo `getApellido`, sin `setApellido`) | `RegistroRequestDTO.java:12-13,32-34` |
| `email` | `String` | `@Email(message="El correo electronico es invalido")`, `@NotBlank(message="El correo electronico es obligatorio")` | Sí (`setEmail`) | `RegistroRequestDTO.java:15-17,36-41` |
| `contrasenia` | `String` | `@NotBlank(message="La contraseña es obligatoria")`, `@Size(min=6, max=15, message="La contraseña debe tener entre 6 y 15 caracteres")` | **No** (sólo `getContrasenia`, sin `setContrasenia`) | `RegistroRequestDTO.java:19-21,43-45` |

⚠️ **Hallazgo de código, no verificado en runtime**: los campos `apellido` y `contrasenia` de `RegistroRequestDTO` son `private` y la clase **no declara ningún método `setApellido`/`setContrasenia`** (archivo completo leído, `RegistroRequestDTO.java:1-47`). Jackson, por configuración por defecto de Spring Boot (sin overrides encontrados — ver "Configuración de Jackson" en `00-base.md`), sólo auto-detecta setters (`ANY` visibilidad) o campos `public` para deserializar; no hay ninguno de los dos para estos dos campos. Esto sugiere que, tal como está el código, esos dos campos podrían no completarse al deserializar el JSON del request. ⚠️ NO DETERMINADO: no se ejecutó la aplicación para confirmar el comportamiento real en runtime; se documenta como hallazgo de código para que se verifique empíricamente contra el backend real antes de asumir que el registro funciona con estos campos.
El mismo patrón (getters sin setters) se repite en `MiembroRequestDTO` (`src/main/java/pet_finder/dtos/miembro/MiembroRequestDTO.java:24-38`, ningún setter en toda la clase), por lo que no parece un error puntual sino un patrón del proyecto.

### B.3 `AuthResponseDTO` (record) — response de login

| Campo JSON | Tipo | Origen del valor | Cita |
|---|---|---|---|
| `token` | `String` | JWT generado por `JwtService.generateToken` | `AuthResponseDTO.java:3`, `AuthService.java:80,82` |
| `id` | `long` | `miembro.getId()` | `AuthService.java:82` |
| `nombre` | `String` | `miembro.getNombre()` | `AuthService.java:82` |
| `apellido` | `String` | `miembro.getApellido()` | `AuthService.java:82` |
| `rol` | `String` | `miembro.getRol().name()` (no hay `valorFront` en `RolUsuario`) | `AuthService.java:82` |

### B.4 `CambiarContraseniaDTO` (class)

| Campo JSON | Tipo | Validación Bean Validation | Setter existe | Cita |
|---|---|---|---|---|
| `contraseniaVieja` | `String` | `@NotBlank(message="La contraseña actual es obligatoria")` | **No** (sólo `getContraseniaVieja`) | `CambiarContraseniaDTO.java:7-8,14-16` |
| `nuevaContrasenia` | `String` | `@NotBlank(message="La contraseña nueva es obligatoria")` | **No** (sólo `getNuevaContrasenia`) | `CambiarContraseniaDTO.java:10-11,18-20` |

Mismo hallazgo que en B.2: ningún campo de esta clase tiene setter (archivo completo, `CambiarContraseniaDTO.java:1-23`). Mismo caveat: no verificado en runtime.

### B.5 `MiembroDetailDTO` (record) — response de registro

Definido en `src/main/java/pet_finder/dtos/miembro/MiembroDetailDTO.java:5`, documentado en detalle en `2-miembros.md` (recurso `miembros`). Construido a partir de la entidad `Miembro` en su constructor propio:

| Campo JSON | Tipo serializado | Origen / transformación | Cita |
|---|---|---|---|
| `id` | `Long` | `miembro.getId()` | `MiembroDetailDTO.java:9` |
| `nombre` | `String` | `miembro.getNombre()` | `MiembroDetailDTO.java:10` |
| `apellido` | `String` | `miembro.getApellido()` | `MiembroDetailDTO.java:11` |
| `email` | `String` | `miembro.getEmail()` | `MiembroDetailDTO.java:12` |
| `rol` | `String` | `miembro.getRol().name()` (transformación en el constructor del record; `RolUsuario` no tiene `valorFront`) | `MiembroDetailDTO.java:13` |
| `activo` | `boolean` | `miembro.isActivo()` | `MiembroDetailDTO.java:14` |

## C. Delta entidad ↔ DTO

- **`contrasenia` es write-only respecto al cliente**: se recibe en texto plano en `RegistroRequestDTO.contrasenia` y en `CambiarContraseniaDTO.{contraseniaVieja,nuevaContrasenia}`, pero **nunca** se devuelve en ninguna response de este recurso (`MiembroDetailDTO` no tiene campo `contrasenia`, `AuthResponseDTO` tampoco). Antes de guardarse en la base, `AuthService` la cifra con `passwordEncoder.encode(...)` (BCrypt, bean definido en `SecurityConfig.java:75-77`) — `AuthService.java:54` (registro) y `AuthService.java:102` (cambio de contraseña).
- **`rolUsuario` no es seteable por el cliente en el registro**: `AuthService.registrar` fuerza siempre `RolUsuario.MIEMBRO`, ignorando cualquier intento del cliente de mandar otro rol (de hecho `RegistroRequestDTO` ni siquiera tiene ese campo) — `AuthService.java:46`.
- **`activo` no es seteable por el cliente**: se fuerza siempre a `true` en el registro — `AuthService.java:47`.
- **Login no devuelve el `Miembro`/`MiembroDetailDTO` completo**, sino un `AuthResponseDTO` reducido: `token`, `id`, `nombre`, `apellido`, `rol` — no incluye `email` ni `activo` (`AuthResponseDTO.java:3`).
- **Registro sí devuelve el `Miembro` completo** vía `MiembroDetailDTO`, incluyendo `activo`, pero sin `token` (el cliente debe loguearse aparte después de registrarse para obtener uno) — `AuthController.java:28-32`.
- **`cambiar-contrasenia` no devuelve ningún dato del miembro**, sólo un `String` de confirmación en texto plano (no JSON) — ver sección D.3.

## D. Endpoints

### D.1 `POST /auth/registro`

| Aspecto | Detalle |
|---|---|
| URL final | `POST /auth/registro` |
| Path/query params | Ninguno |
| Seguridad | Público (`permitAll`, `SecurityConfig.java:53`) |
| Consumes | `application/json`, body `RegistroRequestDTO`, validado con `@Valid` | 
| Cita controller | `AuthController.java:27-32` |
| Response body | `MiembroDetailDTO` (JSON, ver B.5) |
| Status éxito | **201 Created** (`HttpStatus.CREATED`, `AuthController.java:31`) |

Lógica de negocio en `AuthService.registrar` (`AuthService.java:36-60`), no usa el mapper (comentario explícito en el código, línea 40):
1. Rol forzado a `MIEMBRO`, `activo` forzado a `true` (líneas 46-47).
2. `MiembroValidation.validarNombre`: exige que `nombre` **y** `apellido` cumplan el regex `^[A-Za-zñÑáéíóúÁÉÍÓÚ ]{3,15}$` (letras con tildes/ñ y espacios, 3 a 15 caracteres) — si no, `FormatoInvalidoException` → 400 (`MiembroValidation.java:18-24`).
3. `MiembroValidation.validarContrasenia`: exige el regex `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,15}$` (mínimo 1 minúscula, 1 mayúscula, 1 dígito, 1 carácter especial, 6-15 caracteres), **antes** de encriptar — si no, `FormatoInvalidoException` → 400 (`MiembroValidation.java:26-32`). Esto es más estricto que el `@Size(min=6,max=15)` de Bean Validation del DTO.
4. `MiembroValidation.validarEmailRegistrado`: si ya existe un miembro con ese email, `EmailYaRegistradoException` → 409 (`MiembroValidation.java:35-40`).
5. Recién ahí se encripta la contraseña con BCrypt y se persiste.

Errores posibles (formato general en `00-base.md`):

| Status | Causa | Excepción |
|---|---|---|
| 400 | Falla `@Valid` (campos vacíos/formato de email inválido/tamaño de contraseña) | `MethodArgumentNotValidException` |
| 400 | `nombre`/`apellido` no cumple el regex de formato | `FormatoInvalidoException` |
| 400 | `contrasenia` no cumple el regex de complejidad | `FormatoInvalidoException` |
| 409 | Email ya registrado | `EmailYaRegistradoException` |

Ejemplo request:
```json
{
  "nombre": "Sofia",
  "apellido": "Cantalupi",
  "email": "sofia@example.com",
  "contrasenia": "Abcdef1!"
}
```

Ejemplo response (201):
```json
{
  "id": 7,
  "nombre": "Sofia",
  "apellido": "Cantalupi",
  "email": "sofia@example.com",
  "rol": "MIEMBRO",
  "activo": true
}
```

### D.2 `POST /auth/login`

| Aspecto | Detalle |
|---|---|
| URL final | `POST /auth/login` |
| Path/query params | Ninguno |
| Seguridad | Público (`permitAll`, `SecurityConfig.java:53`) |
| Consumes | `application/json`, body `LoginRequestDTO`, validado con `@Valid` |
| Cita controller | `AuthController.java:35-41` |
| Response body | `AuthResponseDTO` (JSON, ver B.3) |
| Status éxito | **200 OK** (`ResponseEntity.ok(...)`, `AuthController.java:40`) |

Lógica de negocio en `AuthService.logIn` (`AuthService.java:62-83`):
1. Busca `Miembro` por `email` — si no existe: `UsuarioNoEncontradoException` → 404 (mensaje `"No se encontró un miembro con ese email"`, línea 66).
2. Verifica que `miembro.activo` sea `true` — si no: `MiembroInactivoException` → 400 (`MiembroValidation.esInactivo`, línea 69).
3. Verifica la contraseña con `passwordEncoder.matches(request.contrasenia(), miembro.getContrasenia())` — si no coincide: `FormatoInvalidoException` → 400, mensaje `"La contraseña no es válida"` (líneas 72-74).
4. Genera el JWT con `JwtService.generateToken`: `subject` = email del miembro, `issuedAt` = ahora, `expiration` = ahora + 1 hora (**hardcodeado**, `1000 * 60 * 60` ms, `JwtService.java:43`), firmado con `HS256` y una clave leída de la property `jwt.secret` (variable de entorno, `JwtService.java:22-29`). No lleva claims adicionales (usa `generateToken`, no `generarTokenConClaims`) — el único claim propio del JWT es el `subject` (email).

Errores posibles:

| Status | Causa | Excepción |
|---|---|---|
| 400 | Falla `@Valid` (email inválido / campos vacíos) | `MethodArgumentNotValidException` |
| 404 | No existe miembro con ese email | `UsuarioNoEncontradoException` |
| 400 | Miembro inactivo (baja lógica) | `MiembroInactivoException` |
| 400 | Contraseña incorrecta | `FormatoInvalidoException` |

Ejemplo request:
```json
{
  "email": "sofia@example.com",
  "contrasenia": "Abcdef1!"
}
```

Ejemplo response (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzb2ZpYUBleGFtcGxlLmNvbSIsImlhdCI6MTc1...",
  "id": 7,
  "nombre": "Sofia",
  "apellido": "Cantalupi",
  "rol": "MIEMBRO"
}
```

### D.3 `PUT /auth/cambiar-contrasenia`

| Aspecto | Detalle |
|---|---|
| URL final | `PUT /auth/cambiar-contrasenia` |
| Path/query params | Ninguno. El miembro afectado es el autenticado, se toma del token vía `@AuthenticationPrincipal MiembroUserDetails` (no hay `id` en la URL ni en el body) |
| Seguridad | Requiere token válido; `@PreAuthorize("hasAnyRole('ADMINISTRADOR', 'MIEMBRO')")` — en la práctica, cualquier usuario autenticado (son los dos únicos roles existentes) | 
| Cita controller | `AuthController.java:43-47` |
| Consumes | `application/json`, body `CambiarContraseniaDTO`, validado con `@Valid` |
| Response body | ⚠️ **`ResponseEntity<String>` — texto plano, NO es JSON estructurado** |
| Status éxito | **200 OK** (`ResponseEntity.ok(...)`, `AuthController.java:46`) |

Lógica de negocio en `AuthService.cambiarContrasenia` (`AuthService.java:85-108`):
1. Busca `Miembro` por `id` (el del token) — si no existe: `UsuarioNoEncontradoException` → 404 (línea 89; improbable con token válido).
2. Verifica `contraseniaVieja` contra el hash guardado con `passwordEncoder.matches` — si no coincide: `FormatoInvalidoException` → 400, mensaje `"La contraseña actual no coincide con la ingresada."` (líneas 93-95).
3. Aplica `nuevaContrasenia` sin cifrar temporalmente al objeto `Miembro` y la valida con el mismo regex de complejidad que en el registro (`MiembroValidation.validarContrasenia`) — si no cumple: `FormatoInvalidoException` → 400 (línea 99).
4. Cifra la nueva contraseña con BCrypt y guarda.
5. Devuelve el string literal `"La contraseña se ha cambiado con éxito."` (línea 107).

Errores posibles:

| Status | Causa | Excepción |
|---|---|---|
| 400 | Falla `@Valid` (campos vacíos) | `MethodArgumentNotValidException` |
| 404 | Miembro del token no encontrado | `UsuarioNoEncontradoException` |
| 400 | `contraseniaVieja` no coincide con la actual | `FormatoInvalidoException` |
| 400 | `nuevaContrasenia` no cumple el regex de complejidad | `FormatoInvalidoException` |
| 401/403 | Sin token, token inválido/expirado, o rol no reconocido | No pasa por `GlobalHandlerException` — formato ⚠️ NO DETERMINADO, ver `00-base.md` |

Ejemplo request:
```json
{
  "contraseniaVieja": "Abcdef1!",
  "nuevaContrasenia": "Ghijkl2@"
}
```

Ejemplo response (200) — **texto plano**, no JSON:
```
La contraseña se ha cambiado con éxito.
```

## E. Pendientes

- ⚠️ NO DETERMINADO (no verificado en runtime): si `RegistroRequestDTO.apellido`, `RegistroRequestDTO.contrasenia`, `CambiarContraseniaDTO.contraseniaVieja` y `CambiarContraseniaDTO.nuevaContrasenia` — todos sin setter — se deserializan correctamente desde el JSON del request bajo la configuración por defecto de Jackson usada en este proyecto (sin overrides de visibilidad encontrados). Recomendado probar empíricamente contra el backend levantado antes de integrar.
- ⚠️ NO DETERMINADO: formato exacto de las respuestas 401 (token ausente/inválido/expirado) y 403 (`@PreAuthorize` rechazado) para `PUT /auth/cambiar-contrasenia`, porque no hay `AuthenticationEntryPoint`/`AccessDeniedHandler` propios en el repo (ver `00-base.md`, sección "Autenticación y autorización").
- ⚠️ NO DETERMINADO: expiración del JWT es fija en 1 hora, hardcodeada en código (`JwtService.java:43`); no hay endpoint de refresh token en `AuthController`.
- `RegistroRequestDTO` no incluye `Ubicacion` ni ningún otro campo más allá de `nombre`, `apellido`, `email`, `contrasenia` — confirmado leyendo el archivo completo (`RegistroRequestDTO.java:1-47`), contradice cualquier expectativa de que el registro incluya ubicación.
- El value real que toma `jwt.secret` (variable de entorno `JWT_SECRET` según el comentario en `JwtService.java:25`) no está en el repo — depende del entorno de cada desarrollador/despliegue.
