import { Component, OnInit, input, effect, inject } from '@angular/core';
import * as L from 'leaflet';
import { Publicacion } from '../../models/publicacion';
import { formatUbicacion } from '../../utils';
import { Router } from '@angular/router';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements OnInit {
  private router = inject(Router);
  map!: L.Map;
  private layerGroup!: L.LayerGroup;

  publicaciones = input.required<Publicacion[] | null>();

  constructor() {
    // Usa effect para reaccionar cuando publicacion cambie
    effect(() => {
      this.clearMarkers();
      console.log(this.publicaciones)
      if (this.publicaciones()?.length !== 0 && this.map) {
        this.publicaciones()?.forEach((pub, _, lista) => {
          this.addMarker(Number(pub.latitud), Number(pub.longitud), pub);
          if (lista.length === 1) {
            // Centra el mapa en la ubicación de la publicación
            this.map.setView([Number(pub.latitud), Number(pub.longitud)], 15);
          }
        });
      }
    });
  }

  ngOnInit(): void {
    this.initMap();
  }

  initMap() {
    this.map = L.map('map-leaflet').setView([-38.0055, -57.5426], 13); // configura la vista del mapa en Mar del Plata

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    this.layerGroup = L.layerGroup().addTo(this.map);
  }

  // metodo para agregar marcadores en el mapa
  addMarker(lat: number, lng: number, publicacion: Publicacion) {
    const icon = L.divIcon({
      className: 'circular-icon',
      html: `<div class='circle-image' style="background-image: url('${publicacion.urlFoto}')"></div>`,
      iconSize: [60, 60],
      iconAnchor: [30, 30],
    });

    const marker = L.marker([lat, lng], { icon })
      .addTo(this.layerGroup)
      .bindPopup(
        `<strong>${publicacion.nombreMascota || 'Sin nombre'}</strong><br>${formatUbicacion(
          publicacion.ubicacion || ''
        )}<br>${publicacion.tipoMascota}<br><em>Estado: ${publicacion.estadoMascota}</em>`
      );
    marker.on('mouseover', () => marker.openPopup());
    marker.on('mouseout', () => marker.closePopup());
    marker.on('click', () => this.router.navigate(['/publicaciones', publicacion.id]));
  }

  clearMarkers(): void {
    this.layerGroup.clearLayers();
  }
}
