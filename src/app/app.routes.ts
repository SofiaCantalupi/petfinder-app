import { Routes } from '@angular/router';
import { MuroPublicaciones } from './pages/muro-publicaciones/muro-publicaciones';
import { PublicacionFormComponent } from './pages/publicacion-form-component/publicacion-form-component';
import { PublicacionDetail } from './pages/publicacion-detail/publicacion-detail';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'publicaciones/crear',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
  },
      {
    path: 'registro',
    component: Registro,
  },
  {
    path: 'publicaciones',
    component: MuroPublicaciones,
  },
  {
    path: 'publicaciones/crear',
    component: PublicacionFormComponent,
  },
  {
    path: 'publicaciones/:id',
    component: PublicacionDetail,
  },
  {
    path: 'publicaciones/:id/editar',
    component: PublicacionFormComponent,
  },

  
];
