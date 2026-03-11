import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, IsNull } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupParticipant } from './entities/group-participant.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ReservationsService } from '../facilities/reservations.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { PointsService } from '../users/points.service';
import { PointTransactionType } from '../users/entities/point-transaction.entity';

/** 예치금 환급 시점: meetingDateTime + 이 값(ms). 기본 3시간 */
const DEPOSIT_REFUND_BUFFER_MS = 3 * 60 * 60 * 1000;

@Injectable()
export class GroupsSchedulerService {
  private readonly logger = new Logger(GroupsSchedulerService.name);

  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupParticipant)
    private participantRepository: Repository<GroupParticipant>,
    private notificationsService: NotificationsService,
    private reservationsService: ReservationsService,
    private pointsService: PointsService,
  ) {}

  /** 매 10분마다 실행. 비활성화: .env에 GROUPS_SCHEDULER_ENABLED=false */
  @Cron('*/10 * * * *')
  async checkGroupsBeforeMeeting() {
    if (process.env.GROUPS_SCHEDULER_ENABLED === 'false') return;

    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 1 * 60 * 60 * 1000);
      const oneHourTenMinutesLater = new Date(now.getTime() + 1 * 60 * 60 * 1000 + 10 * 60 * 1000);

      const groupsToCheck = await this.groupRepository
        .createQueryBuilder('group')
        .where('group.meetingDateTime >= :oneHourLater', { oneHourLater })
        .andWhere('group.meetingDateTime <= :oneHourTenMinutesLater', { oneHourTenMinutesLater })
        .andWhere('group.isActive = :isActive', { isActive: true })
        .andWhere('group.isClosed = :isClosed', { isClosed: false })
        .getMany();

      if (groupsToCheck.length === 0) return;

      this.logger.log(`모임 시작 1시간 전 체크: ${groupsToCheck.length}건`);
      for (const group of groupsToCheck) {
        await this.checkAndCancelIfNeeded(group);
      }
    } catch (error) {
      this.logger.error('모임 체크 중 오류 발생:', error);
    }
  }

  private async checkAndCancelIfNeeded(group: Group) {
    try {
      if (!group.minParticipants) {
        this.logger.log(`모임 ${group.id}: 최소 인원 수가 설정되지 않아 체크 건너뜀`);
        return;
      }

      const rowCount = await this.participantRepository.count({
        where: { groupId: group.id },
      });
      // group_participants에 모임장이 없을 수 있음(일반 매치) → 최소 1명(모임장)으로 간주
      const actualParticipantCount = Math.max(1, rowCount);

      this.logger.log(
        `모임 ${group.id}: 현재 참가자 수 ${actualParticipantCount}, 최소 인원 ${group.minParticipants}`,
      );

      if (actualParticipantCount >= group.minParticipants) return;

      this.logger.log(`모임 ${group.id}: 최소 인원 미달로 취소 및 삭제 처리 시작`);

      // 1. 가계약(가예약) 취소
      const cancelledCount = await this.reservationsService.cancelProvisionalByGroupId(group.id);
      this.logger.log(`모임 ${group.id}: 가예약 ${cancelledCount}건 취소됨`);

      // 2. 모임 비활성화(삭제) - 목록에서 제외
      await this.groupRepository.update(group.id, {
        isActive: false,
        isClosed: true,
      });

      const notificationMessage = `[${group.name}] 매치가 최소 인원 미달로 취소되었습니다.`;

      // 3. 참가자들에게 알림 전송 (매치장 포함)
      const participants = await this.participantRepository.find({
        where: { groupId: group.id },
        relations: ['user'],
      });

      const notifiedUserIds = new Set<number>();
      for (const participant of participants) {
        if (notifiedUserIds.has(participant.userId)) continue;
        try {
          await this.notificationsService.createNotification(
            participant.userId,
            NotificationType.GROUP_CANCELLED,
            '매치 취소 알림',
            notificationMessage,
            { groupId: group.id },
          );
          notifiedUserIds.add(participant.userId);
        } catch (error) {
          this.logger.error(`참가자 ${participant.userId}에게 알림 전송 실패:`, error);
        }
      }

      if (!notifiedUserIds.has(group.creatorId)) {
        try {
          await this.notificationsService.createNotification(
            group.creatorId,
            NotificationType.GROUP_CANCELLED,
            '매치 취소 알림',
            notificationMessage,
            { groupId: group.id },
          );
        } catch (error) {
          this.logger.error(`모임장 ${group.creatorId}에게 알림 전송 실패:`, error);
        }
      }

      this.logger.log(`모임 ${group.id}: 취소 완료 (가예약 취소 ${cancelledCount}건, 알림 전송 완료)`);
    } catch (error) {
      this.logger.error(`모임 ${group.id} 체크 중 오류:`, error);
    }
  }

  /** 매 10분마다 실행. 매치 1시간 전 참가자에게 알림 전송 */
  @Cron('*/10 * * * *')
  async sendMatchReminders() {
    if (process.env.GROUPS_SCHEDULER_ENABLED === 'false') return;

    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const oneHourTenFromNow = new Date(now.getTime() + 70 * 60 * 1000);

      const groupsToRemind = await this.groupRepository
        .createQueryBuilder('group')
        .where('group.meetingDateTime >= :start', { start: oneHourFromNow })
        .andWhere('group.meetingDateTime < :end', { end: oneHourTenFromNow })
        .andWhere('group.isActive = :isActive', { isActive: true })
        .andWhere('group.isClosed = :isClosed', { isClosed: false })
        .select(['group.id', 'group.name', 'group.category', 'group.creatorId'])
        .getMany();

      if (groupsToRemind.length === 0) return;

      this.logger.log(`매치 1시간 전 알림: ${groupsToRemind.length}건`);
      for (const group of groupsToRemind) {
        const participants = await this.participantRepository.find({
          where: { groupId: group.id },
          relations: ['user'],
        });
        const notifiedIds = new Set<number>();
        for (const p of participants) {
          if (notifiedIds.has(p.userId)) continue;
          try {
            await this.notificationsService.createNotification(
              p.userId,
              NotificationType.MATCH_REMINDER,
              '매치 1시간 전',
              `[${group.name}] ${group.category} 매치가 1시간 후 시작됩니다. 준비하세요!`,
              { groupId: group.id, groupName: group.name, category: group.category },
            );
            notifiedIds.add(p.userId);
          } catch (err) {
            this.logger.error(`참가자 ${p.userId} 알림 실패:`, err);
          }
        }
        if (!notifiedIds.has(group.creatorId)) {
          try {
            await this.notificationsService.createNotification(
              group.creatorId,
              NotificationType.MATCH_REMINDER,
              '매치 1시간 전',
              `[${group.name}] ${group.category} 매치가 1시간 후 시작됩니다. 준비하세요!`,
              { groupId: group.id, groupName: group.name, category: group.category },
            );
          } catch (err) {
            this.logger.error(`모임장 ${group.creatorId} 알림 실패:`, err);
          }
        }
      }
    } catch (error) {
      this.logger.error('매치 1시간 전 알림 전송 오류:', error);
    }
  }

  /** 매 10분마다 실행. meetingDateTime + 3시간 지난 용병 구하기 모임의 예치금 환급 */
  @Cron('*/10 * * * *')
  async refundDeposits() {
    if (process.env.GROUPS_SCHEDULER_ENABLED === 'false') return;

    try {
      const cutoff = new Date(Date.now() - DEPOSIT_REFUND_BUFFER_MS);

      const groups = await this.groupRepository.find({
        where: {
          isMercenaryRecruit: true,
          meetingDateTime: LessThan(cutoff),
        },
        select: ['id', 'name', 'depositPlatformFee'],
      });

      for (const group of groups) {
        const participants = await this.participantRepository.find({
          where: {
            groupId: group.id,
            depositAmountPaid: MoreThan(0),
            depositRefundedAt: IsNull(),
          },
        });

        const platformFee = group.depositPlatformFee ?? 500;
        for (const p of participants) {
          if (p.depositAmountPaid <= 0) continue;
          const refundAmount = Math.max(0, p.depositAmountPaid - platformFee);
          if (refundAmount <= 0) continue;
          try {
            await this.pointsService.addTransaction(
              p.userId,
              refundAmount,
              PointTransactionType.DEPOSIT_REFUND,
              `예치금 환급: ${group.name}`,
            );
            await this.participantRepository.update(p.id, {
              depositRefundedAt: new Date(),
            });
            this.logger.log(`예치금 환급: 그룹 ${group.id}, 참가자 ${p.userId}, ${refundAmount}P`);
          } catch (err) {
            this.logger.error(`예치금 환급 실패: 그룹 ${group.id}, 참가자 ${p.userId}`, err);
          }
        }
      }
    } catch (error) {
      this.logger.error('예치금 환급 스케줄러 오류:', error);
    }
  }
}
