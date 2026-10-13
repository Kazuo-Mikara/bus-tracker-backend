import { Controller, Get, Param } from '@nestjs/common';
import { RoutesService } from '../services/routes.service';

@Controller('api/routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  getAllRoutes() {
    return this.routesService.getAllRoutes();
  }

  @Get(':id')
  getRouteById(@Param('id') id: string) {
    return this.routesService.getRouteById(id);
  }
}
