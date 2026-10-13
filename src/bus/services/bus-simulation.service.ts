import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { BusTelemetryGateway } from '../gateways/bus-telemetry.gateway';
import { GeoService } from './geo.service';
import { RoutesService } from './routes.service';
import { BusTelemetry } from '../models/bus.interface';
import * as busesData from '../../data/buses.json';
import * as stopsData from '../../data/bus_stops.json';

interface SimulatedBus {
  id: string;
  routeId: string;
  capacity: number;
  speedMps: number;
  currentSegIndex: number;
  currentProgress: number; // 0.0 to 1.0
  direction: 'forward' | 'reverse';
}

@Injectable()
export class BusSimulationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BusSimulationService.name);
  private buses: SimulatedBus[] = [];
  private latestTelemetry: BusTelemetry[] = [];
  private intervalRef: NodeJS.Timeout | null = null;
  private readonly stops = (stopsData as any).default || stopsData;

  constructor(
    private readonly gateway: BusTelemetryGateway,
    private readonly geoService: GeoService,
    private readonly routesService: RoutesService,
  ) {}

  onModuleInit() {
    const rawBuses = (busesData as any).default || busesData;
    this.buses = rawBuses.map((b) => ({
      ...b,
      direction: 'forward',
    }));

    this.logger.log(`Initializing Bus Simulation Engine with ${this.buses.length} buses.`);

    // Run first simulation tick immediately, then schedule 1Hz ticker
    this.tick();
    this.intervalRef = setInterval(() => this.tick(), 1000);
  }

  onModuleDestroy() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }

  getLatestTelemetry(): BusTelemetry[] {
    return this.latestTelemetry;
  }

  private tick() {
    const updatedTelemetry: BusTelemetry[] = [];

    for (const bus of this.buses) {
      try {
        const route = this.routesService.getRouteById(bus.routeId);
        const poly = route.polyline;

        if (!poly || poly.length < 2) continue;

        if (bus.currentSegIndex >= poly.length) {
          bus.currentSegIndex = 0;
        }

        // Current waypoint coordinates
        const p1 = poly[bus.currentSegIndex];
        const nextIndex = (bus.currentSegIndex + 1) % poly.length;
        const p2 = poly[nextIndex];

        // Segment length in meters
        const segDist = Math.max(10, this.geoService.haversineDistance(p1[0], p1[1], p2[0], p2[1]));

        // Calculate progress increment based on speed
        const progressIncrement = (bus.speedMps * 1.0) / segDist;
        bus.currentProgress += progressIncrement;

        if (bus.currentProgress >= 1.0) {
          bus.currentProgress = 0.0;
          bus.currentSegIndex = nextIndex;
        }

        // Interpolated GPS position
        const [lat, lng] = this.geoService.interpolate(p1, p2, bus.currentProgress);

        // Heading bearing in degrees
        const heading = this.geoService.calculateBearing(p1[0], p1[1], p2[0], p2[1]);

        // Find next stop on this route
        const nextStopId = this.findNextStopId(route.stops, bus.currentSegIndex, poly.length);

        // Calculate ETA to next stop
        const etaSeconds = Math.max(15, Math.round(((1 - bus.currentProgress) * segDist) / bus.speedMps));

        updatedTelemetry.push({
          id: bus.id,
          routeId: bus.routeId,
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          heading: Math.round(heading),
          speedKmh: Math.round(bus.speedMps * 3.6),
          nextStopId,
          etaSecondsToNextStop: etaSeconds,
        });
      } catch (err) {
        this.logger.error(`Error simulating bus ${bus.id}:`, err);
      }
    }

    this.latestTelemetry = updatedTelemetry;
    this.gateway.broadcastTelemetry(updatedTelemetry);
  }

  private findNextStopId(routeStopIds: string[], segIndex: number, totalWaypoints: number): string {
    if (!routeStopIds || routeStopIds.length === 0) return 'stop_0001';
    // Distribute stops evenly across segments
    const stopIndex = Math.min(
      routeStopIds.length - 1,
      Math.floor((segIndex / Math.max(1, totalWaypoints)) * routeStopIds.length),
    );
    const nextIndex = (stopIndex + 1) % routeStopIds.length;
    return routeStopIds[nextIndex] || routeStopIds[0];
  }
}
