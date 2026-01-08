import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupParticipant } from './entities/group-participant.entity';
import { NotificationsService } from '../notifications/notifications.service';
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
  ) {}

  // 매 10분마다 실행 (모임 시작 2시간 전 체크)
  @Cron('*/10 * * * *') // 매 10분마다
  async checkGroupsBeforeMeeting() {
    this.logger.log('모임 시작 2시간 전 체크 시작...');

    try {
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2시간 후
      const twoHoursTenMinutesLater = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 10 * 60 * 1000); // 2시간 10분 후

      // 모임 시작 시간이 2시간 후 ~ 2시간 10분 후 사이인 모임들 조회
      const groupsToCheck = await this.groupRepository
        .createQueryBuilder('group')
        .where('group.meetingDateTime >= :twoHoursLater', { twoHoursLater })
        .andWhere('group.meetingDateTime <= :twoHoursTenMinutesLater', { twoHoursTenMinutesLater })
        .andWhere('group.isActive = :isActive', { isActive: true })
        .andWhere('group.isClosed = :isClosed', { isClosed: false })
        .getMany();

      this.logger.log(`체크할 모임 수: ${groupsToCheck.length}`);

      for (const group of groupsToCheck) {
        await this.checkAndDisbandIfNeeded(group);
      }
    } catch (error) {
      this.logger.error('모임 체크 중 오류 발생:', error);
    }
  }

  private async checkAndDisbandIfNeeded(group: Group) {
    try {
      // 최소 인원 수 확인
      if (!group.minParticipants) {
        this.logger.log(`모임 ${group.id}: 최소 인원 수가 설정되지 않아 체크 건너뜀`);
        return;
      }

      // 실제 참가자 수 조회 (모임장 포함)
      const participantCount = await this.participantRepository.count({
        where: { groupId: group.id },
      });

      // 모임장 포함하여 실제 참가자 수 계산
      const actualParticipantCount = participantCount + 1; // 모임장 포함

      this.logger.log(
        `모임 ${group.id}: 현재 참가자 수 ${actualParticipantCount}, 최소 인원 ${group.minParticipants}`,
      );

      // 최소 인원이 모이지 않았으면 모임 해체
      if (actualParticipantCount < group.minParticipants) {
        this.logger.log(`모임 ${group.id}: 최소 인원 미달로 해체 처리 시작`);

        // 모임 비활성화
        await this.groupRepository.update(group.id, {
          isActive: false,
          isClosed: true,
        });

        // 모든 참가자에게 알림 전송
        const participants = await this.participantRepository.find({
          where: { groupId: group.id },
          relations: ['user'],
        });

        const notificationMessage = `[${group.name}] 모임이 최소 인원 미달로 취소되었습니다.`;

        // 참가자들에게 알림 전송
        for (const participant of participants) {
          try {
            await this.notificationsService.createNotification(
              participant.userId,
              NotificationType.GROUP_CANCELLED,
              '모임 취소 알림',
              notificationMessage,
              { groupId: group.id },
            );
          } catch (error) {
            this.logger.error(`참가자 ${participant.userId}에게 알림 전송 실패:`, error);
          }
        }

        // 모임장에게도 알림 전송 (참가자 목록에 없을 수 있으므로 별도로)
        try {
          await this.notificationsService.createNotification(
            group.creatorId,
            NotificationType.GROUP_CANCELLED,
            '모임 취소 알림',
            notificationMessage,
            { groupId: group.id },
          );
        } catch (error) {
          this.logger.error(`모임장 ${group.creatorId}에게 알림 전송 실패:`, error);
        }

        this.logger.log(`모임 ${group.id}: 해체 완료 및 알림 전송 완료`);
      }
    } catch (error) {
      this.logger.error(`모임 ${group.id} 체크 중 오류:`, error);
    }
  }
}
