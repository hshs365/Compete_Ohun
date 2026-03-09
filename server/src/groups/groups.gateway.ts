import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

/** 포지션 변경 등 그룹 상세 실시간 반영용 소켓 */
@WebSocketGateway({
  cors: { origin: true },
  path: '/socket.io',
})
export class GroupsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection() {
    // 클라이언트 연결 시 (인증은 선택 사항)
  }

  handleDisconnect() {
    // 클라이언트 연결 해제 시
  }

  /** 클라이언트가 그룹 룸 참가 (상세 페이지 진입 시) */
  @SubscribeMessage('join-group')
  handleJoinGroup(client: any, payload: { groupId: number }) {
    const groupId = payload?.groupId;
    if (typeof groupId === 'number' && groupId > 0) {
      client.join(`group:${groupId}`);
    }
  }

  /** 해당 그룹의 포지션 변경 알림 브로드캐스트 */
  emitPositionUpdated(groupId: number): void {
    this.server?.to(`group:${groupId}`).emit('position-updated', { groupId });
  }

  /** 용병 QR 인증 완료 시 호스트 화면에 실시간 알림 */
  emitMercenaryVerified(groupId: number, nickname: string): void {
    this.server?.to(`group:${groupId}`).emit('mercenary-verified', { nickname });
  }
}
