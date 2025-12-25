import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
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
      where: { email },
      relations: ['socialAccounts'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['socialAccounts'],
    });
  }

  async findByNickname(nickname: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { nickname },
    });
  }

  async checkNicknameAvailable(nickname: string): Promise<boolean> {
    const user = await this.findByNickname(nickname);
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
    // 이메일 중복 체크
    if (userData.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
    }

    // 닉네임 중복 체크
    if (userData.nickname) {
      const existingNickname = await this.findByNickname(userData.nickname);
      if (existingNickname) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
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

    // 닉네임 변경 시 중복 체크
    if (updateData.nickname && updateData.nickname !== user.nickname) {
      const existingNickname = await this.findByNickname(updateData.nickname);
      if (existingNickname) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
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
}

