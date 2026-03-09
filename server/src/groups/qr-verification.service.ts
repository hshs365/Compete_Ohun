import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupParticipant } from './entities/group-participant.entity';
import * as crypto from 'crypto';

/** QR 토큰 저장 (메모리, TTL 70초) */
const qrTokenStore = new Map<
  string,
  { groupId: number; creatorId: number; expiresAt: number }
>();

const TOKEN_TTL_MS = 70 * 1000; // 70초 (1분 갱신 전 10초 여유)
const TOKEN_LEN = 32;

@Injectable()
export class QrVerificationService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupParticipant)
    private participantRepository: Repository<GroupParticipant>,
  ) {}

  /** 호스트 전용: QR 인증 토큰 생성 (1분 유효) */
  async generateToken(groupId: number, creatorId: number): Promise<{ token: string; expiresAt: string }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      select: ['id', 'creatorId'],
    });
    if (!group || group.creatorId !== creatorId) {
      throw new ForbiddenException('매치 생성자만 QR 인증을 시작할 수 있습니다.');
    }

    const token = crypto.randomBytes(TOKEN_LEN).toString('hex');
    const expiresAt = Date.now() + TOKEN_TTL_MS;

    qrTokenStore.set(token, {
      groupId,
      creatorId,
      expiresAt,
    });

    // 만료된 토큰 정리 (최대 1000개일 때)
    if (qrTokenStore.size > 1000) {
      const now = Date.now();
      for (const [k, v] of qrTokenStore.entries()) {
        if (v.expiresAt < now) qrTokenStore.delete(k);
      }
    }

    return {
      token,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /** 용병 스캔 후 인증: 토큰 검증 및 참가자 확인 */
  async verifyScan(
    groupId: number,
    token: string,
    userId: number,
  ): Promise<{ success: boolean; nickname: string }> {
    const stored = qrTokenStore.get(token);
    if (!stored || stored.groupId !== groupId) {
      throw new BadRequestException('유효하지 않거나 만료된 QR 코드입니다. 호스트가 새로 QR을 생성해 주세요.');
    }
    if (Date.now() > stored.expiresAt) {
      qrTokenStore.delete(token);
      throw new BadRequestException('QR 코드가 만료되었습니다. 호스트가 새로 QR을 생성해 주세요.');
    }

    const participant = await this.participantRepository.findOne({
      where: { groupId, userId, status: 'joined' },
      relations: ['user'],
    });
    if (!participant) {
      throw new BadRequestException('이 매치의 참가자가 아닙니다. 참가 신청 후 스캔해 주세요.');
    }

    const user = participant.user as { nickname?: string } | undefined;
    const nickname = user?.nickname ?? '용병';

    // 토큰 1회 사용 후 무효화
    qrTokenStore.delete(token);

    return { success: true, nickname };
  }
}
