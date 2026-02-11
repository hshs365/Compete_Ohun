import { Injectable, Logger, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupParticipant } from './entities/group-participant.entity';
import { GroupGameSettings } from './entities/group-game-settings.entity';
import { GroupParticipantPosition } from './entities/group-participant-position.entity';
import { GroupReferee } from './entities/group-referee.entity';
import { GroupFavorite } from './entities/group-favorite.entity';
import { MatchReview } from './entities/match-review.entity';
import { GroupProvisionalFacility } from './entities/group-provisional-facility.entity';
import { GroupWaitlist } from './entities/group-waitlist.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupQueryDto } from './dto/group-query.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { UsersService } from '../users/users.service';
import { UserScoreService } from '../users/user-score.service';
import { FollowService } from '../users/follow.service';
import { FacilitiesService } from '../facilities/facilities.service';
import { ReservationsService } from '../facilities/reservations.service';
import { ReservationStatus } from '../facilities/entities/facility-reservation.entity';
import { PointsService } from '../users/points.service';
import { PointTransactionType } from '../users/entities/point-transaction.entity';
import { MATCH_REVIEW_CATEGORIES, OPTIONAL_REVIEW_CATEGORY_KEYS, REVIEW_COMPLETE_POINTS } from '../constants/match-review';
import { FacilityReviewsService } from '../facilities/facility-reviews.service';
import {
  RANK_INITIAL_POINTS,
  RANK_POINTS_WIN,
  RANK_POINTS_LOSS,
  pointsToGrade,
} from '../constants/rank-grade';

/** 주소/시도 문자열에서 지역 키 추출 (예: 서울, 대전, 경기). 알림 지역 매칭용 */
const REGION_KEYS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

function extractRegionKey(address: string | null | undefined): string | null {
  if (!address || typeof address !== 'string') return null;
  const s = address.trim();
  for (const key of REGION_KEYS) {
    if (s.includes(key)) return key;
  }
  return null;
}

