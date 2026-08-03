import { Routes } from '@angular/router';
import { MuroPublicaciones } from './pages/muro-publicaciones/muro-publicaciones';
import { PublicacionFormComponent } from './pages/publicacion-form-component/publicacion-form-component';
import { PublicacionDetail } from './pages/publicacion-detail/publicacion-detail';
import { SolicitudFormComponent } from './pages/solicitud-form-component/solicitud-form-component';
import { ListadoSolicitudesAdopcion } from './pages/listado-solicitudes-adopcion/listado-solicitudes-adopcion';
import { SolicitudAdopcionDetail } from './pages/solicitud-adopcion-detail/solicitud-adopcion-detail';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { MiPerfil } from './pages/mi-perfil/mi-perfil';
import { noAuthGuard } from './guards/no-auth-guard';
import { authGuard } from './guards/auth-guard';
import { YaLogeado } from './components/ya-logeado/ya-logeado';
import { PoliticasDeUso } from './pages/politicas-de-uso/politicas-de-uso';
import { BorrarCuenta } from './components/borrar-cuenta/borrar-cuenta';
import { publicacionActivaGuard } from './guards/publicacion-inactiva-guard';
import { AdminUsuarios } from './pages/admin-usuarios/admin-usuarios';
import { adminGuard } from './guards/admin-guard';
import { noAdminGuard } from './guards/no-admin-guard';
import { GuiaEstilo } from './components/guia-estilo/guia-estilo';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
    canActivate: [noAuthGuard],
  },
  {
    path: 'registro',
    component: Registro,
    canActivate: [noAuthGuard],
  },
  {
    path: 'publicaciones',
    component: MuroPublicaciones,
    canActivate: [authGuard],
  },
  {
    path: 'publicaciones/crear',
    component: PublicacionFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'publicaciones/:id',
    component: PublicacionDetail,
    canActivate: [authGuard, publicacionActivaGuard],
  },
  {
    path: 'publicaciones/:id/editar',
    component: PublicacionFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'publicaciones/:idPublicacion/solicitud-adopcion',
    component: SolicitudFormComponent,
    canActivate: [authGuard, noAdminGuard],
  },
  {
    path: 'solicitudes-adopcion',
    component: ListadoSolicitudesAdopcion,
    canActivate: [authGuard],
  },
  {
    path: 'solicitudes-adopcion/:id',
    component: SolicitudAdopcionDetail,
    canActivate: [authGuard],
  },
  {
    path: 'perfil',
    component: MiPerfil,
    canActivate: [authGuard],
  },
  {
    path: 'yaLogeado',
    component: YaLogeado,
    canActivate: [authGuard],
  },
  {
    path: 'admin/usuarios',
    component: AdminUsuarios,
    canActivate: [adminGuard],
  },
  {
    path: 'normas',
    component: PoliticasDeUso,
  },
  {
    path: 'borrarCuenta',
    component: BorrarCuenta,
    canActivate: [authGuard],
  },
  {
    path: 'guia-estilo',
    component: GuiaEstilo,
  },
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
