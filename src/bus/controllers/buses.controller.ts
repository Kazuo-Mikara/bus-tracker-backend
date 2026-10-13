import { Controller, Get } from '@nestjs/common';
import { BusSimulationService } from '../services/bus-simulation.service';
import * as busesData from '../../data/buses.json';

@Controller('api/bus')
export class BusesController {
  constructor(private readonly simulationService: BusSimulationService) { }

  @Get()
  getFleet() {
    return (busesData as any).default || busesData;
  }

  @Get('telemetry')
  getLatestTelemetry() {
    return this.simulationService.getLatestTelemetry();
  }
}
