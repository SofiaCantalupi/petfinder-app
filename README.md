# PetfinderApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.5.

## Configuración de entorno

Antes de levantar el proyecto, crear el archivo `src/.env` (ignorado por git) con la URL del backend:

```
BACKEND_API_URL=http://localhost:8080
```

Este archivo lo usa `mynode.js` para generar `src/environments/environment.development.ts` en cada `npm start`.
Sin `src/.env`, `BACKEND_API_URL` queda como el string literal `"undefined"` (no como `undefined`) y los
requests al backend fallan contra una URL rota (`undefined/auth`, etc.).

El backend (Spring Boot) sólo permite CORS desde `http://localhost:4200`, `http://localhost:5500` y
`http://127.0.0.1:5500` — hay que servir el frontend en el puerto 4200 (el default de `ng serve`).

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
