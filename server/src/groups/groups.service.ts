import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupParticipant } from './entities/group-participant.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupQueryDto } from './dto/group-query.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupParticipant)
    private participantRepository: Repository<GroupParticipant>,
  ) {}

  async create(createGroupDto: CreateGroupDto, creatorId: number): Promise<Group> {
    const group = this.groupRepository.create({
      ...createGroupDto,
      creatorId,
      participantCount: 1, // 생성자 포함
      equipment: createGroupDto.equipment || [],
    });

    return this.groupRepository.save(group);
  }

  async findAll(queryDto: GroupQueryDto): Promise<{ groups: Group[]; total: number }> {
    const { category, search, page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.creator', 'creator')
      .where('group.isActive = :isActive', { isActive: true });

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

    // 정렬: 최신순
    queryBuilder.orderBy('group.createdAt', 'DESC');

    // 페이지네이션
    const [groups, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { groups, total };
  }

  async findOne(id: number, userId?: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['creator', 'participants', 'participants.user'],
    });

    if (!group) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    // 사용자가 참가했는지 확인 (선택적)
    if (userId) {
      const isParticipant = group.participants?.some(
        (p) => p.userId === userId && p.status === 'joined',
      );
      (group as any).isUserParticipant = isParticipant;
    }

    return group;
  }

  async update(id: number, updateGroupDto: UpdateGroupDto, userId: number): Promise<Group> {
    const group = await this.findOne(id);

    // 생성자만 수정 가능
    if (group.creatorId !== userId) {
      throw new ForbiddenException('모임을 수정할 권한이 없습니다.');
    }

    Object.assign(group, updateGroupDto);
    return this.groupRepository.save(group);
  }

  async remove(id: number, userId: number): Promise<void> {
    const group = await this.findOne(id);

    // 생성자만 삭제 가능
    if (group.creatorId !== userId) {
      throw new ForbiddenException('모임을 삭제할 권한이 없습니다.');
    }

    // 실제 삭제 대신 비활성화
    group.isActive = false;
    await this.groupRepository.save(group);
  }

  async joinGroup(groupId: number, userId: number): Promise<Group> {
    const group = await this.findOne(groupId);

    if (!group.isActive) {
      throw new NotFoundException('비활성화된 모임입니다.');
    }

    // 이미 참가했는지 확인
    const existingParticipant = await this.participantRepository.findOne({
      where: { groupId, userId, status: 'joined' },
    });

    if (existingParticipant) {
      throw new ConflictException('이미 참가한 모임입니다.');
    }

    // 생성자는 자동으로 참가자이므로 별도 처리 불필요
    if (group.creatorId === userId) {
      throw new ConflictException('모임 생성자는 이미 참가 상태입니다.');
    }

    // 참가자 추가
    const participant = this.participantRepository.create({
      groupId,
      userId,
      status: 'joined',
    });

    await this.participantRepository.save(participant);

    // 참가자 수 업데이트
    group.participantCount += 1;
    await this.groupRepository.save(group);

    return this.findOne(groupId, userId);
  }

  async leaveGroup(groupId: number, userId: number): Promise<void> {
    const group = await this.findOne(groupId);

    // 생성자는 탈퇴 불가
    if (group.creatorId === userId) {
      throw new ForbiddenException('모임 생성자는 탈퇴할 수 없습니다.');
    }

    const participant = await this.participantRepository.findOne({
      where: { groupId, userId, status: 'joined' },
    });

    if (!participant) {
      throw new NotFoundException('참가한 모임이 아닙니다.');
    }

    // 참가 상태를 취소로 변경
    participant.status = 'cancelled';
    await this.participantRepository.save(participant);

    // 참가자 수 업데이트
    group.participantCount = Math.max(1, group.participantCount - 1);
    await this.groupRepository.save(group);
  }

  async checkParticipation(groupId: number, userId: number): Promise<boolean> {
    const participant = await this.participantRepository.findOne({
      where: { groupId, userId, status: 'joined' },
    });
    return !!participant;
  }
}

