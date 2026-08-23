import { Routes } from '@angular/router';
import { noAuthGuard } from './guards/no-auth-guard';
import { authGuard } from './guards/auth-guard';
import { publicacionActivaGuard } from './guards/publicacion-inactiva-guard';
import { adminGuard } from './guards/admin-guard';
import { noAdminGuard } from './guards/no-admin-guard';
import { RedirectFunction } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth-service';

// Todas las rutas se cargan con loadComponent y no con component: importarlas arriba las mete a
// todas en el bundle inicial, y con eso el usuario que abre el login se baja igual leaflet,
// swiper, ng-select y las animaciones del muro. Los guards si quedan estaticos:
// el router las necesita para armar la configuracion.

//Se usa para verificar si el usuario está logeado y redirigirlo a la página de publicaciones o al login según corresponda
const homeOrLoginRedirect: RedirectFunction = () => {
  const authService = inject(AuthService);
  return authService.estaLogeado() ? '/publicaciones' : '/login';
};

export const routes: Routes = [
  {
    path: '',
    redirectTo: homeOrLoginRedirect,
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    canActivate: [noAuthGuard],
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
    canActivate: [noAuthGuard],
  },
  {
    path: 'publicaciones',
    loadComponent: () =>
      import('./pages/muro-publicaciones/muro-publicaciones').then((m) => m.MuroPublicaciones),
    canActivate: [authGuard],
  },
  {
    // crear y editar comparten componente: esbuild emite un solo chunk para los dos
    path: 'publicaciones/crear',
    loadComponent: () =>
      import('./pages/publicacion-form-component/publicacion-form-component').then(
        (m) => m.PublicacionFormComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'publicaciones/:id',
    loadComponent: () =>
      import('./pages/publicacion-detail/publicacion-detail').then((m) => m.PublicacionDetail),
    canActivate: [authGuard, publicacionActivaGuard],
  },
  {
    path: 'publicaciones/:id/editar',
    loadComponent: () =>
      import('./pages/publicacion-form-component/publicacion-form-component').then(
        (m) => m.PublicacionFormComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'publicaciones/:idPublicacion/solicitud-adopcion',
    loadComponent: () =>
      import('./pages/solicitud-form-component/solicitud-form-component').then(
        (m) => m.SolicitudFormComponent,
      ),
    canActivate: [authGuard, noAdminGuard],
  },
  {
    path: 'solicitudes-adopcion',
    loadComponent: () =>
      import('./pages/listado-solicitudes-adopcion/listado-solicitudes-adopcion').then(
        (m) => m.ListadoSolicitudesAdopcion,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'solicitudes-adopcion/:id',
    loadComponent: () =>
      import('./pages/solicitud-adopcion-detail/solicitud-adopcion-detail').then(
        (m) => m.SolicitudAdopcionDetail,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'mensajes',
    loadComponent: () => import('./pages/mensajeria/mensajeria').then((m) => m.Mensajeria),
    canActivate: [authGuard, noAdminGuard],
  },
  {
    path: 'notificaciones',
    loadComponent: () =>
      import('./pages/notificaciones/notificaciones').then((m) => m.Notificaciones),
    canActivate: [authGuard],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
    canActivate: [authGuard],
  },
  {
    path: 'yaLogeado',
    loadComponent: () => import('./components/ya-logeado/ya-logeado').then((m) => m.YaLogeado),
    canActivate: [authGuard],
  },
  {
    path: 'admin/usuarios',
    loadComponent: () =>
      import('./pages/admin-usuarios/admin-usuarios').then((m) => m.AdminUsuarios),
    canActivate: [adminGuard],
  },
  {
    path: 'normas',
    loadComponent: () =>
      import('./pages/politicas-de-uso/politicas-de-uso').then((m) => m.PoliticasDeUso),
  },
  {
    path: 'borrarCuenta',
    loadComponent: () =>
      import('./components/borrar-cuenta/borrar-cuenta').then((m) => m.BorrarCuenta),
    canActivate: [authGuard],
  },
  {
    path: 'guia-estilo',
    loadComponent: () => import('./components/guia-estilo/guia-estilo').then((m) => m.GuiaEstilo),
  },
  {
    path: '**',
    redirectTo: homeOrLoginRedirect,
    pathMatch: 'full',
  },
];
