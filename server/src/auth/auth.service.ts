import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserStatus } from '../users/entities/user.entity';
import { SocialAccount, SocialProvider } from '../social-accounts/entities/social-account.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { SocialCallbackDto } from './dto/social-callback.dto';

export interface JwtPayload {
  sub: number; // userId
  email?: string;
  nickname?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email?: string;
    nickname?: string;
    isProfileComplete: boolean;
  };
  isNewUser?: boolean;
  providerEmail?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // 임시 사용자 생성 (추가 정보 입력 전)
    const user = await this.usersService.createUser({
      email: registerDto.email,
      passwordHash: registerDto.password,
      nickname: registerDto.nickname,
      gender: registerDto.gender,
      ageRange: registerDto.ageRange,
      birthDate: registerDto.birthDate ? new Date(registerDto.birthDate) : null,
      residenceSido: registerDto.residenceSido,
      residenceSigungu: registerDto.residenceSigungu,
      interestedSports: registerDto.interestedSports || [],
      skillLevel: registerDto.skillLevel,
      termsServiceAgreed: registerDto.termsServiceAgreed,
      termsPrivacyAgreed: registerDto.termsPrivacyAgreed,
      marketingConsent: registerDto.marketingConsent || false,
      marketingEmailConsent: registerDto.marketingEmailConsent || false,
      marketingSmsConsent: registerDto.marketingSmsConsent || false,
      isProfileComplete: true, // 일반 회원가입은 모든 정보를 입력받으므로 바로 완료
      status: UserStatus.ACTIVE,
    });

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email || undefined,
        nickname: user.nickname || undefined,
        isProfileComplete: user.isProfileComplete,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordValid = await this.usersService.verifyPassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('계정이 활성화되지 않았습니다.');
    }

    await this.usersService.updateLastLogin(user.id);

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email || undefined,
        nickname: user.nickname || undefined,
        isProfileComplete: user.isProfileComplete,
      },
    };
  }

  async socialCallback(
    callbackDto: SocialCallbackDto,
    socialUserInfo: {
      providerUserId: string;
      email?: string;
      name?: string;
      profileImageUrl?: string;
    },
  ): Promise<AuthResponse> {
    // 기존 소셜 계정으로 로그인한 사용자 찾기
    let user: User | null = await this.usersService.findBySocialAccount(
      callbackDto.provider,
      socialUserInfo.providerUserId,
    );

    const isNewUser = !user;

    if (isNewUser) {
      // 신규 사용자: 임시 User 생성
      user = await this.usersService.createUser({
        email: null, // 소셜 로그인은 이메일을 서비스에서 직접 입력받지 않음
        passwordHash: null,
        nickname: '', // 추가 정보 입력 시 받음
        gender: null,
        residenceSido: '',
        residenceSigungu: '',
        status: UserStatus.PENDING,
        isProfileComplete: false,
      });

      // 소셜 계정 연동
      await this.usersService.createSocialAccount(
        user.id,
        callbackDto.provider,
        socialUserInfo.providerUserId,
        socialUserInfo,
        true, // 첫 소셜 계정이므로 primary
      );
    } else {
      // 기존 사용자: 소셜 계정의 lastUsedAt 업데이트
      // user가 null이 아님을 확인 (위의 !isNewUser 조건으로 보장됨)
      if (!user) {
        throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
      }

      await this.usersService.updateSocialAccountLastUsed(
        callbackDto.provider,
        socialUserInfo.providerUserId,
      );

      await this.usersService.updateLastLogin(user.id);
    }

    // user가 null이 아님을 확인 (위의 로직으로 보장됨)
    if (!user) {
      throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
    }

    const token = this.generateToken(user);

    return {
      token,
      isNewUser,
      user: {
        id: user.id,
        email: user.email || undefined,
        nickname: user.nickname || undefined,
        isProfileComplete: user.isProfileComplete,
      },
      providerEmail: socialUserInfo.email,
    };
  }

  async completeProfile(userId: number, profileDto: CompleteProfileDto): Promise<AuthResponse> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    if (user.isProfileComplete) {
      throw new BadRequestException('이미 추가 정보가 입력 완료되었습니다.');
    }

    const updatedUser = await this.usersService.completeProfile(userId, {
      nickname: profileDto.nickname,
      gender: profileDto.gender,
      ageRange: profileDto.ageRange,
      birthDate: profileDto.birthDate ? new Date(profileDto.birthDate) : null,
      residenceSido: profileDto.residenceSido,
      residenceSigungu: profileDto.residenceSigungu,
      interestedSports: profileDto.interestedSports || [],
      skillLevel: profileDto.skillLevel,
      termsServiceAgreed: profileDto.termsServiceAgreed,
      termsPrivacyAgreed: profileDto.termsPrivacyAgreed,
      marketingConsent: profileDto.marketingConsent || false,
      marketingEmailConsent: profileDto.marketingEmailConsent || false,
      marketingSmsConsent: profileDto.marketingSmsConsent || false,
    });

    const token = this.generateToken(updatedUser);

    return {
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email || undefined,
        nickname: updatedUser.nickname,
        isProfileComplete: updatedUser.isProfileComplete,
      },
    };
  }

  async checkNicknameAvailability(nickname: string): Promise<{ available: boolean }> {
    const available = await this.usersService.checkNicknameAvailable(nickname);
    return { available };
  }

  async updateProfile(userId: number, updateData: { nickname?: string; phone?: string; latitude?: number; longitude?: number }): Promise<User> {
    return this.usersService.updateUser(userId, updateData);
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || undefined,
      nickname: user.nickname || undefined,
    };

    return this.jwtService.sign(payload);
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('유효하지 않은 사용자입니다.');
    }
    return user;
  }
}

