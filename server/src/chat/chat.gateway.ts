import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: true },
  path: '/socket.io',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection() {}

  handleDisconnect() {}

  @SubscribeMessage('join-conversation')
  handleJoinConversation(client: any, payload: { conversationId: number }) {
    const id = payload?.conversationId;
    if (typeof id === 'number' && id > 0) {
      client.join(`conversation:${id}`);
    }
  }

  @SubscribeMessage('join-user')
  handleJoinUser(client: any, payload: { userId: number }) {
    const id = payload?.userId;
    if (typeof id === 'number' && id > 0) {
      client.join(`user:${id}`);
    }
  }

  emitNewMessage(conversationId: number, message: unknown): void {
    this.server?.to(`conversation:${conversationId}`).emit('new-message', message);
  }

  emitInboxUpdate(userId: number, payload: { conversationId: number }): void {
    this.server?.to(`user:${userId}`).emit('inbox-update', payload);
  }

  emitReadReceipt(
    userId: number,
    payload: { conversationId: number; readAt: string },
  ): void {
    this.server?.to(`user:${userId}`).emit('read-receipt', payload);
  }
}
