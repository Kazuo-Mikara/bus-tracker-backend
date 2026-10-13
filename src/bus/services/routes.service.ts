import { Injectable, NotFoundException } from '@nestjs/common';
import { BusRoute } from '../models/bus.interface';
import * as routesData from '../../data/routes.json';

@Injectable()
export class RoutesService {
  private routes: BusRoute[] = (routesData as any).default || routesData;

  getAllRoutes(): BusRoute[] {
    return this.routes;
  }

  getRouteById(id: string): BusRoute {
    const trimmedId = id ? decodeURIComponent(id).trim().toLowerCase() : '';
    const route = this.routes.find((r) => {
      if (r.id === id) return true;
      const lowerId = r.id.toLowerCase();
      if (lowerId === trimmedId) return true;
      if (r.name.toLowerCase() === trimmedId) return true;
      if (lowerId.replace(/^ybs[\s-_]*/, '') === trimmedId.replace(/^ybs[\s-_]*/, '')) return true;
      return false;
    });
    if (!route) {
      throw new NotFoundException(`Route with id "${id}" not found`);
    }
    return route;
  }
}
