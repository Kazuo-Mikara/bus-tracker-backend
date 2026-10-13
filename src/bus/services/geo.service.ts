import { Injectable } from '@nestjs/common';

@Injectable()
export class GeoService {
  private readonly EARTH_RADIUS_METERS = 6371000;
  private readonly WALKING_SPEED_MPS = 1.3; // ~4.7 km/h

  /**
   * Calculates Haversine distance in meters between two lat/lng points
   */
  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_METERS * c;
  }

  /**
   * Calculates the bearing in degrees (0 - 360) from point 1 to point 2
   */
  calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lon2 - lon1);

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    const theta = Math.atan2(y, x);
    return (toDeg(theta) + 360) % 360;
  }

  /**
   * Linear interpolation between two coordinates
   */
  interpolate(p1: [number, number], p2: [number, number], fraction: number): [number, number] {
    const lat = p1[0] + (p2[0] - p1[0]) * fraction;
    const lng = p1[1] + (p2[1] - p1[1]) * fraction;
    return [lat, lng];
  }

  /**
   * Estimated walking minutes based on distance in meters
   */
  estimateWalkingMinutes(distanceMeters: number): number {
    return Math.max(1, Math.ceil(distanceMeters / (this.WALKING_SPEED_MPS * 60)));
  }
}
