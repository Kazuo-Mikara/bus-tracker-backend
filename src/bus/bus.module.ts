import { Module } from '@nestjs/common';
import { StopsController } from './controllers/stops.controller';
import { RoutesController } from './controllers/routes.controller';
import { BusesController } from './controllers/buses.controller';
import { StopsService } from './services/stops.service';
import { RoutesService } from './services/routes.service';
import { BusSimulationService } from './services/bus-simulation.service';
import { GeoService } from './services/geo.service';
import { BusTelemetryGateway } from './gateways/bus-telemetry.gateway';

@Module({
  controllers: [StopsController, RoutesController, BusesController],
  providers: [
    StopsService,
    RoutesService,
    BusSimulationService,
    GeoService,
    BusTelemetryGateway,
  ],
  exports: [StopsService, RoutesService, BusSimulationService, GeoService],
})
export class BusModule {}
