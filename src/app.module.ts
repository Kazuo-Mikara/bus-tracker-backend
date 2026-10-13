import { Module } from '@nestjs/common';
import { BusModule } from './bus/bus.module';

@Module({
  imports: [BusModule],
})
export class AppModule {}
