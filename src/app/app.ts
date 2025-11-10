import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GuiaEstilo } from './prueba/guia-estilo/guia-estilo';
import { Header } from './components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GuiaEstilo, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('petfinder-app');
}
