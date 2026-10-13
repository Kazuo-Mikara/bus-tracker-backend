import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common';
import { StopsService } from '../services/stops.service';
import { BusSimulationService } from '../services/bus-simulation.service';
import { NearbyStopQueryDto } from '../models/nearby-stop.dto';

@Controller('api/stops')
export class StopsController {
  constructor(
    private readonly stopsService: StopsService,
    private readonly simulationService: BusSimulationService,
  ) {}

  @Get()
  getAllStops() {
    return this.stopsService.getAllStops();
  }

  @Get('nearby')
  getNearbyStops(@Query(new ValidationPipe({ transform: true })) query: NearbyStopQueryDto) {
    return this.stopsService.findNearby(query.lat, query.lng, query.radius);
  }

  @Get(':id')
  getStopById(@Param('id') id: string) {
    return this.stopsService.getStopById(id);
  }

  @Get(':id/arrivals')
  getArrivals(@Param('id') id: string) {
    const currentTelemetry = this.simulationService.getLatestTelemetry();
    return this.stopsService.getStopArrivals(id, currentTelemetry);
  }
}
