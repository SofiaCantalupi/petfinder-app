import { Routes } from '@angular/router';
import { MuroPublicaciones } from './pages/muro-publicaciones/muro-publicaciones';
import { PublicacionFormComponent } from './pages/publicacion-form-component/publicacion-form-component';
import { PublicacionDetail } from './pages/publicacion-detail/publicacion-detail';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { MiPerfil } from './pages/mi-perfil/mi-perfil';
import { noAuthGuard } from './guards/no-auth-guard';
import { authGuard } from './guards/auth-guard';
import { YaLogeado } from './components/ya-logeado/ya-logeado';
import { GuiaEstilo } from './prueba/guia-estilo/guia-estilo';
import { PoliticasDeUso } from './pages/politicas-de-uso/politicas-de-uso';

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
    canActivate: [authGuard],
  },
  {
    path: 'publicaciones/:id/editar',
    component: PublicacionFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'miPerfil',
    component: MiPerfil,
    canActivate: [authGuard],
  },
  {
    path: 'yaLogeado',
    component: YaLogeado,
    canActivate: [authGuard],
  },
  {
    path: 'miPerfil',
    component: MiPerfil,
    canActivate: [authGuard],
  },
  {
    path: 'guia',
    component: GuiaEstilo,
    canActivate: [authGuard],
  },
  {
    path: 'normas',
    component: PoliticasDeUso,
  },
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
