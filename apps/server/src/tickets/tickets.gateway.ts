import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TicketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Painel conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Painel desconectado: ${client.id}`);
  }

  emitTicketCalled(ticket: {
    id: number;
    code: string;
    counter: number | null;
    priority: string;
  }) {
    this.server.emit('ticket-called', {
      id: ticket.id,
      code: ticket.code,
      counter: ticket.counter,
      priority: ticket.priority,
    });
  }
}