import { Component, OnInit, input, effect } from '@angular/core';
import * as L from 'leaflet';
import { Publicacion } from '../../models/publicacion';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements OnInit {
  map!: L.Map;
  private layerGroup!: L.LayerGroup;

  publicacion = input.required<Publicacion | null>();

  constructor() {
    // Usa effect para reaccionar cuando publicacion cambie
    effect(() => {
      const pub = this.publicacion();
      if (pub && this.map) {
        this.clearMarkers();
        this.addMarker(pub.latitud, pub.longitud);
        // Centra el mapa en la ubicación de la publicación
        this.map.setView([pub.latitud, pub.longitud], 15);
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
  addMarker(lat: number, lng: number) {
    const icon = L.divIcon({
      className: 'circular-icon',
      html: `<div class='circle-image' style="background-image: url('${
        this.publicacion()?.urlFoto
      }')"></div>`,
      iconSize: [60, 60],
      iconAnchor: [30, 30],
    });

    const marker = L.marker([lat, lng], { icon })
      .addTo(this.layerGroup)
      .bindPopup(
        `<strong>${this.publicacion()?.nombreMascota || 'Sin nombre'}</strong><br>${
          this.publicacion()?.calle
        } ${this.publicacion()?.altura}<br>${this.publicacion()?.tipoMascota}<br><em>Estado: ${
          this.publicacion()?.estadoMascota
        }</em>`
      );
    marker.on('mouseover', () => marker.openPopup());
    marker.on('mouseout', () => marker.closePopup());
  }

  clearMarkers(): void {
    this.layerGroup.clearLayers();
  }
}
