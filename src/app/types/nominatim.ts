export interface NominatimSearchResult {
  place_id: number;
  licence: string;
  osm_type: 'node' | 'way' | 'relation';
  osm_id: string;
  boundingbox: [string, string, string, string]; // [min_lat, max_lat, min_lon, max_lon]
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  
  // Opcional: solo con addressdetails=1
  address?: {
    continent?: string;
    country?: string;
    country_code?: string;
    region?: string;
    state?: string;
    state_district?: string;
    county?: string;
    'ISO3166-2-lvl4'?: string;
    municipality?: string;
    city?: string;
    town?: string;
    village?: string;
    city_district?: string;
    district?: string;
    borough?: string;
    suburb?: string;
    subdivision?: string;
    hamlet?: string;
    croft?: string;
    isolated_dwelling?: string;
    neighbourhood?: string;
    allotments?: string;
    quarter?: string;
    city_block?: string;
    residential?: string;
    farm?: string;
    farmyard?: string;
    industrial?: string;
    commercial?: string;
    retail?: string;
    road?: string;
    house_number?: string;
    house_name?: string;
    postcode?: string;
    [key: string]: string | undefined; // Para otros campos dinámicos
  };
  
  // Opcional: solo con extratags=1
  extratags?: {
    [key: string]: string;
  };
  
  // Opcional: solo con namedetails=1
  namedetails?: {
    [key: string]: string;
  };
  
  // Opcional: solo con polygon_geojson=1, polygon_svg=1, etc.
  geojson?: any;
  svg?: string;
  geotext?: string;
  geokml?: string;
  
  // Opcional: solo con entrances=1
  entrances?: Array<{
    osm_id: number;
    type: string;
    lat: string;
    lon: string;
    extratags?: {
      [key: string]: string;
    };
  }> | null;
}