/** 동시간대 겹침 판단: 같은 날짜 + 시작 시각이 이 시간(ms) 이내면 겹침으로 봄 */
const SAME_SLOT_WINDOW_MS = 2 * 60 * 60 * 1000; // 2시간

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupParticipant)
    private participantRepository: Repository<GroupParticipant>,
    @InjectRepository(GroupGameSettings)
    private gameSettingsRepository: Repository<GroupGameSettings>,
    @InjectRepository(GroupParticipantPosition)
    private participantPositionRepository: Repository<GroupParticipantPosition>,
    @InjectRepository(GroupReferee)
    private refereeRepository: Repository<GroupReferee>,
    @InjectRepository(GroupFavorite)
    private favoriteRepository: Repository<GroupFavorite>,
    @InjectRepository(MatchReview)
    private matchReviewRepository: Repository<MatchReview>,
    @InjectRepository(GroupProvisionalFacility)
    private provisionalFacilityRepository: Repository<GroupProvisionalFacility>,
    @InjectRepository(GroupWaitlist)
    private waitlistRepository: Repository<GroupWaitlist>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
    private userScoreService: UserScoreService,
    private followService: FollowService,
    private facilitiesService: FacilitiesService,
    private reservationsService: ReservationsService,
    private pointsService: PointsService,
    private facilityReviewsService: FacilityReviewsService,
  ) {}

  /**
   * 해당 사용자가 이미 참여 중인(생성자 또는 참가자) 매치 중, 주어진 시각과 동시간대에 겹치는 매치가 있는지 확인.
   * @returns 겹치는 매치가 있으면 { id: number; name: string } 반환, 없으면 null
   */
  private async findOverlappingGroupForUser(
    userId: number,
    meetingTime: Date,
    excludeGroupId?: number,
  ): Promise<{ id: number; name: string } | null> {
    const meeting = meetingTime instanceof Date ? meetingTime : new Date(meetingTime);

    // 1) 내가 생성한 매치 중 활성 + meetingDateTime 있음
    const myCreated = await this.groupRepository.find({
      where: {
        creatorId: userId,
        isActive: true,
      },
      select: ['id', 'name', 'meetingDateTime'],
    });

    // 2) 내가 참가한 매치 (group_participants)
    const myParticipated = await this.participantRepository
      .createQueryBuilder('participant')
      .innerJoin('participant.group', 'group')
      .where('participant.userId = :userId', { userId })
      .andWhere('group.meetingDateTime IS NOT NULL')
      .andWhere('group.isActive = :isActive', { isActive: true })
      .select(['group.id', 'group.name', 'group.meetingDateTime'])
      .getRawMany();

    const candidates: Array<{ id: number; name: string; meetingDateTime: Date }> = [];

    for (const g of myCreated) {
      if (g.meetingDateTime && (!excludeGroupId || g.id !== excludeGroupId)) {
        candidates.push({
          id: g.id,
          name: g.name,
          meetingDateTime: g.meetingDateTime instanceof Date ? g.meetingDateTime : new Date(g.meetingDateTime),
        });
      }
    }
    for (const row of myParticipated) {
      const id = row.group_id;
      if (excludeGroupId && id === excludeGroupId) continue;
      const other = new Date(row.group_meetingDateTime);
      candidates.push({ id, name: row.group_name, meetingDateTime: other });
    }

    for (const other of candidates) {
      const isSameDate =
        meeting.getFullYear() === other.meetingDateTime.getFullYear() &&
        meeting.getMonth() === other.meetingDateTime.getMonth() &&
        meeting.getDate() === other.meetingDateTime.getDate();
      if (!isSameDate) continue;
      const timeDiff = Math.abs(meeting.getTime() - other.meetingDateTime.getTime());
      if (timeDiff < SAME_SLOT_WINDOW_MS) {
        return { id: other.id, name: other.name };
      }
    }
    return null;
  }

  async create(createGroupDto: CreateGroupDto, creatorId: number): Promise<Group> {
    // 현재 지원 종목: 축구만 (추후 종목 추가 예정)
    const allowedCategories = ['축구'];
    if (!createGroupDto.category || !allowedCategories.includes(createGroupDto.category)) {
      throw new BadRequestException('현재 지원하는 종목은 축구입니다.');
    }

    // 이벤트매치인 경우 사장님 권한 체크
    const groupType = createGroupDto.type || 'normal';
    if (groupType === 'event') {
      const creator = await this.usersService.findById(creatorId);
      if (!creator) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }
      if (!creator.isAdmin && !creator.businessNumberVerified) {
        throw new ForbiddenException('이벤트매치는 체육관 사장님이나 스포츠샵 사장님으로 등록된 사용자만 개최할 수 있습니다.');
      }
    }

    // meetingDateTime이 문자열이면 Date로 변환
    let meetingDateTime: Date | null = null;
    if (createGroupDto.meetingDateTime) {
      if (typeof createGroupDto.meetingDateTime === 'string') {
        meetingDateTime = new Date(createGroupDto.meetingDateTime);
      } else {
        meetingDateTime = createGroupDto.meetingDateTime;
      }
    }

    // 동시간대에 이미 생성·참가한 매치가 있으면 생성 불가
    if (meetingDateTime) {
      const overlapping = await this.findOverlappingGroupForUser(creatorId, meetingDateTime);
      if (overlapping) {
        throw new ConflictException({
          message: `같은 시간대에 이미 다른 매치가 있습니다. (${overlapping.name}) 한 사람이 동시에 여러 매치를 진행할 수 없습니다.`,
          overlappingGroupId: overlapping.id,
        });
      }
    }

    // 가계약 사용 시 확정 전까지 시설 미정이므로 facilityId는 마감 시 설정
    const facilityIds = createGroupDto.provisionalFacilityIds?.length
      ? createGroupDto.provisionalFacilityIds.slice(0, 3)
      : createGroupDto.facilityId != null
        ? [createGroupDto.facilityId]
        : [];
    const group = this.groupRepository.create({
      ...createGroupDto,
      type: groupType,
      creatorId,
      participantCount: 1, // 생성자 포함
      equipment: createGroupDto.equipment || [],
      participants: [], // 명시적으로 빈 배열 설정 (cascade 문제 방지)
      meetingDateTime,
      facilityId: null, // 인원 마감 시 1→2→3순위로 확정 후 설정
    });

    const savedGroup = await this.groupRepository.save(group);

    // 가계약: 1·2·3순위 시설 저장 (실제 예약은 인원 마감 시)
    for (let i = 0; i < facilityIds.length; i++) {
      await this.provisionalFacilityRepository.save(
        this.provisionalFacilityRepository.create({
          groupId: savedGroup.id,
          facilityId: facilityIds[i],
          priority: i + 1,
        }),
      );
    }

    // 가예약: 매치 생성 시점에 가예약 생성 및 groupId 연결 (시설주 캘린더에 "가예약중 - 매치장 닉네임" 표시)
    if (meetingDateTime && facilityIds.length > 0) {
      const meeting = meetingDateTime instanceof Date ? meetingDateTime : new Date(meetingDateTime);
      const reservationDate = meeting.toISOString().slice(0, 10);
      const startTime = `${String(meeting.getHours()).padStart(2, '0')}:${String(meeting.getMinutes()).padStart(2, '0')}`;
      const rawEnd = createGroupDto.meetingEndTime;
      let endTime = typeof rawEnd === 'string' && rawEnd.trim().length >= 5 ? rawEnd.trim().slice(0, 5) : undefined;
      if (!endTime) {
        const [sh, sm] = startTime.split(':').map(Number);
        const endM = (sh * 60 + (sm || 0)) + 120;
        const eh = Math.floor(endM / 60) % 24;
        const em = endM % 60;
        endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
      }
      let linked = await this.reservationsService.linkProvisionalToGroup(
        savedGroup.id,
        creatorId,
        facilityIds,
        reservationDate,
        startTime,
      );
      if (linked === 0) {
        const creator = await this.usersService.findById(creatorId);
        const hostNickname = creator?.nickname ?? '매치장';
        await this.reservationsService.createProvisionalBulk(
          facilityIds,
          reservationDate,
          startTime,
          endTime,
          creatorId,
          hostNickname,
        );
        await this.reservationsService.linkProvisionalToGroup(
          savedGroup.id,
          creatorId,
          facilityIds,
          reservationDate,
          startTime,
        );
      }
    }

    // 게임 설정이 있으면 저장
    if (createGroupDto.gameSettings) {
      const gs = createGroupDto.gameSettings;
      const gameSettings = this.gameSettingsRepository.create({
        groupId: savedGroup.id,
        gameType: gs.gameType || 'individual',
        positions: gs.positions || [],
        minPlayersPerTeam: gs.minPlayersPerTeam || null,
        balanceByExperience: gs.balanceByExperience || false,
        balanceByRank: gs.balanceByRank || false,
        minRankGrade: gs.minRankGrade ?? null,
      });
      await this.gameSettingsRepository.save(gameSettings);

      // 포지션 지정 매치 + 모임장 포지션/팀 선택 시: 모임장을 참가자·포지션에 등록
      // (팀 포지션 지정 gameType 'team' 또는 랭크 포지션 지정 gameType 'individual')
      const creatorPosAllowed =
        !gs.positions?.length ||
        (gs.creatorPositionCode != null && (gs.positions as string[]).includes(gs.creatorPositionCode));
      const isPositionMatchWithCreator =
        (gs.gameType === 'team' || (savedGroup.type === 'rank' && gs.gameType === 'individual')) &&
        gs.creatorPositionCode &&
        gs.creatorTeam &&
        creatorPosAllowed;
      if (isPositionMatchWithCreator) {
        await this.participantRepository.save(
          this.participantRepository.create({
            groupId: savedGroup.id,
            userId: creatorId,
            status: 'joined',
          }),
        );
        await this.participantPositionRepository.save(
          this.participantPositionRepository.create({
            groupId: savedGroup.id,
            userId: creatorId,
            positionCode: gs.creatorPositionCode,
            slotLabel: (gs as any).creatorSlotLabel ?? null,
            team: gs.creatorTeam,
            isPreferred: false,
            positionX: (gs as any).creatorPositionX ?? null,
            positionY: (gs as any).creatorPositionY ?? null,
          }),
        );
      }
    }

    // 게임 설정을 포함하여 다시 조회
    const groupWithSettings = await this.groupRepository.findOne({
      where: { id: savedGroup.id },
      relations: ['creator', 'gameSettings'],
    });

    // 모임 생성자 리더십 점수 업데이트
    try {
      const creator = await this.usersService.findById(creatorId);
      if (creator) {
        await this.usersService.updateUser(creatorId, {
          groupsCreated: (creator.groupsCreated || 0) + 1,
        });
        await this.userScoreService.recalculateAllScores(creatorId);
      }
    } catch (error) {
      // 점수 업데이트 실패해도 모임 생성은 성공으로 처리
      console.error('❌ 리더십 점수 업데이트 실패:', error);
    }

    // 랭크매치 생성 시: 내 지역 심판 알림 수신 동의 유저에게 알림
    if (groupType === 'rank' && savedGroup.location) {
      try {
        const groupRegion = extractRegionKey(savedGroup.location);
        if (groupRegion) {
          const candidates = await this.usersService.findWithRefereeRankMatchNotification();
          for (const u of candidates) {
            if (u.id === creatorId) continue;
            const userRegion = extractRegionKey(u.residenceSido ?? null) || extractRegionKey(u.residenceAddress ?? null);
            if (userRegion === groupRegion) {
              await this.notificationsService.createNotification(
                u.id,
                NotificationType.REFEREE_RANK_MATCH_IN_REGION,
                '내 지역 랭크매치가 생성되었어요',
                `[${savedGroup.name}] 심판 신청이 가능합니다.`,
                { groupId: savedGroup.id, groupName: savedGroup.name },
              );
            }
          }
        }
      } catch (err) {
        this.logger.warn('랭크매치 심판 알림 발송 실패:', err);
      }
    }

    // 매치장을 팔로우한 사람에게 새 매치 알림 (초대 모달 없이 알림만)
    try {
      const creator = await this.usersService.findById(creatorId);
      const creatorNickname = creator?.nickname ?? '매치장';
      const followers = await this.followService.getFollowers(creatorId);
      for (const follower of followers) {
        if (follower.id === creatorId) continue;
        await this.notificationsService.createNotification(
          follower.id,
          NotificationType.CREATOR_NEW_MATCH,
          '새 매치가 올라왔어요',
          `${creatorNickname}님이 새 매치 [${savedGroup.name}]를 만들었습니다.`,
          { groupId: savedGroup.id, groupName: savedGroup.name, creatorId },
        );
      }
    } catch (err) {
      this.logger.warn('매치장 팔로워 알림 발송 실패:', err);
    }

    // participants 관계를 undefined로 설정하여 반환 (cascade 문제 방지)
    if (groupWithSettings) {
      (groupWithSettings as any).participants = undefined;
      return groupWithSettings;
    }

    // participants 관계를 undefined로 설정하여 반환 (cascade 문제 방지)
    (savedGroup as any).participants = undefined;
    return savedGroup;
  }

  async findAll(queryDto: GroupQueryDto): Promise<{ groups: Group[]; total: number }> {
    try {
      return await this.findAllInternal(queryDto);
    } catch (error) {
      this.logger.warn('findAll 실패 (랭크/이벤트 테이블 미준비 시 발생 가능):', error);
      return { groups: [], total: 0 };
    }
  }

  private async findAllInternal(queryDto: GroupQueryDto): Promise<{ groups: Group[]; total: number }> {
    const {
      category,
      search,
      page = 1,
      limit = 20,
      hideClosed,
      onlyRanker,
      gender,
      includeCompleted,
      type,
      meetingDate,
      meetingTime,
      latitude,
      longitude,
      radiusKm = 3,
    } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.creator', 'creator')
      .leftJoinAndSelect('group.gameSettings', 'gameSettings')
      .where('group.isActive = :isActive', { isActive: true });

    // 중복 매치 체크용: 같은 날짜·비슷한 시간(±2시간)·같은 지역
    if (meetingDate && meetingTime && latitude != null && longitude != null) {
      const [y, m, d] = meetingDate.split('-').map(Number);
      const timePart = meetingTime.slice(0, 5).split(':').map(Number);
      const hh = timePart[0] ?? 0;
      const mm = timePart[1] ?? 0;
      const targetStart = new Date(y, (m ?? 1) - 1, d ?? 1, hh, mm, 0);
      const windowStart = new Date(targetStart.getTime() - 2 * 60 * 60 * 1000);
      const windowEnd = new Date(targetStart.getTime() + 2 * 60 * 60 * 1000);
      queryBuilder.andWhere('group.meetingDateTime IS NOT NULL');
      queryBuilder.andWhere(
        'group.meetingDateTime >= :dupStart AND group.meetingDateTime <= :dupEnd',
        { dupStart: windowStart.toISOString(), dupEnd: windowEnd.toISOString() },
      );
      // 반경 내: 하버사인 근사 (위도 1도≈111km, 경도 1도≈cos(위도)*111km)
      const degLat = radiusKm / 111;
      const degLng = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));
      queryBuilder.andWhere(
        'group.latitude BETWEEN :latMin AND :latMax AND group.longitude BETWEEN :lngMin AND :lngMax',
        {
          latMin: latitude - degLat,
          latMax: latitude + degLat,
          lngMin: longitude - degLng,
          lngMax: longitude + degLng,
        },
      );
    }

    // 모임 타입 필터
    if (queryDto.type) {
      queryBuilder.andWhere('group.type = :type', { type: queryDto.type });
    }

    // 카테고리 필터
    if (category && category !== '전체') {
      queryBuilder.andWhere('group.category = :category', { category });
    }

    // 검색어 필터
    if (search) {
      queryBuilder.andWhere(
        '(group.name ILIKE :search OR group.location ILIKE :search OR group.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 성별 필터
    if (gender) {
      queryBuilder.andWhere('group.genderRestriction = :gender', { gender });
    }

    // 종료된 모임 필터
    // 이벤트매치는 종료된 경우 기본적으로 제외, includeCompleted가 true면 포함
    // 일반 모임은 includeCompleted가 true면 종료된 것도 포함
    if (queryDto.type === 'event') {
      // 이벤트매치인 경우
      if (!queryDto.includeCompleted) {
        // 종료된 이벤트매치는 기본적으로 제외
        queryBuilder.andWhere('group.isCompleted = :isCompleted', { isCompleted: false });
      }
    } else {
      // 일반/랭크 모임 또는 타입 미지정 시
      if (!queryDto.includeCompleted) {
        queryBuilder.andWhere('group.isCompleted = :isCompleted', { isCompleted: false });
      }
    }

    // 마감된 모임 가리기
    if (hideClosed) {
      queryBuilder.andWhere(
        '(group.maxParticipants IS NULL OR group.participantCount < group.maxParticipants)',
      );
    }

    // 선수출신 경기만 보기 (랭커가 참가한 모임만)
    // users 테이블 컬럼명: TypeORM 기본이 camelCase이면 "skillLevel", snake면 skill_level
    if (onlyRanker) {
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM group_participants gp INNER JOIN users u ON gp.user_id = u.id WHERE gp.group_id = group.id AND u."skillLevel" = :skillLevel)',
        { skillLevel: 'advanced' },
      );
    }

    // 정렬: 최신순
    queryBuilder.orderBy('group.createdAt', 'DESC');

    // 페이지네이션
    const [groups, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    // 각 모임에 대한 추가 정보 계산 (최근 참가자 증가율, 랭커 참가 여부)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1시간 전

    const groupsWithMetadata = await Promise.all(
      groups.map(async (group) => {
        // 최근 1시간 이내 참가자 수 계산 (레코드 존재 = 참가, status 무시)
        const recentParticipants = await this.participantRepository.count({
          where: {
            groupId: group.id,
            joinedAt: MoreThanOrEqual(oneHourAgo),
          },
        });

        // 랭커가 참가한 모임인지 확인 (일단 skillLevel이 ADVANCED인 참가자가 있으면 랭커로 간주)
        // TODO: 실제 랭커 판단 로직은 나중에 구현 (랭킹 시스템이 완성되면)
        let hasRanker = false;
        try {
          const rankerCount = await this.participantRepository
            .createQueryBuilder('participant')
            .innerJoin('participant.user', 'user')
            .where('participant.groupId = :groupId', { groupId: group.id })
            .andWhere('user.skillLevel = :skillLevel', { skillLevel: 'advanced' })
            .getCount();
          hasRanker = rankerCount > 0;
        } catch (error) {
          // 에러 발생 시 false로 설정
          console.error('랭커 확인 실패:', error);
        }

        return {
          ...group,
          recentJoinCount: recentParticipants,
          hasRanker,
        };
      }),
    );

    return { groups: groupsWithMetadata, total };
  }

  async findOne(id: number, userId?: number): Promise<Group> {
    try {
      // 모임 정보는 relations 없이 먼저 로드 (캐시 문제 방지)
      const group = await this.groupRepository.findOne({
        where: { id },
        relations: ['creator', 'gameSettings'],
      });

      if (!group) {
        throw new NotFoundException('모임을 찾을 수 없습니다.');
      }

      // participants는 별도로 조회하여 항상 최신 데이터 보장 (캐시 무시)
      try {
        group.participants = await this.participantRepository.find({
          where: { groupId: id },
          relations: ['user'],
        });
        // 포지션 지정 매치: 참가자별 포지션 코드 부여
        const participantPositions = await this.participantPositionRepository.find({
          where: { groupId: id },
        });
        for (const p of group.participants) {
          const pos = participantPositions.find((pp) => pp.userId === p.userId);
          (p as any).positionCode = pos?.positionCode ?? null;
          (p as any).slotLabel = pos?.slotLabel ?? null;
          (p as any).team = pos?.team ?? 'red';
          (p as any).positionX = pos?.positionX ?? null;
          (p as any).positionY = pos?.positionY ?? null;
        }
        // 모임장 포지션을 gameSettings에 노출 (상세보기에서 모임장이 참가자 목록에 없을 때 사용)
        if (group.creatorId && group.gameSettings) {
          const creatorPos = participantPositions.find((pp) => pp.userId === group.creatorId);
          if (creatorPos) {
            (group.gameSettings as any).creatorPositionCode = creatorPos.positionCode;
            (group.gameSettings as any).creatorSlotLabel = creatorPos.slotLabel ?? null;
            (group.gameSettings as any).creatorTeam = creatorPos.team ?? 'red';
            (group.gameSettings as any).creatorPositionX = creatorPos.positionX ?? null;
            (group.gameSettings as any).creatorPositionY = creatorPos.positionY ?? null;
          }
        }
      } catch (participantError) {
        console.error('참가자 목록 로드 실패:', participantError);
        group.participants = [];
      }

      // 실제 참가자 수 = group_participants 행 수 (모임장이 포지션 매치로 들어가 있으면 이미 포함됨, 아니면 0명이면 1로 간주)
      const actualParticipantCount = group.participants?.length || 0;
      const syncedCount = Math.max(1, actualParticipantCount);
      
      // participantCount가 실제 참가자 수와 다르면 동기화
      if (group.participantCount !== syncedCount) {
        // participants 관계를 제외하고 participantCount만 업데이트
        // cascade: true 때문에 participants를 함께 저장하면 group_id가 null이 될 수 있음
        this.groupRepository
          .createQueryBuilder()
          .update(Group)
          .set({ participantCount: syncedCount })
          .where('id = :id', { id: group.id })
          .execute()
          .catch((saveError) => {
            console.error('participantCount 동기화 실패:', saveError);
          });
        // group 객체의 participantCount도 업데이트 (반환값에 반영)
        group.participantCount = syncedCount;
      }

      // 사용자가 참가했는지 확인 (선택적) - 레코드 존재 = 참가
      if (userId) {
        const isParticipant = group.participants?.some(
          (p) => p.userId === userId,
        );
        (group as any).isUserParticipant = isParticipant;
        // 찜 여부
        const favorite = await this.favoriteRepository.findOne({
          where: { userId, groupId: id },
        });
        (group as any).isFavorited = !!favorite;
        // 예약 대기 여부 및 대기 순서
        const waitlistEntry = await this.waitlistRepository.findOne({
          where: { userId, groupId: id },
        });
        (group as any).isUserOnWaitlist = !!waitlistEntry;
        if (waitlistEntry) {
          const position = await this.waitlistRepository
            .createQueryBuilder('w')
            .where('w.groupId = :groupId', { groupId: id })
            .andWhere('w.createdAt <= :createdAt', { createdAt: waitlistEntry.createdAt })
            .getCount();
          (group as any).waitlistPosition = position;
        } else {
          (group as any).waitlistPosition = null;
        }
      }

      // 심판 목록 조회
      try {
        const referees = await this.refereeRepository.find({
          where: { groupId: id },
          relations: ['user'],
        });
        (group as any).referees = referees.map((r) => ({
          id: r.id,
          userId: r.userId,
          appliedAt: r.appliedAt,
          user: r.user,
        }));
        if (userId) {
          const isReferee = referees.some((r) => r.userId === userId);
          (group as any).isUserReferee = isReferee;
        }
      } catch (refereeError) {
        console.error('심판 목록 로드 실패:', refereeError);
        (group as any).referees = [];
      }

      // 매치장(creator) 정보를 명시적으로 평문 객체로 넣어 클라이언트에서 항상 표시되도록 함
      (group as any).creator = group.creator
        ? {
            id: group.creator.id,
            nickname: group.creator.nickname,
            tag: group.creator.tag ?? null,
            profileImageUrl: group.creator.profileImageUrl ?? null,
          }
        : null;

      // 매치장(시설) 정보: facilityId가 있으면 시설 조회 후 응답에 포함
      if (group.facilityId) {
        try {
          const facility = await this.facilitiesService.findOne(group.facilityId);
          (group as any).facility = {
            id: facility.id,
            name: facility.name,
            address: facility.address,
            type: facility.type,
            image: facility.image ?? (Array.isArray(facility.images) && facility.images.length > 0 ? facility.images[0] : null),
          };
        } catch {
          (group as any).facility = null;
        }
      } else {
        (group as any).facility = null;
      }

      // 가계약: 1·2·3순위 시설 목록 (인원 마감 전 표시, 마감 시 1순위 가능 시설로 확정)
      try {
        const provisionals = await this.provisionalFacilityRepository.find({
          where: { groupId: id },
          order: { priority: 'ASC' },
          relations: ['facility'],
        });
        (group as any).provisionalFacilities = provisionals.map((p) => ({
          priority: p.priority,
          facilityId: p.facilityId,
          facility: (p as any).facility
            ? {
                id: (p as any).facility.id,
                name: (p as any).facility.name,
                address: (p as any).facility.address,
                type: (p as any).facility.type,
                image: (p as any).facility.image ?? (Array.isArray((p as any).facility.images) && (p as any).facility.images.length > 0 ? (p as any).facility.images[0] : null),
              }
            : null,
        }));
      } catch (provisionalError) {
        console.error('가계약 시설 목록 로드 실패:', provisionalError);
        (group as any).provisionalFacilities = [];
      }

      return group;
    } catch (error) {
      // NotFoundException은 그대로 throw
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // 그 외의 에러는 로깅하고 재throw
      console.error('findOne 에러:', error);
      throw error;
    }
  }

  /** 찜한 매치 개수 */
  async getFavoriteCount(userId: number): Promise<{ count: number }> {
    const count = await this.favoriteRepository.count({ where: { userId } });
    return { count };
  }

  /** 찜 토글. 반환: { favorited: boolean } */
  async toggleFavorite(groupId: number, userId: number): Promise<{ favorited: boolean }> {
    await this.findOne(groupId, userId);
    const existing = await this.favoriteRepository.findOne({
      where: { userId, groupId },
    });
    if (existing) {
      await this.favoriteRepository.remove(existing);
      return { favorited: false };
    }
    await this.favoriteRepository.save(
      this.favoriteRepository.create({ userId, groupId }),
    );
    return { favorited: true };
  }

  async update(id: number, updateGroupDto: UpdateGroupDto, userId: number): Promise<Group> {
    const group = await this.findOne(id);

    // 생성자만 수정 가능
    if (group.creatorId !== userId) {
      throw new ForbiddenException('모임을 수정할 권한이 없습니다.');
    }

    // participants 관계를 제외하고 업데이트
    // cascade: true 때문에 participants를 함께 저장하면 group_id가 null이 될 수 있음
    await this.groupRepository
      .createQueryBuilder()
      .update(Group)
      .set(updateGroupDto)
      .where('id = :id', { id })
      .execute();
    
    // group 객체도 업데이트하여 반환
    Object.assign(group, updateGroupDto);
    return group;
  }

  async remove(id: number, userId: number): Promise<void> {
    const group = await this.findOne(id);

    // 생성자만 삭제 가능
    if (group.creatorId !== userId) {
      throw new ForbiddenException('모임을 삭제할 권한이 없습니다.');
    }

    // 실제 삭제 대신 비활성화
    // participants 관계를 제외하고 isActive만 업데이트
    await this.groupRepository
      .createQueryBuilder()
      .update(Group)
      .set({ isActive: false })
      .where('id = :id', { id })
      .execute();
  }

  async joinGroup(groupId: number, userId: number, positionCode?: string, team?: string, slotLabel?: string): Promise<Group> {
    console.log('🚀 joinGroup 시작:', {
      원본_groupId: groupId,
      원본_userId: userId,
      groupId_타입: typeof groupId,
      userId_타입: typeof userId,
    });

    try {
      // groupId와 userId 유효성 검사 및 숫자 변환
      const numericGroupId = Number(groupId);
      const numericUserId = Number(userId);
      
      console.log('🔢 숫자 변환 후:', {
        numericGroupId,
        numericUserId,
        groupId_유효성: !isNaN(numericGroupId) && numericGroupId > 0,
        userId_유효성: !isNaN(numericUserId) && numericUserId > 0,
      });
      
      if (!numericGroupId || isNaN(numericGroupId) || !numericUserId || isNaN(numericUserId)) {
        console.error('❌ ID 유효성 검사 실패');
        throw new BadRequestException('모임 ID 또는 사용자 ID가 유효하지 않습니다.');
      }

      // 모임 정보 조회
      console.log('📋 모임 정보 조회 시작:', { numericGroupId, numericUserId });
      const group = await this.findOne(numericGroupId, numericUserId);
      if (!group) {
        console.error('❌ 모임을 찾을 수 없음:', { numericGroupId });
        throw new NotFoundException('모임을 찾을 수 없습니다.');
      }
      console.log('✅ 모임 정보 조회 완료:', {
        groupId: group.id,
        groupName: group.name,
        creatorId: group.creatorId,
        participantCount: group.participantCount,
        maxParticipants: group.maxParticipants,
      });

      // 최대 참여자 수 체크
      if (group.maxParticipants && group.participantCount >= group.maxParticipants) {
        console.error('❌ 모임 인원 가득참:', {
          participantCount: group.participantCount,
          maxParticipants: group.maxParticipants,
        });
        throw new ConflictException('모임 인원이 가득 찼습니다.');
      }

      // 매치 10분 전까지 참가 신청 가능
      if (group.meetingDateTime) {
        const meetingTime = new Date(group.meetingDateTime);
        const cutoffTime = new Date(meetingTime.getTime() - 10 * 60 * 1000);
        if (new Date() > cutoffTime) {
          throw new BadRequestException('매치 시작 10분 전까지만 참가 신청이 가능합니다.');
        }
      }

      // 이미 참가했는지 확인 (레코드 존재 = 참가)
      console.log('🔍 기존 참가자 확인:', { numericGroupId, numericUserId });
      const existingParticipant = await this.participantRepository.findOne({
        where: { groupId: numericGroupId, userId: numericUserId },
      });

      if (existingParticipant) {
        console.error('❌ 이미 참가한 모임:', {
          participantId: existingParticipant.id,
          groupId: existingParticipant.groupId,
          userId: existingParticipant.userId,
        });
        throw new ConflictException('이미 참가한 모임입니다.');
      }
      console.log('✅ 기존 참가자 없음 - 새로 참가 가능');

      // 생성자는 자동으로 참가자이므로 별도 처리 불필요
      if (group.creatorId === numericUserId) {
        console.error('❌ 모임 생성자는 이미 참가 상태');
        throw new ConflictException('모임 생성자는 이미 참가 상태입니다.');
      }

      // 사용자 정보 가져오기 (알림 전송용 및 성별 체크)
      const user = await this.usersService.findById(numericUserId);
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      // 성별 제한 체크
      if (group.genderRestriction) {
        if (user.gender !== group.genderRestriction) {
          const genderText = group.genderRestriction === 'male' ? '남자' : '여자';
          throw new ForbiddenException(`이 모임은 ${genderText}만 참가할 수 있습니다.`);
        }
      }

      // 동시간대에 이미 생성·참가한 매치가 있으면 참가 불가 (생성한 매치 + 참가한 매치 모두 포함)
      if (group.meetingDateTime) {
        const meetingTime = new Date(group.meetingDateTime);
        const overlapping = await this.findOverlappingGroupForUser(numericUserId, meetingTime, numericGroupId);
        if (overlapping) {
          throw new ConflictException({
            message: `같은 시간대에 이미 다른 매치가 있습니다. (${overlapping.name}) 한 사람이 동시에 여러 매치에 참여할 수 없습니다.`,
            overlappingGroupId: overlapping.id,
          });
        }
      }

      // 이미 참가했는지 다시 한 번 확인 (동시성 문제 방지)
      const duplicateCheck = await this.participantRepository.findOne({
        where: { groupId: numericGroupId, userId: numericUserId },
      });

      if (duplicateCheck) {
        throw new ConflictException('이미 참가한 모임입니다.');
      }

      // 참가비(포인트) 차감: 축구는 항상 결제, 그 외는 hasFee/feeAmount 있을 때
      const FOOTBALL_FEE_NORMAL = 10000;
      const FOOTBALL_FEE_EARLY = 8000;
      let feePaid = 0;
      const needsFee =
        group.category === '축구' ||
        (group.hasFee && group.feeAmount != null && group.feeAmount > 0);
      if (needsFee) {
        let required =
          group.category === '축구' ? FOOTBALL_FEE_NORMAL : (group.feeAmount ?? 0);
        if (group.category === '축구') {
          const meeting = group.meetingDateTime ? new Date(group.meetingDateTime) : null;
          if (meeting) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const meetingDate = new Date(meeting);
            meetingDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((meetingDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
            required = diffDays >= 1 ? FOOTBALL_FEE_EARLY : FOOTBALL_FEE_NORMAL;
          } else {
            required = FOOTBALL_FEE_NORMAL;
          }
        }
        feePaid = required;
        await this.pointsService.addTransaction(
          numericUserId,
          -feePaid,
          PointTransactionType.USE,
          `매치 참가비: ${group.name}`,
        );
      }

      // 참가자 추가 - Raw SQL을 사용하여 직접 INSERT 실행
      console.log('📝 참가자 INSERT 시작:', {
        numericGroupId,
        numericUserId,
        groupId_타입: typeof numericGroupId,
        userId_타입: typeof numericUserId,
        groupId_값: numericGroupId,
        userId_값: numericUserId,
      });

      // 파라미터 최종 검증
      if (!numericGroupId || isNaN(numericGroupId) || numericGroupId <= 0) {
        console.error('❌ 모임 ID 유효성 검사 실패:', { numericGroupId });
        throw new BadRequestException(`유효하지 않은 모임 ID: ${numericGroupId}`);
      }
      if (!numericUserId || isNaN(numericUserId) || numericUserId <= 0) {
        console.error('❌ 사용자 ID 유효성 검사 실패:', { numericUserId });
        throw new BadRequestException(`유효하지 않은 사용자 ID: ${numericUserId}`);
      }

      let insertSuccess = false;
      
      try {
        // 방법 1: createQueryBuilder를 사용한 INSERT 시도
        console.log('🔧 방법 1: createQueryBuilder INSERT 시도');
        const queryBuilder = this.participantRepository
          .createQueryBuilder()
          .insert()
          .into(GroupParticipant)
          .values({
            groupId: numericGroupId,
            userId: numericUserId,
            status: 'joined',
          });

        const sql = queryBuilder.getSql();
        const params = queryBuilder.getParameters();
        console.log('📄 생성된 SQL:', { sql, params });

        const insertResult = await queryBuilder.execute();
        console.log('✅ createQueryBuilder INSERT 성공:', {
          result: insertResult,
          raw: insertResult.raw,
          identifiers: insertResult.identifiers,
        });

        if (insertResult && (insertResult.raw?.length > 0 || insertResult.identifiers?.length > 0)) {
          insertSuccess = true;
          console.log('✅ 참가자 레코드 저장 완료 (createQueryBuilder)');
          // 포지션 지정 매치일 때 포지션 저장 (team 또는 랭크 포지션 지정 개인)
          if (positionCode) {
            const settings = await this.gameSettingsRepository.findOne({ where: { groupId: numericGroupId } });
            const isPositionMatch =
              settings &&
              (!settings.positions?.length || settings.positions.includes(positionCode)) &&
              (settings.gameType === 'team' || (group.type === 'rank' && settings.gameType === 'individual'));
            if (isPositionMatch) {
              await this.participantPositionRepository.save(
                this.participantPositionRepository.create({
                  groupId: numericGroupId,
                  userId: numericUserId,
                  positionCode,
                  slotLabel: slotLabel ?? null,
                  team: team ?? 'red',
                  isPreferred: false,
                }),
              );
            }
          }
        }
      } catch (saveError: any) {
        console.error('❌ createQueryBuilder INSERT 실패:', {
          error: saveError.message,
          code: saveError.code,
          detail: saveError.detail,
          constraint: saveError.constraint,
          stack: saveError.stack?.substring(0, 500),
        });

        // 방법 2: Raw SQL로 재시도
        try {
          console.log('🔧 방법 2: Raw SQL INSERT 시도');
          const insertQuery = `
            INSERT INTO group_participants (group_id, user_id, status, joined_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, group_id, user_id, status, joined_at
          `;
          
          console.log('📄 Raw SQL 쿼리:', {
            query: insertQuery,
            params: [numericGroupId, numericUserId, 'joined'],
            param1_타입: typeof numericGroupId,
            param2_타입: typeof numericUserId,
            param1_값: numericGroupId,
            param2_값: numericUserId,
          });

          const insertResult = await this.participantRepository.manager.query(insertQuery, [
            numericGroupId,
            numericUserId,
            'joined',
          ]);

          console.log('✅ Raw SQL INSERT 성공:', {
            result: insertResult,
            resultType: typeof insertResult,
            isArray: Array.isArray(insertResult),
            length: insertResult?.length,
            firstItem: insertResult?.[0],
          });

          if (insertResult && Array.isArray(insertResult) && insertResult.length > 0) {
            insertSuccess = true;
            console.log('✅ 참가자 레코드 저장 완료 (Raw SQL)');
            if (positionCode) {
              const settings = await this.gameSettingsRepository.findOne({ where: { groupId: numericGroupId } });
              const isPositionMatch =
                settings &&
                (!settings.positions?.length || settings.positions.includes(positionCode)) &&
                (settings.gameType === 'team' || (group.type === 'rank' && settings.gameType === 'individual'));
              if (isPositionMatch) {
                await this.participantPositionRepository.save(
                  this.participantPositionRepository.create({
                    groupId: numericGroupId,
                    userId: numericUserId,
                    positionCode,
                    slotLabel: slotLabel ?? null,
                    team: team ?? 'red',
                    isPreferred: false,
                  }),
                );
              }
            }
          }
        } catch (rawSqlError: any) {
          console.error('❌ Raw SQL INSERT도 실패:', {
            error: rawSqlError.message,
            code: rawSqlError.code,
            detail: rawSqlError.detail,
            constraint: rawSqlError.constraint,
          });

          // 에러 코드에 따른 처리
          // UNIQUE 제약 조건 위반 (중복 참가 시도)
          if (rawSqlError.code === '23505' || rawSqlError.message?.includes('UNIQUE')) {
            // 실제로 레코드가 저장되었는지 확인
            const existingParticipant = await this.participantRepository.findOne({
              where: { groupId: numericGroupId, userId: numericUserId },
            });
            
            if (existingParticipant) {
              // 실제로는 저장되었으므로 성공으로 처리
              insertSuccess = true;
              console.log('✓ 참가자 레코드가 이미 존재함 (중복 저장 시도):', {
                participantId: existingParticipant.id,
                groupId: numericGroupId,
                userId: numericUserId,
              });
            } else {
              throw new ConflictException('이미 참가한 모임입니다.');
            }
          }
          // NOT NULL 제약 조건 위반 처리
          else if (rawSqlError.code === '23502' || rawSqlError.message?.includes('null value')) {
            console.error('⚠️ 참가자 저장 실패 (NULL 제약조건):', {
              groupId: numericGroupId,
              userId: numericUserId,
              error: rawSqlError.message,
              code: rawSqlError.code,
              detail: rawSqlError.detail,
            });
            
            // 실제로 레코드가 저장되었는지 확인 (중복 저장 시도일 수 있음)
            const existingParticipant = await this.participantRepository.findOne({
              where: { groupId: numericGroupId, userId: numericUserId },
            });
            
            if (existingParticipant) {
              // 실제로는 저장되었으므로 성공으로 처리
              insertSuccess = true;
              console.log('✓ 참가자 레코드가 이미 존재함 (NULL 제약조건 에러 무시):', {
                participantId: existingParticipant.id,
                groupId: numericGroupId,
                userId: numericUserId,
              });
            } else {
              // 실제로 저장되지 않았으므로 에러 발생
              throw new BadRequestException('모임 참가 정보가 올바르지 않습니다. 다시 시도해주세요.');
            }
          } else {
            // 다른 에러인 경우에도 레코드가 저장되었는지 확인
            const existingParticipant = await this.participantRepository.findOne({
              where: { groupId: numericGroupId, userId: numericUserId },
            });
            
            if (existingParticipant) {
              // 실제로는 저장되었으므로 성공으로 처리
              insertSuccess = true;
              console.log('✓ 참가자 레코드가 이미 존재함 (기타 에러 무시):', {
                participantId: existingParticipant.id,
                groupId: numericGroupId,
                userId: numericUserId,
                error: rawSqlError.message,
              });
            } else {
              console.error('참가자 저장 실패:', {
                groupId: numericGroupId,
                userId: numericUserId,
                error: rawSqlError.message,
                code: rawSqlError.code,
              });
              throw new ConflictException('모임 참가에 실패했습니다. 다시 시도해주세요.');
            }
          }
        }
      }

      // INSERT가 성공하지 않았으면 포인트 환불 후 에러 발생
      if (!insertSuccess) {
        if (feePaid > 0) {
          try {
            await this.pointsService.addTransaction(
              numericUserId,
              feePaid,
              PointTransactionType.ADJUST,
              '매치 참가 실패 환불',
            );
          } catch (refundError) {
            this.logger.error('참가 실패 시 포인트 환불 오류:', refundError);
          }
        }
        throw new InternalServerErrorException('참가자 레코드 저장에 실패했습니다.');
      }

      // 참가자 수 업데이트: 실제 참가자 수를 계산하여 동기화
      const actualParticipantCount = await this.participantRepository.count({
        where: { groupId: group.id },
      });
      const newParticipantCount = Math.max(1, actualParticipantCount);
      
      // participants 관계를 제외하고 participantCount만 업데이트
      console.log('📊 참가자 수 업데이트:', {
        groupId: group.id,
        previousCount: group.participantCount,
        newCount: newParticipantCount,
        actualParticipantCount,
      });
      
      await this.groupRepository
        .createQueryBuilder()
        .update(Group)
        .set({ participantCount: newParticipantCount })
        .where('id = :id', { id: group.id })
        .execute();
      
      // group 객체의 participantCount도 업데이트 (반환값에 반영)
      group.participantCount = newParticipantCount;

      // 모임장에게 알림 전송 (참가자가 모임장이 아닌 경우에만)
      if (group.creatorId !== numericUserId) {
        try {
          console.log('📬 모임장 알림 전송 시작:', {
            creatorId: group.creatorId,
            participantId: numericUserId,
            groupId: group.id,
            groupName: group.name,
          });
          
          const participantUser = await this.usersService.findById(numericUserId);
          if (participantUser && participantUser.nickname) {
            await this.notificationsService.createNotification(
              group.creatorId,
              NotificationType.GROUP_JOIN,
              '새로운 참가자',
              `${participantUser.nickname}${participantUser.tag || ''}님이 "${group.name}" 모임에 참가했습니다.`,
              {
                groupId: group.id,
                groupName: group.name,
                participantId: numericUserId,
                participantNickname: participantUser.nickname + (participantUser.tag || ''),
              },
            );
            console.log('✅ 모임장 알림 전송 완료:', {
              creatorId: group.creatorId,
              participantNickname: participantUser.nickname + (participantUser.tag || ''),
            });
          } else {
            console.warn('⚠️ 참가자 정보를 찾을 수 없어 알림을 전송하지 않습니다:', {
              participantId: numericUserId,
            });
          }
        } catch (error) {
          // 알림 생성 실패해도 모임 참가는 성공으로 처리
          console.error('❌ 모임장 알림 생성 실패:', error);
        }
      } else {
        console.log('ℹ️ 참가자가 모임장이므로 알림을 전송하지 않습니다.');
      }

      // 점수 업데이트 (참가자만, 모임장은 제외)
      if (group.creatorId !== numericUserId) {
        try {
          await this.userScoreService.onGroupJoin(numericUserId, group.id, group.category);
        } catch (error) {
          // 점수 업데이트 실패해도 모임 참가는 성공으로 처리
          console.error('❌ 점수 업데이트 실패:', error);
        }
      }

      // 예약 대기 등록했던 사용자는 참가 시 대기열에서 제거
      await this.waitlistRepository.delete({ groupId: numericGroupId, userId: numericUserId });

      // 참가 완료 후 그룹 정보 반환 (에러 처리 강화)
      try {
        return await this.findOne(groupId, userId);
      } catch (error) {
        // findOne 실패 시에도 참가자는 이미 저장되었으므로 기본 정보만 반환
        console.error('모임 상세 정보 조회 실패 (참가는 성공):', error);
        
        // 참가자 목록을 별도로 로드하여 반환
        const savedGroup = await this.groupRepository.findOne({
          where: { id: groupId },
          relations: ['creator'],
        });
        if (!savedGroup) {
          throw new NotFoundException('모임을 찾을 수 없습니다.');
        }

        // 참가자 목록 로드
        try {
          savedGroup.participants = await this.participantRepository.find({
            where: { groupId: groupId },
            relations: ['user'],
          });
        } catch (participantError) {
          console.error('참가자 목록 로드 실패:', participantError);
          savedGroup.participants = [];
        }

        // 실제 참가자 수 = group_participants 행 수 (모임장 포함 여부와 무관하게 행 개수만 사용)
        const actualCount = savedGroup.participants?.length || 0;
        savedGroup.participantCount = Math.max(1, actualCount);

        // 사용자가 참가했는지 확인
        if (userId) {
          const isParticipant = savedGroup.participants?.some(
            (p) => p.userId === userId,
          );
          (savedGroup as any).isUserParticipant = isParticipant;
        }

        return savedGroup;
      }
    } catch (error) {
      // 모든 에러를 로깅하고 재throw
      console.error('joinGroup 에러 상세:', {
        groupId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // 이미 HttpException이면 그대로 throw
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof ForbiddenException) {
        throw error;
      }
      // 그 외의 에러는 InternalServerError로 변환
      throw new InternalServerErrorException(`모임 참가 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** 참가자가 자신의 포지션/팀을 변경 (포지션 지정 매치만) */
  async updateMyPosition(
    groupId: number,
    userId: number,
    positionCode: string,
    team: 'red' | 'blue',
    slotLabel?: string | null,
    positionX?: number | null,
    positionY?: number | null,
  ): Promise<Group> {
    const numericGroupId = Number(groupId);
    const numericUserId = Number(userId);
    if (!numericGroupId || isNaN(numericGroupId) || !numericUserId || isNaN(numericUserId)) {
      throw new BadRequestException('모임 ID 또는 사용자 ID가 유효하지 않습니다.');
    }
    const group = await this.groupRepository.findOne({
      where: { id: numericGroupId },
      relations: ['gameSettings'],
    });
    if (!group) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }
    const participant = await this.participantRepository.findOne({
      where: { groupId: numericGroupId, userId: numericUserId },
    });
    if (!participant) {
      throw new BadRequestException('참가자만 포지션을 변경할 수 있습니다.');
    }
    const settings = group.gameSettings;
    const isPositionMatch =
      settings &&
      (!settings.positions?.length || settings.positions.includes(positionCode)) &&
      (settings.gameType === 'team' || (group.type === 'rank' && settings.gameType === 'individual'));
    if (!isPositionMatch) {
      throw new BadRequestException('이 매치에서는 해당 포지션을 선택할 수 없습니다.');
    }
    const existing = await this.participantPositionRepository.findOne({
      where: { groupId: numericGroupId, userId: numericUserId },
    });
    if (existing) {
      existing.positionCode = positionCode;
      existing.team = team;
      existing.slotLabel = slotLabel ?? null;
      if (positionX !== undefined) existing.positionX = positionX ?? null;
      if (positionY !== undefined) existing.positionY = positionY ?? null;
      await this.participantPositionRepository.save(existing);
    } else {
      await this.participantPositionRepository.save(
        this.participantPositionRepository.create({
          groupId: numericGroupId,
          userId: numericUserId,
          positionCode,
          slotLabel: slotLabel ?? null,
          team,
          isPreferred: false,
          positionX: positionX ?? null,
          positionY: positionY ?? null,
        }),
      );
    }
    return this.findOne(numericGroupId, numericUserId);
  }

  async leaveGroup(groupId: number, userId: number): Promise<void> {
    try {
      // groupId와 userId 유효성 검사
      const numericGroupId = Number(groupId);
      const numericUserId = Number(userId);
      
      if (!numericGroupId || isNaN(numericGroupId) || !numericUserId || isNaN(numericUserId)) {
        throw new BadRequestException('모임 ID 또는 사용자 ID가 유효하지 않습니다.');
      }

      // 모임 정보 조회 (findOne 대신 직접 조회하여 에러 방지)
      let group: Group | null = null;
      try {
        group = await this.groupRepository.findOne({
          where: { id: numericGroupId },
          relations: ['creator'],
        });
      } catch (findError) {
        console.error('모임 조회 실패:', findError);
        throw new NotFoundException('모임을 찾을 수 없습니다.');
      }

      if (!group) {
        throw new NotFoundException('모임을 찾을 수 없습니다.');
      }

      // 생성자는 탈퇴 불가
      if (group.creatorId === numericUserId) {
        throw new ForbiddenException('모임 생성자는 탈퇴할 수 없습니다.');
      }

      // 모임 시간 1시간 전에는 취소 불가
      if (group.meetingDateTime) {
        const meetingTime = new Date(group.meetingDateTime);
        const now = new Date();
        const oneHourBefore = new Date(meetingTime.getTime() - 60 * 60 * 1000); // 1시간 전
        
        if (now >= oneHourBefore) {
          throw new ForbiddenException('모임 시간 1시간 전부터는 취소할 수 없습니다.');
        }
      }

      // 참가자 찾기 (status와 관계없이 모든 참가자 조회)
      let participant = await this.participantRepository.findOne({
        where: { 
          groupId: numericGroupId, 
          userId: numericUserId
        },
      });

      // 관계를 통해서도 찾기 시도
      if (!participant) {
        participant = await this.participantRepository.findOne({
          where: { 
            group: { id: numericGroupId },
            user: { id: numericUserId }
          },
          relations: ['group', 'user'],
        });
      }

      if (!participant) {
        console.error('참가자 찾기 실패:', {
          groupId: numericGroupId,
          userId: numericUserId,
          groupCreatorId: group.creatorId,
        });
        throw new NotFoundException('참가한 모임이 아닙니다.');
      }

      console.log('참가자 삭제 시작:', {
        participantId: participant.id,
        groupId: numericGroupId,
        userId: numericUserId,
        currentStatus: participant.status,
      });

      // 포지션 지정 매치: 참가자 포지션 레코드 삭제
      await this.participantPositionRepository.delete({
        groupId: numericGroupId,
        userId: numericUserId,
      });

      // 참가자 레코드를 완전히 삭제
      // 방법 1: delete() 메서드 사용 (가장 간단)
      const deleteResult = await this.participantRepository.delete({ 
        id: participant.id 
      });
      
      console.log('참가자 삭제 결과 (delete):', {
        participantId: participant.id,
        groupId: numericGroupId,
        userId: numericUserId,
        affected: deleteResult.affected,
      });

      // 삭제가 실제로 이루어졌는지 확인
      if (deleteResult.affected === 0) {
        // 방법 2: createQueryBuilder로 재시도
        console.log('delete() 실패, createQueryBuilder로 재시도...');
        const queryResult = await this.participantRepository
          .createQueryBuilder()
          .delete()
          .from(GroupParticipant)
          .where('id = :id', { id: participant.id })
          .execute();
        
        console.log('참가자 삭제 결과 (queryBuilder):', {
          participantId: participant.id,
          affected: queryResult.affected,
        });

        if (queryResult.affected === 0) {
          console.error('⚠️ 참가자 삭제 실패: 모든 방법 실패', {
            participantId: participant.id,
            groupId: numericGroupId,
            userId: numericUserId,
            participantData: participant,
          });
          throw new InternalServerErrorException('참가자 삭제에 실패했습니다. 데이터베이스 오류가 발생했을 수 있습니다.');
        }
      }

      // 삭제 확인: 실제로 레코드가 삭제되었는지 재확인 (약간의 지연 후)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const verifyDeleted = await this.participantRepository.findOne({
        where: { id: participant.id },
      });

      if (verifyDeleted) {
        console.error('⚠️ 참가자 삭제 확인 실패: 레코드가 여전히 존재합니다.', {
          participantId: participant.id,
          groupId: numericGroupId,
          userId: numericUserId,
          foundRecord: verifyDeleted,
        });
        throw new InternalServerErrorException('참가자 삭제에 실패했습니다. 레코드가 여전히 존재합니다.');
      }

      console.log('✓ 참가자 삭제 완료: 레코드가 정상적으로 삭제되었습니다.');

      // 참가자 수 업데이트 (최소 1명 유지 - 모임장)
      // 레코드가 존재하는 참가자 수를 계산 (status는 무시, 레코드 존재 = 참가)
      const actualParticipantCount = await this.participantRepository.count({
        where: { groupId: numericGroupId },
      });
      const newParticipantCount = Math.max(1, actualParticipantCount);
      
      // participants 관계를 제외하고 participantCount만 업데이트
      // cascade: true 때문에 participants를 함께 저장하면 group_id가 null이 될 수 있음
      await this.groupRepository
        .createQueryBuilder()
        .update(Group)
        .set({ participantCount: newParticipantCount })
        .where('id = :id', { id: numericGroupId })
        .execute();
      
      // group 객체의 participantCount도 업데이트 (로깅용)
      group.participantCount = newParticipantCount;

      // 예약 대기: 빈 자리 생기면 1순위 사용자에게 알림 후 대기열에서 제거
      if (group.maxParticipants != null && newParticipantCount < group.maxParticipants) {
        const first = await this.waitlistRepository.findOne({
          where: { groupId: numericGroupId },
          order: { createdAt: 'ASC' },
          relations: ['user'],
        });
        if (first) {
          try {
            await this.notificationsService.createNotification(
              first.userId,
              NotificationType.GROUP_WAITLIST_SPOT_OPEN,
              '매치 빈 자리 알림',
              `"${group.name}" 매치에 빈 자리가 생겼습니다. 참가 신청을 해보세요.`,
              { groupId: numericGroupId, groupName: group.name },
            );
            await this.waitlistRepository.delete({ id: first.id });
          } catch (notifyErr) {
            this.logger.warn('예약 대기 알림 전송 실패:', notifyErr);
          }
        }
      }
      
      console.log('참가자 수 업데이트 완료:', {
        groupId: numericGroupId,
        previousCount: group.participantCount,
        newCount: group.participantCount,
        actualJoinedCount: actualParticipantCount,
      });
    } catch (error) {
      // 이미 HttpException이면 그대로 throw
      if (error instanceof NotFoundException || 
          error instanceof ConflictException || 
          error instanceof ForbiddenException ||
          error instanceof BadRequestException) {
        throw error;
      }
      
      // 그 외의 에러는 로깅하고 InternalServerError로 변환
      console.error('leaveGroup 에러 상세:', {
        groupId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      throw new InternalServerErrorException(
        `모임 나가기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async checkParticipation(groupId: number, userId: number): Promise<boolean> {
    // 레코드 존재 = 참가 (status는 무시)
    const participant = await this.participantRepository.findOne({
      where: { groupId, userId },
    });
    return !!participant;
  }

  /** 예약 대기 등록. 인원이 가득 찬 매치에만 가능. 매치 타입 무관. */
  async addToWaitlist(groupId: number, userId: number): Promise<{ position: number }> {
    const group = await this.groupRepository.findOne({ where: { id: groupId }, relations: [] });
    if (!group) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }
    if (!group.maxParticipants || group.participantCount < group.maxParticipants) {
      throw new BadRequestException('인원이 마감된 매치에만 예약 대기를 할 수 있습니다.');
    }
    const isParticipant = await this.participantRepository.findOne({
      where: { groupId, userId },
    });
    if (isParticipant) {
      throw new ConflictException('이미 참가한 매치에는 예약 대기를 할 수 없습니다.');
    }
    const creatorId = group.creatorId;
    if (userId === creatorId) {
      throw new BadRequestException('매치장은 예약 대기를 할 수 없습니다.');
    }
    const existing = await this.waitlistRepository.findOne({
      where: { groupId, userId },
    });
    if (existing) {
      const position = await this.waitlistRepository
        .createQueryBuilder('w')
        .where('w.groupId = :groupId', { groupId })
        .andWhere('w.createdAt <= :createdAt', { createdAt: existing.createdAt })
        .getCount();
      return { position };
    }
    const entry = await this.waitlistRepository.save(
      this.waitlistRepository.create({ groupId, userId }),
    );
    const position = await this.waitlistRepository
      .createQueryBuilder('w')
      .where('w.groupId = :groupId', { groupId })
      .andWhere('w.createdAt <= :createdAt', { createdAt: entry.createdAt })
      .getCount();
    return { position };
  }

  /** 예약 대기 취소 */
  async removeFromWaitlist(groupId: number, userId: number): Promise<void> {
    const result = await this.waitlistRepository.delete({ groupId, userId });
    if (result.affected === 0) {
      throw new NotFoundException('예약 대기 내역이 없습니다.');
    }
  }

  /** 내가 생성한 모임 목록 (활성인 것만, 완료 여부 무관). my-groups용 */
  async findMyGroups(creatorId: number): Promise<Group[]> {
    const groups = await this.groupRepository.find({
      where: { creatorId, isActive: true },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return groups;
  }

  /** 활동 기록용: 완료된 매치만 반환. 매치 종료 시각이 지났거나 isCompleted인 경우.
   * 인원 모집에 성공한 매치만 포함 (minParticipants 없거나 participantCount >= minParticipants). */
  async findMyCreationsCompleted(creatorId: number): Promise<Group[]> {
    const now = new Date();
    const groups = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.creator', 'creator')
      .where('group.creatorId = :creatorId', { creatorId })
      .andWhere('group.isActive = :isActive', { isActive: true })
      .andWhere(
        '(group.isCompleted = :isCompleted OR (group.meetingDateTime IS NOT NULL AND group.meetingDateTime <= :now))',
        { isCompleted: true, now },
      )
      .andWhere(
        '(group.minParticipants IS NULL OR group.participantCount >= group.minParticipants)',
      )
      .orderBy('group.createdAt', 'DESC')
      .take(50)
      .getMany();
    return groups;
  }

  /** 내가 참가한 모임 목록 (다른 사람이 만든 모임에 참가한 것만, 생성한 모임 제외).
   *  매치 종료 시각이 지난 경우만 집계. 인원 모집에 성공한 매치만 포함. 삭제된 모임 제외. 각 그룹에 myPositionCode 부여 */
  async findMyParticipations(userId: number): Promise<Group[]> {
    const participants = await this.participantRepository.find({
      where: { userId },
      relations: ['group', 'group.creator'],
      order: { joinedAt: 'DESC' },
      take: 100,
    });
    const now = new Date();
    const seen = new Set<number>();
    const groupIds: number[] = [];
    const groups: Group[] = [];
    for (const p of participants) {
      const g = p.group;
      if (!g || !g.isActive || g.creatorId === userId) continue;
      const completed =
        g.isCompleted ||
        (g.meetingDateTime != null && new Date(g.meetingDateTime) <= now);
      if (!completed) continue;
      const recruitmentSucceeded =
        g.minParticipants == null || (g.participantCount ?? 0) >= (g.minParticipants ?? 0);
      if (!recruitmentSucceeded) continue;
      if (seen.has(g.id)) continue;
      seen.add(g.id);
      groupIds.push(g.id);
      groups.push(g);
    }
    if (groupIds.length > 0) {
      const positions = await this.participantPositionRepository.find({
        where: { userId, groupId: In(groupIds) },
      });
      for (const g of groups) {
        const pos = positions.find((pp) => pp.groupId === g.id);
        (g as any).myPositionCode = pos?.positionCode ?? null;
      }
    }
    return groups;
  }

  async closeGroup(groupId: number, userId: number): Promise<Group> {
    const group = await this.findOne(groupId);

    // 생성자만 마감 가능
    if (group.creatorId !== userId) {
      throw new ForbiddenException('모임을 마감할 권한이 없습니다.');
    }

    // 가계약 확정: 1→2→3순위 시설. 이미 가예약(PROVISIONAL)이 있으면 확정으로 전환, 없으면 새 예약 생성. 후순위 가예약은 취소.
    const provisionals = await this.provisionalFacilityRepository.find({
      where: { groupId },
      order: { priority: 'ASC' },
      relations: ['facility'],
    });

    if (provisionals.length > 0 && group.meetingDateTime) {
      const meeting = new Date(group.meetingDateTime);
      const reservationDate = meeting.toISOString().slice(0, 10); // YYYY-MM-DD
      const startTime = `${String(meeting.getHours()).padStart(2, '0')}:${String(meeting.getMinutes()).padStart(2, '0')}`;
      let slotHours = 2;
      let confirmedFacilityId: number | null = null;

      // 이미 걸어둔 가예약(PROVISIONAL) 조회
      const provisionalReservations = await this.reservationsService.findProvisionalByGroupId(groupId);
      const reservationByFacilityId = new Map(provisionalReservations.map((r) => [r.facilityId, r]));

      for (const p of provisionals) {
        const facility = (p as any).facility;
        if (!facility) continue;
        const hours = facility.reservationSlotHours != null ? Math.min(8, Math.max(1, Number(facility.reservationSlotHours))) : 2;
        slotHours = hours;
        const startMinutes = meeting.getHours() * 60 + meeting.getMinutes();
        const endMinutes = startMinutes + hours * 60;
        const endH = Math.floor(endMinutes / 60) % 24;
        const endM = endMinutes % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        const existingProvisional = reservationByFacilityId.get(p.facilityId);
        if (existingProvisional) {
          // 가예약이 있으면 슬롯 검사 없이 확정으로 전환 (이미 우리가 건 가예약)
          await this.reservationsService.updateStatus(existingProvisional.id, userId, ReservationStatus.CONFIRMED);
          confirmedFacilityId = p.facilityId;
          // 나머지 순위의 가예약은 취소 (시설주 캘린더에서 사라짐)
          for (const other of provisionalReservations) {
            if (other.facilityId !== p.facilityId) {
              await this.reservationsService.updateStatus(other.id, userId, ReservationStatus.CANCELLED);
            }
          }
          break;
        }

        const available = await this.reservationsService.isSlotAvailable(
          p.facilityId,
          reservationDate,
          startTime,
          endTime,
        );
        if (!available) continue;

        // 가예약 없이 마감한 경우: 기존처럼 새 확정 예약 생성
        const participantCount = group.participantCount ?? 0;
        await this.reservationsService.createReservationForGroup(
          groupId,
          p.facilityId,
          userId,
          reservationDate,
          startTime,
          endTime,
          Math.max(1, participantCount),
        );
        confirmedFacilityId = p.facilityId;
        // 다른 순위에 걸린 가예약이 있으면 취소
        for (const other of provisionalReservations) {
          if (other.facilityId !== p.facilityId) {
            await this.reservationsService.updateStatus(other.id, userId, ReservationStatus.CANCELLED);
          }
        }
        break;
      }

      if (confirmedFacilityId != null) {
        await this.groupRepository.update(groupId, { facilityId: confirmedFacilityId });
        group.facilityId = confirmedFacilityId;
      }
      // 모두 불가 시 facilityId는 null 유지 (매치장이 수동으로 시설 변경 가능)
    }

    // participants 관계를 제외하고 isClosed만 업데이트
    await this.groupRepository
      .createQueryBuilder()
      .update(Group)
      .set({ isClosed: true })
      .where('id = :id', { id: groupId })
      .execute();

    group.isClosed = true;
    return group;
  }

  async reopenGroup(groupId: number, userId: number): Promise<Group> {
    const group = await this.findOne(groupId);

    // 생성자만 재개 가능
    if (group.creatorId !== userId) {
      throw new ForbiddenException('모임을 재개할 권한이 없습니다.');
    }

    // 가계약으로 확정된 시설 예약이 있으면 취소 후 facilityId 해제
    if (group.facilityId) {
      const reservation = await this.reservationsService.findByGroupId(groupId);
      if (reservation) {
        await this.reservationsService.updateStatus(reservation.id, userId, ReservationStatus.CANCELLED);
      }
      await this.groupRepository.update(groupId, { facilityId: null });
      group.facilityId = null;
    }

    // participants 관계를 제외하고 isClosed만 업데이트
    await this.groupRepository
      .createQueryBuilder()
      .update(Group)
      .set({ isClosed: false })
      .where('id = :id', { id: groupId })
      .execute();

    group.isClosed = false;
    return group;
  }

  /** 심판 신청: 랭크 매치에서만 가능, 참가자는 심판 신청 불가 */
  async applyReferee(groupId: number, userId: number): Promise<{ success: boolean; message: string }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: [],
    });
    if (!group) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }
    if (group.type !== 'rank') {
      throw new BadRequestException('심판 시스템은 랭크 매치에서만 이용 가능합니다.');
    }
    const isParticipant = await this.participantRepository.findOne({
      where: { groupId, userId },
    });
    if (isParticipant) {
      throw new BadRequestException('경기에 참가한 선수는 심판으로 신청할 수 없습니다.');
    }
    const existing = await this.refereeRepository.findOne({
      where: { groupId, userId },
    });
    if (existing) {
      throw new ConflictException('이미 심판으로 신청하셨습니다.');
    }
    await this.refereeRepository.save(
      this.refereeRepository.create({ groupId, userId }),
    );
    return { success: true, message: '심판 신청이 완료되었습니다.' };
  }

  /** 심판 신청 취소 */
  async cancelReferee(groupId: number, userId: number): Promise<{ success: boolean; message: string }> {
    const group = await this.groupRepository.findOne({ where: { id: groupId }, relations: [] });
    if (!group) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }
    if (group.type !== 'rank') {
      throw new BadRequestException('심판 시스템은 랭크 매치에서만 이용 가능합니다.');
    }
    const deleted = await this.refereeRepository.delete({ groupId, userId });
    if (deleted.affected === 0) {
      throw new NotFoundException('심판 신청 내역이 없습니다.');
    }
    return { success: true, message: '심판 신청이 취소되었습니다.' };
  }

  /**
   * 랭크매치 승패 기록 (심판만). 이긴 팀 +25점·1승, 진 팀 -25점·1패. D급 1000점 시작, 400점 간격 등급.
   */
  async recordRankMatchResult(
    groupId: number,
    refereeUserId: number,
    finalScoreRed: number,
    finalScoreBlue: number,
  ): Promise<{ success: boolean; message: string }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: [],
    });
    if (!group) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }
    if (group.type !== 'rank') {
      throw new BadRequestException('랭크 매치에서만 승패를 기록할 수 있습니다.');
    }
    const isReferee = await this.refereeRepository.findOne({
      where: { groupId, userId: refereeUserId },
    });
    if (!isReferee) {
      throw new ForbiddenException('해당 매치의 심판만 승패를 기록할 수 있습니다.');
    }
    if (group.finalScoreRed != null || group.finalScoreBlue != null) {
      throw new BadRequestException('이미 승패가 기록된 매치입니다.');
    }
    const category = group.category || '축구';
    const positions = await this.participantPositionRepository.find({
      where: { groupId },
      select: ['userId', 'team'],
    });
    if (positions.length === 0) {
      throw new BadRequestException('참가자 포지션 정보가 없어 승패를 기록할 수 없습니다.');
    }
    const redWins = finalScoreRed > finalScoreBlue;
    for (const pos of positions) {
      const user = await this.usersService.findById(pos.userId);
      if (!user) continue;
      const prev = user.ohunRankPoints?.[category] ?? {
        points: RANK_INITIAL_POINTS,
        wins: 0,
        losses: 0,
      };
      const isWinner = (pos.team === 'red' && redWins) || (pos.team === 'blue' && !redWins);
      const nextPoints = Math.max(0, prev.points + (isWinner ? RANK_POINTS_WIN : RANK_POINTS_LOSS));
      const nextWins = prev.wins + (isWinner ? 1 : 0);
      const nextLosses = prev.losses + (isWinner ? 0 : 1);
      const grade = pointsToGrade(nextPoints);
      const nextOhunRankPoints = { ...(user.ohunRankPoints || {}), [category]: { points: nextPoints, wins: nextWins, losses: nextLosses } };
      const nextOhunRanks = { ...(user.ohunRanks || {}), [category]: grade };
      await this.usersService.updateUser(pos.userId, { ohunRankPoints: nextOhunRankPoints, ohunRanks: nextOhunRanks });
    }
    group.finalScoreRed = finalScoreRed;
    group.finalScoreBlue = finalScoreBlue;
    await this.groupRepository.save(group);
    return { success: true, message: '승패가 기록되었습니다. 이긴 팀 +25점, 진 팀 -25점이 반영되었습니다.' };
  }

  /**
   * 매치 종료 후 리뷰 작성 가능 여부 및 필요한 정보 반환
   */
  async getReviewEligibility(groupId: number, userId: number): Promise<{
    canReview: boolean;
    reason?: string;
    categories: { key: string; label: string }[];
    participants: { id: number; nickname: string; tag: string | null; profileImageUrl: string | null }[];
    alreadySubmitted: boolean;
    facilityId: number | null;
    facilityName: string | null;
    facilityReviewSubmitted: boolean;
  }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: [],
    });
    if (!group) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    const now = new Date();
    const meetingEnded =
      group.isCompleted || (group.meetingDateTime != null && new Date(group.meetingDateTime) <= now);
    if (!meetingEnded) {
      return {
        canReview: false,
        reason: '매치가 종료된 후에 리뷰를 작성할 수 있습니다.',
        categories: [],
        participants: [],
        alreadySubmitted: false,
        facilityId: null,
        facilityName: null,
        facilityReviewSubmitted: false,
      };
    }

    const participantIds = await this.participantRepository
      .find({ where: { groupId }, select: ['userId'] })
      .then((rows) => rows.map((r) => r.userId));
    const isCreator = group.creatorId === userId;
    if (!participantIds.includes(userId) && !isCreator) {
      return {
        canReview: false,
        reason: '참가자만 리뷰를 작성할 수 있습니다.',
        categories: [],
        participants: [],
        alreadySubmitted: false,
        facilityId: null,
        facilityName: null,
        facilityReviewSubmitted: false,
      };
    }

    const categories = MATCH_REVIEW_CATEGORIES[group.category] ?? [];
    if (categories.length === 0) {
      return {
        canReview: false,
        reason: '해당 종목은 리뷰 항목이 설정되어 있지 않습니다.',
        categories: [],
        participants: [],
        alreadySubmitted: false,
        facilityId: null,
        facilityName: null,
        facilityReviewSubmitted: false,
      };
    }

    const requiredCategoryKeys = categories
      .filter((c) => !OPTIONAL_REVIEW_CATEGORY_KEYS.includes(c.key))
      .map((c) => c.key);
    const existingCount = await this.matchReviewRepository.count({
      where: { groupId, reviewerId: userId },
    });
    const alreadySubmitted = existingCount >= requiredCategoryKeys.length;

    const participants = await this.participantRepository.find({
      where: { groupId },
      relations: ['user'],
    });
    let participantList = participants.map((p) => ({
      id: (p as any).user?.id ?? p.userId,
      nickname: (p as any).user?.nickname ?? '',
      tag: (p as any).user?.tag ?? null,
      profileImageUrl: (p as any).user?.profileImageUrl ?? null,
    }));
    // 모임장이 참가자 목록에 없으면 추가 (일부 매치에서는 creator가 group_participants에 없을 수 있음)
    const participantIdsSet = new Set(participantList.map((p) => p.id));
    if (group.creatorId && !participantIdsSet.has(group.creatorId)) {
      const creator = await this.usersService.findById(group.creatorId);
      if (creator) {
        participantList = [
          { id: creator.id, nickname: creator.nickname, tag: creator.tag ?? null, profileImageUrl: creator.profileImageUrl ?? null },
          ...participantList,
        ];
      }
    }

    let facilityId: number | null = null;
    let facilityName: string | null = null;
    let facilityReviewSubmitted = false;
    let fid = group.facilityId;
    if (fid == null) {
      const prov = await this.provisionalFacilityRepository.findOne({ where: { groupId }, order: { priority: 'ASC' } });
      fid = prov?.facilityId ?? null;
    }
    if (fid) {
      try {
        const facility = await this.facilitiesService.findOne(fid);
        facilityId = facility.id;
        facilityName = facility.name;
        facilityReviewSubmitted = await this.facilityReviewsService.hasReviewed(groupId, userId);
      } catch {
        // facility not found, ignore
      }
    }

    return {
      canReview: !alreadySubmitted,
      reason: alreadySubmitted ? '이미 리뷰를 작성하셨습니다.' : undefined,
      categories,
      participants: participantList,
      alreadySubmitted,
      facilityId,
      facilityName,
      facilityReviewSubmitted,
    };
  }

  /**
   * 매치 리뷰 제출. 모든 항목에 대해 참가자 중 1명씩 선택. 제출 시 포인트 지급
   */
  async submitReview(
    groupId: number,
    userId: number,
    answers: Record<string, number>,
  ): Promise<{ success: boolean; message: string; pointsEarned: number }> {
    const eligibility = await this.getReviewEligibility(groupId, userId);
    if (!eligibility.canReview || eligibility.alreadySubmitted) {
      throw new BadRequestException(eligibility.reason ?? '리뷰를 작성할 수 없습니다.');
    }

    const categories = eligibility.categories;
    const participantIds = eligibility.participants.map((p) => p.id);
    const optionalKeys = new Set(OPTIONAL_REVIEW_CATEGORY_KEYS);

    for (const cat of categories) {
      if (optionalKeys.has(cat.key)) continue;
      const selectedId = answers[cat.key];
      if (selectedId == null || !Number.isInteger(selectedId)) {
        throw new BadRequestException(`"${cat.label}" 항목을 선택해 주세요.`);
      }
      if (!participantIds.includes(selectedId)) {
        throw new BadRequestException(`"${cat.label}"에는 참가자 중 한 명만 선택할 수 있습니다.`);
      }
    }

    for (const cat of categories) {
      const selectedId = answers[cat.key];
      if (optionalKeys.has(cat.key) && (selectedId == null || !Number.isInteger(selectedId))) continue;
      if (selectedId == null || !participantIds.includes(selectedId)) continue;
      if (cat.key === '신고' && selectedId === userId) {
        throw new BadRequestException('본인은 신고할 수 없습니다.');
      }
      await this.matchReviewRepository.save(
        this.matchReviewRepository.create({
          groupId,
          reviewerId: userId,
          categoryKey: cat.key,
          selectedUserId: selectedId,
        }),
      );
    }

    await this.pointsService.addTransaction(
      userId,
      REVIEW_COMPLETE_POINTS,
      PointTransactionType.REVIEW,
      `매치 #${groupId} 리뷰 작성`,
    );

    return {
      success: true,
      message: '리뷰가 저장되었습니다.',
      pointsEarned: REVIEW_COMPLETE_POINTS,
    };
  }

  async submitFacilityReview(
    groupId: number,
    facilityId: number,
    userId: number,
    dto: { cleanliness: number; suitableForGame: number; overall: number },
  ) {
    return this.facilityReviewsService.submitForGroup(groupId, facilityId, userId, dto);
  }
}

