import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupParticipant } from './entities/group-participant.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ReservationsService } from '../facilities/reservations.service';
import { NotificationType } from '../notifications/entities/notification.entity';

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
  ) {}

  // 매 10분마다 실행 (모임 시작 1시간 전 체크)
  @Cron('*/10 * * * *')
  async checkGroupsBeforeMeeting() {
    this.logger.log('모임 시작 1시간 전 체크 시작...');

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

      this.logger.log(`체크할 모임 수: ${groupsToCheck.length}`);

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

      const participantCount = await this.participantRepository.count({
        where: { groupId: group.id },
      });
      const actualParticipantCount = participantCount + 1;

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
}
