import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { GuiaEstilo } from './prueba/guia-estilo/guia-estilo';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, GuiaEstilo],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('petfinder-app');
}
