import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { BusTelemetry } from '../models/bus.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BusTelemetryGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BusTelemetryGateway.name);

  afterInit() {
    this.logger.log('Bus Telemetry WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:route')
  handleSubscribeRoute(client: Socket, routeId: string) {
    client.join(`route:${routeId}`);
    return { status: 'subscribed', routeId };
  }

  @SubscribeMessage('unsubscribe:route')
  handleUnsubscribeRoute(client: Socket, routeId: string) {
    client.leave(`route:${routeId}`);
    return { status: 'unsubscribed', routeId };
  }

  broadcastTelemetry(telemetry: BusTelemetry[]) {
    // Broadcast all buses to global listeners
    this.server.emit('bus:telemetry', telemetry);

    // Also emit to specific route rooms
    for (const item of telemetry) {
      this.server.to(`route:${item.routeId}`).emit('bus:route_update', item);
    }
  }
}
