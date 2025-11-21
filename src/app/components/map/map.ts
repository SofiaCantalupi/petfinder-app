import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements OnInit {
  map!: L.Map;
  private layerGroup!: L.LayerGroup;

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
  addMarker(lat: number, lng: number, popup: string) {
    L.marker([lat, lng]).addTo(this.map).bindPopup(popup);
  }

  clearMarkers(): void {
    this.layerGroup.clearLayers();
  }
}
