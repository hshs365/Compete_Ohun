import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Group } from '../groups/entities/group.entity';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async getOrCreateConversation(groupId: number, participantId: number, creatorId: number): Promise<Conversation> {
    const group = await this.groupRepo.findOne({ where: { id: groupId }, select: ['id', 'creatorId'] });
    if (!group) throw new NotFoundException('모임을 찾을 수 없습니다.');
    if (group.creatorId !== creatorId) throw new BadRequestException('매치장 정보가 일치하지 않습니다.');
    if (participantId === creatorId) throw new BadRequestException('본인과는 채팅할 수 없습니다.');

    let conv = await this.conversationRepo.findOne({
      where: { groupId, participantId },
      relations: ['group', 'participant', 'creator'],
    });
    if (conv) return conv;
    conv = this.conversationRepo.create({ groupId, participantId, creatorId });
    conv = await this.conversationRepo.save(conv);
    this.chatGateway.emitInboxUpdate(creatorId, { conversationId: conv.id });
    return conv;
  }

  async getConversation(conversationId: number, userId: number): Promise<Conversation> {
    const conv = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['group', 'participant', 'creator'],
    });
    if (!conv) throw new NotFoundException('대화를 찾을 수 없습니다.');
    if (conv.participantId !== userId && conv.creatorId !== userId) {
      throw new ForbiddenException('이 대화에 접근할 수 없습니다.');
    }
    return conv;
  }

  async getMessages(
    conversationId: number,
    userId: number,
    beforeId?: number,
    limit = 50,
  ): Promise<{ messages: Message[]; otherLastReadAt: string | null }> {
    const conv = await this.getConversation(conversationId, userId);
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .where('m.conversationId = :conversationId', { conversationId })
      .orderBy('m.createdAt', 'DESC')
      .take(limit);
    if (beforeId) qb.andWhere('m.id < :beforeId', { beforeId });
    const list = await qb.getMany();
    const messages = list.reverse();
    const otherLastReadAt =
      conv.participantId === userId ? conv.creatorLastReadAt : conv.participantLastReadAt;
    return {
      messages,
      otherLastReadAt: otherLastReadAt ? otherLastReadAt.toISOString() : null,
    };
  }

  async sendMessage(conversationId: number, senderId: number, content: string): Promise<Message> {
    const conv = await this.getConversation(conversationId, senderId);
    const msg = this.messageRepo.create({ conversationId, senderId, content: content.trim() });
    const saved = await this.messageRepo.save(msg);
    const withSender = await this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });
    const now = new Date();
    if (conv.participantId === senderId) {
      await this.conversationRepo.update(conversationId, { participantLastReadAt: now });
    } else {
      await this.conversationRepo.update(conversationId, { creatorLastReadAt: now });
    }
    const recipientId = conv.participantId === senderId ? conv.creatorId : conv.participantId;
    this.chatGateway.emitNewMessage(conversationId, withSender || saved);
    this.chatGateway.emitInboxUpdate(recipientId, { conversationId });
    return withSender || saved;
  }

  /** 내 대화 목록 (참가자/호스트 모두, 나간 방 제외) */
  async getMyConversations(userId: number) {
    const list = await this.conversationRepo.find({
      where: [{ participantId: userId }, { creatorId: userId }],
      relations: ['group', 'participant', 'creator'],
      order: { createdAt: 'DESC' },
    });
    // 나간 방 제외
    const filtered = list.filter((c) => {
      if (c.participantId === userId && c.participantLeftAt) return false;
      if (c.creatorId === userId && c.creatorLeftAt) return false;
      return true;
    });
    const result: {
      id: number;
      groupId: number;
      groupName: string | undefined;
      meetingDateTime: Date | null | undefined;
      otherUser: { id: number; nickname: string } | null;
      isHost: boolean;
      lastMessage: { content: string; createdAt: Date } | null;
      unreadCount: number;
    }[] = [];
    for (const c of filtered) {
      const lastMsg = await this.messageRepo.findOne({
        where: { conversationId: c.id },
        order: { createdAt: 'DESC' },
      });
      const lastReadAt = c.participantId === userId ? c.participantLastReadAt : c.creatorLastReadAt;
      let unreadCount = 0;
      if (lastReadAt && lastMsg) {
        unreadCount = await this.messageRepo.count({
          where: {
            conversationId: c.id,
            createdAt: MoreThan(lastReadAt),
            senderId: Not(userId),
          },
        });
      } else if (lastMsg && lastMsg.senderId !== userId) {
        unreadCount = await this.messageRepo.count({
          where: { conversationId: c.id },
        });
      }
      const other = c.participantId === userId ? c.creator : c.participant;
      const isHost = c.creatorId === userId;
      result.push({
        id: c.id,
        groupId: c.groupId,
        groupName: c.group?.name,
        meetingDateTime: c.group?.meetingDateTime,
        otherUser: other ? { id: other.id, nickname: other.nickname } : null,
        isHost,
        lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt } : null,
        unreadCount,
      });
    }
    // 가장 최근 메시지가 있는 대화가 상단으로 오도록 정렬
    const createdAtByConvId = new Map(filtered.map((c) => [c.id, c.createdAt]));
    result.sort((a, b) => {
      const aAt = a.lastMessage?.createdAt ?? createdAtByConvId.get(a.id) ?? new Date(0);
      const bAt = b.lastMessage?.createdAt ?? createdAtByConvId.get(b.id) ?? new Date(0);
      return new Date(bAt).getTime() - new Date(aAt).getTime();
    });
    return result;
  }

  /** 채팅방 나가기 (참가자/호스트 모두 가능) */
  async leaveConversation(conversationId: number, userId: number): Promise<void> {
    const c = await this.getConversation(conversationId, userId);
    const now = new Date();
    if (c.participantId === userId) {
      await this.conversationRepo.update(conversationId, { participantLeftAt: now });
    } else {
      await this.conversationRepo.update(conversationId, { creatorLeftAt: now });
    }
  }

  async markAsRead(conversationId: number, userId: number): Promise<void> {
    const c = await this.getConversation(conversationId, userId);
    const now = new Date();
    if (c.participantId === userId) {
      await this.conversationRepo.update(conversationId, { participantLastReadAt: now });
    } else {
      await this.conversationRepo.update(conversationId, { creatorLastReadAt: now });
    }
    const otherUserId = c.participantId === userId ? c.creatorId : c.participantId;
    this.chatGateway.emitReadReceipt(otherUserId, {
      conversationId,
      readAt: now.toISOString(),
    });
  }
}
