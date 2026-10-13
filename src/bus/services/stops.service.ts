import { Injectable, NotFoundException } from '@nestjs/common';
import { BusStop, NearbyBusStop, BusArrivalInfo } from '../models/bus.interface';
import { GeoService } from './geo.service';
import { RoutesService } from './routes.service';
import * as stopsData from '../../data/bus_stops.json';

@Injectable()
export class StopsService {
  private stops: BusStop[] = (stopsData as any).default || stopsData;

  constructor(
    private readonly geoService: GeoService,
    private readonly routesService: RoutesService,
  ) {}

  getAllStops(): BusStop[] {
    return this.stops;
  }

  getStopById(id: string): BusStop {
    const trimmedId = id ? decodeURIComponent(id).trim().toLowerCase() : '';
    const stop = this.stops.find((s) => s.id === id || s.id.toLowerCase() === trimmedId);
    if (!stop) {
      throw new NotFoundException(`Stop with id "${id}" not found`);
    }
    return stop;
  }

  findNearby(userLat: number, userLng: number, radiusMeters: number): NearbyBusStop[] {
    const nearby = this.stops
      .map((stop) => {
        const distance = this.geoService.haversineDistance(userLat, userLng, stop.lat, stop.lng);
        return {
          ...stop,
          distanceMeters: Math.round(distance),
          walkingMinutes: this.geoService.estimateWalkingMinutes(distance),
        };
      })
      .filter((stop) => stop.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    return nearby;
  }

  getStopArrivals(stopId: string, currentBusTelemetry: any[]): BusArrivalInfo[] {
    const stop = this.getStopById(stopId);
    const arrivals: BusArrivalInfo[] = [];

    for (const routeId of stop.routes) {
      let route;
      try {
        route = this.routesService.getRouteById(routeId);
      } catch {
        continue;
      }

      // Find buses on this route from current telemetry
      const activeBuses = currentBusTelemetry.filter(
        (b) => b.routeId === routeId || (route && b.routeId === route.id),
      );

      for (const bus of activeBuses) {
        const distanceToStop = this.geoService.haversineDistance(
          bus.lat,
          bus.lng,
          stop.lat,
          stop.lng,
        );

        // Compute simulated ETA based on average speed (or telemetry ETA)
        const avgSpeedMps = 8.5; // ~30 km/h
        const etaSeconds = Math.max(30, Math.round(distanceToStop / avgSpeedMps));
        const minutes = Math.floor(etaSeconds / 60);
        const seconds = etaSeconds % 60;

        arrivals.push({
          busId: bus.id,
          routeId: route.id,
          routeName: route.name,
          routeColor: route.color,
          etaSeconds,
          etaFormatted: minutes > 0 ? `${minutes} min` : `${seconds} sec`,
          distanceMeters: Math.round(distanceToStop),
        });
      }
    }

    // Sort by earliest arriving bus
    return arrivals.sort((a, b) => a.etaSeconds - b.etaSeconds);
  }
}
