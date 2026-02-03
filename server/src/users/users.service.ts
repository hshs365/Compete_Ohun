import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from './entities/user.entity';
import { SocialAccount, SocialProvider } from '../social-accounts/entities/social-account.entity';
import { AthleteService } from './athlete.service';
import { Group } from '../groups/entities/group.entity';
import { GroupParticipant } from '../groups/entities/group-participant.entity';

const EARNED_TITLES_LOVER = 5;
const EARNED_TITLES_MASTER = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SocialAccount)
    private socialAccountRepository: Repository<SocialAccount>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupParticipant)
    private participantRepository: Repository<GroupParticipant>,
    private athleteService: AthleteService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { 
        email,
        status: UserStatus.ACTIVE, // 활성 사용자만 조회
      },
      relations: ['socialAccounts'],
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { 
        phone,
        status: UserStatus.ACTIVE, // 활성 사용자만 조회
      },
      relations: ['socialAccounts'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['socialAccounts'],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async findByNickname(nickname: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { nickname },
    });
  }

  async findByNicknameAndTag(nickname: string, tag: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { nickname, tag },
    });
  }

  /** 사업자번호로 사용자 조회 (다른 계정에서 사용 중인지 확인용). excludeUserId 제외 가능 */
  async findByBusinessNumber(businessNumber: string, excludeUserId?: number): Promise<User | null> {
    const normalized = businessNumber?.trim().replace(/-/g, '');
    if (!normalized || normalized.length !== 10) return null;
    const formatted = `${normalized.slice(0, 3)}-${normalized.slice(3, 5)}-${normalized.slice(5, 10)}`;
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.businessNumber = :bn', { bn: formatted })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE });
    if (excludeUserId != null) {
      qb.andWhere('user.id != :excludeUserId', { excludeUserId });
    }
    return qb.getOne();
  }

  /** 전체 유저 검색 (닉네임, 태그 - 부분 일치). 이메일은 개인정보 보호를 위해 검색 불가 */
  async searchUsers(query: string, excludeUserId: number, limit = 30): Promise<User[]> {
    const q = `%${query.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :excludeUserId', { excludeUserId })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere(
        '(user.nickname ILIKE :q OR user.tag ILIKE :q)',
        { q },
      )
      .orderBy('user.nickname', 'ASC')
      .take(limit)
      .getMany();
  }

  /**
   * 닉네임에 대한 다음 사용 가능한 태그를 생성합니다.
   * 같은 닉네임을 가진 사용자 수를 확인하고 다음 번호를 부여합니다.
   * 형식: #0001, #0002, ... (4자리 숫자)
   */
  async generateTagForNickname(nickname: string): Promise<string> {
    // 같은 닉네임을 가진 사용자 수 확인 (태그가 있는 사용자만)
    const count = await this.userRepository
      .createQueryBuilder('user')
      .where('user.nickname = :nickname', { nickname })
      .andWhere('user.tag IS NOT NULL')
      .getCount();

    // 다음 태그 번호 생성 (#0001, #0002, ...)
    const tagNumber = count + 1;
    return `#${String(tagNumber).padStart(4, '0')}`;
  }

  async checkNicknameAvailable(nickname: string): Promise<boolean> {
    // 닉네임은 이제 중복 가능하므로 항상 true 반환
    return true;
  }

  async checkEmailAvailable(email: string): Promise<boolean> {
    // 활성 사용자만 확인 (탈퇴한 사용자의 이메일은 재사용 가능)
    const user = await this.userRepository.findOne({
      where: { 
        email,
        status: UserStatus.ACTIVE,
      },
    });
    
    // 디버깅: 사용자가 발견된 경우 로그 출력
    if (user) {
      console.log(`[checkEmailAvailable] 이메일 ${email} 사용 중인 사용자 발견:`, {
        id: user.id,
        email: user.email,
        status: user.status,
        nickname: user.nickname,
      });
    }
    
    return user === null;
  }

  async findBySocialAccount(
    provider: SocialProvider,
    providerUserId: string,
  ): Promise<User | null> {
    const socialAccount = await this.socialAccountRepository.findOne({
      where: {
        provider,
        providerUserId,
      },
      relations: ['user'],
    });

    return socialAccount?.user || null;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    // 이메일 중복 체크 (활성 사용자만 확인, 탈퇴한 사용자의 이메일은 재사용 가능)
    if (userData.email) {
      const existingUser = await this.userRepository.findOne({
        where: { 
          email: userData.email,
          status: UserStatus.ACTIVE,
        },
      });
      
      // 디버깅: 사용자가 발견된 경우 로그 출력
      if (existingUser) {
        console.log(`[createUser] 이메일 ${userData.email} 사용 중인 사용자 발견:`, {
          id: existingUser.id,
          email: existingUser.email,
          status: existingUser.status,
          nickname: existingUser.nickname,
        });
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
      
      // 디버깅: 모든 이메일 사용자 확인 (상태 무관)
      const allUsersWithEmail = await this.userRepository.find({
        where: { email: userData.email },
        select: ['id', 'email', 'status', 'nickname'],
      });
      if (allUsersWithEmail.length > 0) {
        console.log(`[createUser] 이메일 ${userData.email}를 사용하는 모든 사용자 (상태 무관):`, 
          allUsersWithEmail.map(u => ({ id: u.id, email: u.email, status: u.status, nickname: u.nickname }))
        );
      }
    }

    // 닉네임 태그 자동 생성 (태그가 제공되지 않은 경우)
    if (userData.nickname && !userData.tag) {
      userData.tag = await this.generateTagForNickname(userData.nickname);
    }

    // 닉네임 + 태그 조합 중복 체크
    if (userData.nickname && userData.tag) {
      const existingUser = await this.findByNicknameAndTag(userData.nickname, userData.tag);
      if (existingUser) {
        // 태그가 중복되면 새로운 태그 생성
        userData.tag = await this.generateTagForNickname(userData.nickname);
      }
    }

    // 비밀번호 해싱
    if (userData.passwordHash && !userData.passwordHash.startsWith('$2')) {
      userData.passwordHash = await bcrypt.hash(userData.passwordHash, 10);
    }

    const user = this.userRepository.create({
      ...userData,
      // userData에서 status와 isProfileComplete가 제공되지 않은 경우에만 기본값 사용
      status: userData.status ?? UserStatus.PENDING,
      isProfileComplete: userData.isProfileComplete ?? false,
    });

    return this.userRepository.save(user);
  }

  async createSocialAccount(
    userId: number,
    provider: SocialProvider,
    providerUserId: string,
    providerData?: {
      email?: string;
      name?: string;
      profileImageUrl?: string;
    },
    isPrimary = false,
  ): Promise<SocialAccount> {
    const socialAccount = this.socialAccountRepository.create({
      userId,
      provider,
      providerUserId,
      providerEmail: providerData?.email || null,
      providerName: providerData?.name || null,
      providerProfileImageUrl: providerData?.profileImageUrl || null,
      isPrimary,
    });

    return this.socialAccountRepository.save(socialAccount);
  }

  async updateUser(userId: number, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 닉네임 변경 시 3개월 제한 체크
    if (updateData.nickname && updateData.nickname !== user.nickname) {
      if (user.nicknameChangedAt) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        if (user.nicknameChangedAt > threeMonthsAgo) {
          const daysRemaining = Math.ceil(
            (user.nicknameChangedAt.getTime() + 90 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
          );
          throw new BadRequestException(
            `닉네임은 3개월에 한 번만 변경할 수 있습니다. ${daysRemaining}일 후에 변경 가능합니다.`
          );
        }
      }
      
      // 닉네임 변경 시간 기록
      updateData.nicknameChangedAt = new Date();
      
      // 닉네임 변경 시 태그 자동 생성 (태그가 제공되지 않은 경우)
      if (!updateData.tag) {
        updateData.tag = await this.generateTagForNickname(updateData.nickname);
      }
    }

    // 닉네임 + 태그 조합 중복 체크 (다른 사용자가 이미 사용 중인 경우)
    if (updateData.nickname && updateData.tag) {
      const existingUser = await this.findByNicknameAndTag(updateData.nickname, updateData.tag);
      if (existingUser && existingUser.id !== userId) {
        // 다른 사용자가 이미 사용 중이면 새로운 태그 생성
        updateData.tag = await this.generateTagForNickname(updateData.nickname);
      }
    }

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async completeProfile(userId: number, profileData: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 필수 정보 체크
    if (!profileData.nickname || !profileData.gender || !profileData.residenceSido || !profileData.residenceSigungu) {
      throw new Error('필수 정보가 누락되었습니다.');
    }

    // 닉네임 중복 체크
    if (profileData.nickname !== user.nickname) {
      const existingNickname = await this.findByNickname(profileData.nickname);
      if (existingNickname) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }
    }

    Object.assign(user, {
      ...profileData,
      isProfileComplete: true,
      status: UserStatus.ACTIVE,
    });

    return this.userRepository.save(user);
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async updateSocialAccountLastUsed(
    provider: SocialProvider,
    providerUserId: string,
  ): Promise<void> {
    await this.socialAccountRepository.update(
      { provider, providerUserId },
      { lastUsedAt: new Date() },
    );
  }

  /**
   * 대한체육회 스포츠지원포털 선수 API로 본인 실명 조회 후 선수 인증 처리
   */
  async registerAthlete(userId: number): Promise<{ success: boolean; message?: string }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    if (!user.realName?.trim()) {
      return { success: false, message: '선수 등록을 위해 먼저 실명을 등록해 주세요. (내정보 또는 회원가입 시 실명 입력)' };
    }

    const result = await this.athleteService.findByRealName(
      user.realName,
      user.birthDate,
    );
    if (!result.found || !result.data) {
      return {
        success: false,
        message: result.message ?? '등록된 선수 정보를 찾을 수 없습니다. 실명과 생년월일을 확인해 주세요.',
      };
    }

    await this.updateUser(userId, {
      athleteVerified: true,
      athleteData: result.data,
    });
    return { success: true };
  }

  /**
   * 회원 탈퇴 (소프트 삭제)
   * 사용자 상태를 DELETED로 변경하고 개인정보를 익명화
   */
  async withdrawUser(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 소프트 삭제: 상태를 DELETED로 변경하고 개인정보 익명화
    await this.userRepository.update(userId, {
      status: UserStatus.DELETED,
      email: null, // 이메일 제거
      phone: null, // 전화번호 제거
      phoneVerified: false,
      realName: null, // 실명 제거
      realNameVerified: false,
      nickname: `탈퇴한사용자_${userId}_${Date.now()}`, // 닉네임 익명화 (고유성 유지)
      passwordHash: null, // 비밀번호 제거
      latitude: null,
      longitude: null,
      // 기타 개인정보는 유지 (통계 목적)
    });
  }

  /** 프로필용: 완료된 참여/생성 매치 기준 종목별 횟수 + 최근 완료 활동 */
  async getActivitySummaryForProfile(userId: number): Promise<{
    countByCategory: Record<string, number>;
    recentCompleted: Array<{ type: 'participated' | 'created'; groupId: number; name: string; category: string; date: string }>;
  }> {
    const now = new Date();
    const countByCategory: Record<string, number> = {};
    const recentItems: Array<{ type: 'participated' | 'created'; date: Date; groupId: number; name: string; category: string }> = [];

    const completedCondition = '(group.isCompleted = :isCompleted OR (group.meetingDateTime IS NOT NULL AND group.meetingDateTime <= :now))';

    const participations = await this.participantRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.group', 'group')
      .where('p.userId = :userId', { userId })
      .andWhere('group.creatorId != :userId', { userId })
      .andWhere('group.isActive = :isActive', { isActive: true })
      .andWhere(completedCondition, { isCompleted: true, now })
      .orderBy('group.meetingDateTime', 'DESC', 'NULLS LAST')
      .addOrderBy('group.createdAt', 'DESC')
      .take(50)
      .getMany();

    for (const p of participations) {
      const g = (p as any).group as Group;
      if (!g || !g.category) continue;
      countByCategory[g.category] = (countByCategory[g.category] || 0) + 1;
      const date = g.meetingDateTime || g.createdAt;
      if (date) recentItems.push({ type: 'participated', date: date instanceof Date ? date : new Date(date), groupId: g.id, name: g.name, category: g.category });
    }

    const creations = await this.groupRepository
      .createQueryBuilder('group')
      .where('group.creatorId = :userId', { userId })
      .andWhere('group.isActive = :isActive', { isActive: true })
      .andWhere(completedCondition, { isCompleted: true, now })
      .orderBy('group.meetingDateTime', 'DESC', 'NULLS LAST')
      .addOrderBy('group.createdAt', 'DESC')
      .take(50)
      .getMany();

    for (const g of creations) {
      if (!g.category) continue;
      countByCategory[g.category] = (countByCategory[g.category] || 0) + 1;
      const date = g.meetingDateTime || g.createdAt;
      if (date) recentItems.push({ type: 'created', date: date instanceof Date ? date : new Date(date), groupId: g.id, name: g.name, category: g.category });
    }

    recentItems.sort((a, b) => b.date.getTime() - a.date.getTime());
    const recentCompleted = recentItems.slice(0, 10).map((item) => ({
      type: item.type,
      groupId: item.groupId,
      name: item.name,
      category: item.category,
      date: item.date.toISOString().slice(0, 10),
    }));

    return { countByCategory, recentCompleted };
  }

  /** countByCategory → 타이틀 뱃지 목록 (일반, ○○ 애호가, ○○ 마스터) */
  getEarnedTitlesFromCount(countByCategory: Record<string, number>): string[] {
    const titles: string[] = ['일반'];
    for (const [category, count] of Object.entries(countByCategory)) {
      if (category === '전체') continue;
      if (count >= EARNED_TITLES_MASTER) titles.push(`${category} 마스터`);
      else if (count >= EARNED_TITLES_LOVER) titles.push(`${category} 애호가`);
    }
    return titles;
  }
}

