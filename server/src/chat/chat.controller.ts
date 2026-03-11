import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** 내 대화 목록 */
  @Get('conversations')
  async getMyConversations(@CurrentUser() user: User) {
    return this.chatService.getMyConversations(user.id);
  }

  /** 모임 기준 매치장과의 대화방 찾기 또는 생성 (채팅으로 문의하기 클릭 시) */
  @Post('conversations')
  async getOrCreateConversation(
    @Body() body: { groupId: number; creatorId: number },
    @CurrentUser() user: User,
  ) {
    const { groupId, creatorId } = body;
    if (!groupId || typeof groupId !== 'number') {
      throw new BadRequestException('groupId가 필요합니다.');
    }
    if (!creatorId || typeof creatorId !== 'number') {
      throw new BadRequestException('creatorId가 필요합니다.');
    }
    return this.chatService.getOrCreateConversation(
      groupId,
      user.id,
      creatorId,
    );
  }

  /** 채팅방 나가기 */
  @Delete('conversations/:id')
  async leaveConversation(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    await this.chatService.leaveConversation(id, user.id);
    return { ok: true };
  }

  /** 대화 읽음 처리 */
  @Patch('conversations/:id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    await this.chatService.markAsRead(id, user.id);
    return { ok: true };
  }

  /** 메시지 목록 조회 (messages + 상대방 마지막 읽은 시각 otherLastReadAt) */
  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Query('beforeId') beforeId?: string,
    @Query('limit') limitStr?: string,
  ) {
    const before = beforeId ? parseInt(beforeId, 10) : undefined;
    const limit = limitStr ? Math.min(parseInt(limitStr, 10) || 50, 100) : 50;
    return this.chatService.getMessages(id, user.id, before, limit);
  }

  /** 메시지 전송 */
  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.chatService.sendMessage(id, user.id, dto.content);
  }
}
