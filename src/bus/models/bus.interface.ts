export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface BusStop {
  id: string;
  name: string;
  nameLocal?: string;
  lat: number;
  lng: number;
  routes: string[];
}

export interface NearbyBusStop extends BusStop {
  distanceMeters: number;
  walkingMinutes: number;
}

export interface BusRoute {
  id: string;
  name: string;
  color: string;
  stops: string[];
  polyline: [number, number][]; // [lat, lng][]
  schedule?: {
    weekday: string[];
    weekend: string[];
  };
}

export interface BusTelemetry {
  id: string;
  routeId: string;
  lat: number;
  lng: number;
  heading: number;
  speedKmh: number;
  nextStopId: string;
  etaSecondsToNextStop: number;
}

export interface BusArrivalInfo {
  busId: string;
  routeId: string;
  routeName: string;
  routeColor: string;
  etaSeconds: number;
  etaFormatted: string;
  distanceMeters: number;
}
