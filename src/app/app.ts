import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MuroPublicaciones } from './pages/muro-publicaciones/muro-publicaciones';
import { PublicacionFormComponent } from './pages/publicacion-form-component/publicacion-form-component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('petfinder-app');
}
