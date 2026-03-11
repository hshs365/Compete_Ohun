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

  /** 매치 시작 30분 지나면 QR 생성 불가 */
  private static readonly QR_CUTOFF_MINUTES = 30;

  /** 호스트 전용: QR 인증 토큰 생성 (1분 유효). 매치 시작 30분 지나면 생성 불가 */
  async generateToken(groupId: number, creatorId: number): Promise<{ token: string; expiresAt: string }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      select: ['id', 'creatorId', 'meetingDateTime'],
    });
    if (!group || group.creatorId !== creatorId) {
      throw new ForbiddenException('매치 생성자만 QR 인증을 시작할 수 있습니다.');
    }

    const meeting = group.meetingDateTime;
    if (meeting) {
      const cutoff = new Date(meeting.getTime() + QrVerificationService.QR_CUTOFF_MINUTES * 60 * 1000);
      if (new Date() > cutoff) {
        throw new BadRequestException(
          '매치 시작 30분이 지나 QR 인증을 받을 수 없습니다. 30분 내에 스캔하지 않은 참가자는 노쇼로 처리됩니다.',
        );
      }
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

    // QR 인증 완료 시각 기록 (노쇼 판별용)
    await this.participantRepository.update(
      { id: participant.id },
      { qrVerifiedAt: new Date() },
    );

    // 토큰 1회 사용 후 무효화
    qrTokenStore.delete(token);

    return { success: true, nickname };
  }
}
