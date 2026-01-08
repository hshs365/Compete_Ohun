import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { SocialAccount, SocialProvider } from '../social-accounts/entities/social-account.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SocialAccount)
    private socialAccountRepository: Repository<SocialAccount>,
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
}

