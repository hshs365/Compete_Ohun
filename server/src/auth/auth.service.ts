import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Express } from 'express';
import { UsersService } from '../users/users.service';
import { PhoneVerificationService } from './services/phone-verification.service';
import { User, UserStatus, SkillLevel } from '../users/entities/user.entity';
import { SocialAccount, SocialProvider } from '../social-accounts/entities/social-account.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { SocialCallbackDto } from './dto/social-callback.dto';
import { VerifyBusinessNumberDto } from './dto/verify-business-number.dto';

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
    private phoneVerificationService: PhoneVerificationService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const normalizedPhone = registerDto.phone.replace(/-/g, '');
    
    // SMS 인증 활성화 여부 확인 (환경변수로 제어)
    const smsVerificationEnabled = this.configService.get<string>('SMS_VERIFICATION_ENABLED') === 'true';
    
    // SMS 인증이 활성화된 경우에만 인증 완료 여부 확인
    if (smsVerificationEnabled) {
      const isVerified = await this.phoneVerificationService.isVerified(registerDto.phone);
      if (!isVerified) {
        throw new BadRequestException('전화번호 본인인증이 완료되지 않았습니다. 인증번호를 먼저 요청하고 인증을 완료해주세요.');
      }
    }

    // 전화번호 중복 확인 (활성 사용자만 확인, 탈퇴한 사용자의 전화번호는 재사용 가능)
    const existingUser = await this.usersService.findByPhone(normalizedPhone);
    if (existingUser && existingUser.status === UserStatus.ACTIVE) {
      throw new BadRequestException('이미 가입된 휴대폰 번호입니다.');
    }

    // 사업자 회원인 경우 사업자등록번호 검증
    let businessNumberVerified = false;
    if (registerDto.memberType === 'business') {
      if (!registerDto.businessNumber) {
        throw new BadRequestException('사업자 회원은 사업자등록번호를 입력해야 합니다.');
      }
      
      // 사업자등록번호 검증
      businessNumberVerified = await this.verifyBusinessNumberForRegistration(registerDto.businessNumber);
      if (!businessNumberVerified) {
        throw new BadRequestException('사업자등록번호 검증에 실패했습니다. 올바른 사업자등록번호를 입력해주세요.');
      }
    }

    // 사용자 생성
    const user = await this.usersService.createUser({
      email: registerDto.email,
      passwordHash: registerDto.password,
      phone: normalizedPhone,
      phoneVerified: true, // SMS 인증 비활성화로 임시 true 처리
      realName: registerDto.realName, // 실명 저장
      realNameVerified: true, // 전화번호 인증과 함께 실명인증 완료로 간주 (나중에 외부 API로 업그레이드 가능)
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
      profileImageUrl: null, // 프로필 이미지는 가이드에서 등록
      isProfileComplete: true, // 일반 회원가입은 모든 정보를 입력받으므로 바로 완료
      status: UserStatus.ACTIVE,
      memberType: registerDto.memberType,
      businessNumber: registerDto.businessNumber || null,
      businessNumberVerified: businessNumberVerified,
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

  /**
   * 회원가입 시 사업자등록번호 검증
   * 실제 운영 시에는 국세청 API나 사업자번호 검증 서비스를 사용해야 합니다.
   */
  private async verifyBusinessNumberForRegistration(businessNumber: string): Promise<boolean> {
    // 사업자번호 형식 검증
    const businessNumberRegex = /^\d{3}-\d{2}-\d{5}$/;
    if (!businessNumberRegex.test(businessNumber)) {
      return false;
    }

    // TODO: 실제 사업자등록번호 조회 API 연동
    // 공공데이터포털의 사업자등록번호 진위확인 API 또는 외부 서비스 사용
    // 예: https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15012008
    
    // 현재는 형식만 검증하고 검증 완료로 처리
    // 실제 운영 시에는 여기서 외부 API를 호출하여 검증해야 합니다.
    return true;
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

  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const available = await this.usersService.checkEmailAvailable(email);
    return { available };
  }

  async updateProfile(userId: number, updateData: { nickname?: string; phone?: string; interestedSports?: string[]; skillLevel?: SkillLevel }, file?: Express.Multer.File): Promise<User> {
    // 파일이 있으면 프로필 이미지 업로드 처리
    if (file) {
      const profileImageUrl = await this.uploadProfileImage(userId, file);
      updateData = { ...updateData, profileImageUrl } as any;
    }
    return this.usersService.updateUser(userId, updateData);
  }

  private async uploadProfileImage(userId: number, file: Express.Multer.File): Promise<string> {
    const fs = require('fs').promises;
    const path = require('path');
    const crypto = require('crypto');
    
    // 업로드 디렉토리 설정
    // 환경변수 UPLOAD_DIR이 있으면 사용 (NFS 공유 스토리지 등)
    // 없으면 로컬 디렉토리 사용 (개발 환경)
    const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    const uploadDir = path.join(baseUploadDir, 'profile');
    
    // 디렉토리가 없으면 생성
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    
    // 파일 확장자 추출
    const ext = path.extname(file.originalname) || '.jpg';
    // UUID 대신 crypto.randomBytes 사용 (uuid 패키지 없이)
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const filename = `${userId}_${Date.now()}_${randomBytes}${ext}`;
    const filepath = path.join(uploadDir, filename);
    
    // 파일 저장
    await fs.writeFile(filepath, file.buffer);
    
    // URL 반환 (정적 파일 서빙 경로)
    return `/uploads/profile/${filename}`;
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

  /**
   * 사업자번호 검증
   * 실제 운영 시에는 국세청 API나 사업자번호 검증 서비스를 사용해야 합니다.
   * 현재는 형식 검증만 수행합니다.
   */
  async verifyBusinessNumber(userId: number, verifyDto: VerifyBusinessNumberDto): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // 사업자번호 형식 검증 (이미 DTO에서 검증됨)
    // 실제 운영 시에는 여기서 외부 API를 호출하여 검증해야 합니다.
    // 예: 국세청 사업자번호 조회 API, 사업자번호 검증 서비스 등

    // TODO: 실제 사업자번호 검증 API 연동
    // 현재는 형식만 검증하고 검증 완료로 처리
    // 실제 검증이 완료되면 businessNumberVerified를 true로 설정

    const updatedUser = await this.usersService.updateUser(userId, {
      businessNumber: verifyDto.businessNumber,
      businessNumberVerified: true, // 실제 검증 API 연동 후 검증 결과에 따라 설정
    });

    return updatedUser;
  }

  /**
   * 회원 탈퇴
   */
  async withdraw(userId: number): Promise<void> {
    await this.usersService.withdrawUser(userId);
  }

}

