import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Express } from 'express';
import { UsersService } from '../users/users.service';
import { PhoneVerificationService } from './services/phone-verification.service';
import { BusinessNumberVerificationService } from './services/business-number-verification.service';
import { BusinessRegistrationOcrService } from './services/business-registration-ocr.service';
import type { VerifyBusinessWithDocumentDto } from './dto/verify-business-with-document.dto';
import { User, UserStatus, SkillLevel } from '../users/entities/user.entity';
import { SocialAccount, SocialProvider } from '../social-accounts/entities/social-account.entity';
import { PointsService } from '../users/points.service';
import { PointTransactionType } from '../users/entities/point-transaction.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { SocialCallbackDto } from './dto/social-callback.dto';
import { VerifyBusinessNumberDto } from './dto/verify-business-number.dto';
import { ChangeBusinessNumberDto } from './dto/change-business-number.dto';
import type { RegisterBusinessWithDocumentDto } from './dto/register-business-with-document.dto';
import type { RegisterBusinessConfirmDto } from './dto/register-business-confirm.dto';
import { BlacklistService } from '../blacklist/blacklist.service';

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
    residenceSido?: string | null;
    residenceSigungu?: string | null;
    residenceAddress?: string | null;
  };
  isNewUser?: boolean;
  providerEmail?: string;
  /** 소셜 프로필 (닉네임·성별·연령대 등). 추가정보 입력 폼 자동 채움용 */
  socialProfile?: { nickname?: string; gender?: string; ageRange?: string };
}

@Injectable()
export class AuthService {
  /** 회원가입 축하 포인트 (1회 지급) */
  private static readonly WELCOME_POINTS = 10000;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private phoneVerificationService: PhoneVerificationService,
    private businessNumberVerificationService: BusinessNumberVerificationService,
    private businessRegistrationOcrService: BusinessRegistrationOcrService,
    private configService: ConfigService,
    @Inject(forwardRef(() => PointsService))
    private pointsService: PointsService,
    private blacklistService: BlacklistService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // 베타: 전화번호 필수 (중복 가입 방지)
    const hasPhone = registerDto.phone != null && registerDto.phone.trim() !== '';
    if (!hasPhone) {
      throw new BadRequestException('전화번호는 필수입니다. 중복 가입 방지를 위해 입력해 주세요.');
    }
    const normalizedPhone = registerDto.phone!.replace(/-/g, '');

    // 블랙리스트 확인
    const isBlacklisted = await this.blacklistService.isBlacklisted(registerDto.phone!);
    if (isBlacklisted) {
      throw new BadRequestException('해당 전화번호로는 가입할 수 없습니다.');
    }

    // SMS 인증 활성화 여부 확인 (환경변수로 제어)
    const smsVerificationEnabled = this.configService.get<string>('SMS_VERIFICATION_ENABLED') === 'true';

    // 전화번호 SMS 인증·중복 확인
    if (hasPhone) {
      if (smsVerificationEnabled) {
        const isVerified = await this.phoneVerificationService.isVerified(registerDto.phone!);
        if (!isVerified) {
          throw new BadRequestException('전화번호 본인인증이 완료되지 않았습니다. 인증번호를 먼저 요청하고 인증을 완료해주세요.');
        }
      }
      const existingUser = await this.usersService.findByPhone(normalizedPhone);
      if (existingUser && existingUser.status === UserStatus.ACTIVE) {
        throw new BadRequestException('이미 가입된 휴대폰 번호입니다.');
      }
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
      // 이미 다른 계정에서 사용 중인 사업자번호인지 확인
      const existingByBusinessNumber = await this.usersService.findByBusinessNumber(registerDto.businessNumber);
      if (existingByBusinessNumber) {
        throw new BadRequestException('이미 등록된 사업자번호입니다. 다른 사업자번호를 입력해주세요.');
      }
    }

    // 사용자 생성
    const user = await this.usersService.createUser({
      email: registerDto.email,
      passwordHash: registerDto.password,
      phone: hasPhone ? normalizedPhone : null,
      phoneVerified: hasPhone, // 번호가 있으면 인증 완료(또는 SMS 비활성화), 없으면 미인증
      realName: registerDto.realName, // 실명 저장
      realNameVerified: true, // 전화번호 인증과 함께 실명인증 완료로 간주 (나중에 외부 API로 업그레이드 가능)
      nickname: registerDto.nickname,
      gender: registerDto.gender,
      ageRange: registerDto.ageRange,
      birthDate: registerDto.birthDate ? new Date(registerDto.birthDate) : null,
      residenceSido: registerDto.residenceSido,
      residenceSigungu: registerDto.residenceSigungu,
      residenceAddress: registerDto.residenceAddress?.trim() || null,
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

    // 가입 축하금 포인트 지급 (실패해도 회원가입은 성공 처리)
    try {
      await this.pointsService.addTransaction(
        user.id,
        AuthService.WELCOME_POINTS,
        PointTransactionType.EARN,
        '첫 가입 축하 포인트',
      );
    } catch (pointsErr) {
      console.error('[register] 가입 축하금 포인트 지급 실패:', pointsErr);
      // 회원가입은 완료되었으므로 500으로 실패시키지 않음
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email || undefined,
        nickname: user.nickname || undefined,
        isProfileComplete: user.isProfileComplete,
        residenceSido: user.residenceSido || null,
        residenceSigungu: user.residenceSigungu || null,
        residenceAddress: user.residenceAddress || null,
      },
    };
  }

  /**
   * 회원가입 시 사업자등록번호 검증 (내부/공개 API 공통)
   * - 국세청(공공데이터포털) API 키가 있고 대표자명·개업일자를 넘기면 진위확인 API 호출
   * - 그 외에는 형식 검증만 수행
   */
  private async verifyBusinessNumberForRegistration(
    businessNumber: string,
    options?: { representativeName?: string; openingDate?: string },
  ): Promise<boolean> {
    const businessNumberRegex = /^\d{3}-\d{2}-\d{5}$/;
    if (!businessNumberRegex.test(businessNumber)) {
      return false;
    }

    const result = await this.businessNumberVerificationService.verifyWithNts(
      businessNumber,
      options,
    );
    if (result === null) {
      return true;
    }
    return result.verified;
  }

  /**
   * 회원가입 단계에서 호출하는 사업자등록번호 검증 (비로그인 공개 API)
   * - 대표자명·개업일자를 함께 보내면 국세청 진위확인 API로 일치 여부 확인 (네이버클라우드와 유사)
   * - 이미 다른 계정에서 사용 중이면 verified: false 반환
   */
  async verifyBusinessNumberForRegistrationPublic(
    businessNumber: string,
    options?: { representativeName?: string; openingDate?: string },
  ): Promise<{
    verified: boolean;
    message?: string;
    apiUsed?: boolean;
  }> {
    const businessNumberRegex = /^\d{3}-\d{2}-\d{5}$/;
    if (!businessNumberRegex.test(businessNumber)) {
      return { verified: false, message: '사업자등록번호는 XXX-XX-XXXXX 형식으로 입력해주세요.' };
    }

    const existing = await this.usersService.findByBusinessNumber(businessNumber);
    if (existing) {
      return { verified: false, message: '이미 등록된 사업자번호입니다. 다른 사업자번호를 입력해주세요.' };
    }

    const result = await this.businessNumberVerificationService.verifyWithNts(
      businessNumber,
      options,
    );
    if (result !== null) {
      return {
        verified: result.verified,
        message: result.message,
        apiUsed: true,
      };
    }

    const verified = await this.verifyBusinessNumberForRegistration(businessNumber, options);
    if (!verified) {
      return {
        verified: false,
        message: '사업자등록번호 검증에 실패했습니다. 올바른 사업자등록번호를 입력해주세요.',
      };
    }
    return { verified: true };
  }

  /**
   * 사업자등록증 이미지 업로드 → OCR 추출 → 앞서 인증한 실명(대표자명)과 매칭 → 국세청 진위확인
   * - OCR 미설정 시: BadRequest
   * - OCR 추출 실패: BadRequest
   * - 문서 대표자명 ≠ 실명(실명인증): BadRequest (타인 사업자등록증 사용 방지)
   * - 일치 시 국세청 API + 중복 검사 후 verified + businessNumber 반환
   */
  async verifyBusinessWithDocumentForRegistration(
    file: Express.Multer.File,
    dto: VerifyBusinessWithDocumentDto,
  ): Promise<{ verified: boolean; message?: string; businessNumber?: string }> {
    if (!file?.buffer) {
      throw new BadRequestException('사업자등록증 이미지 파일을 업로드해 주세요.');
    }

    if (!this.businessRegistrationOcrService.isConfigured()) {
      throw new BadRequestException(
        '사업자등록증 검증(OCR) 서비스가 설정되지 않았습니다. 관리자에게 문의해 주세요.',
      );
    }

    const ocrResult = await this.businessRegistrationOcrService.extractFromFile(file);
    if (!ocrResult) {
      throw new BadRequestException(
        '사업자등록증 이미지에서 정보를 읽을 수 없습니다. 선명한 사업자등록증 이미지를 올려주세요.',
      );
    }

    const normalizeName = (s: string | undefined): string =>
      (s ?? '').replace(/\s/g, '').trim();

    const realName = normalizeName(dto.realName);
    const ocrRepresentativeName = normalizeName(ocrResult.representativeName);
    if (!ocrRepresentativeName) {
      throw new BadRequestException(
        '사업자등록증에서 대표자명을 읽을 수 없습니다. 선명한 이미지를 올려주세요.',
      );
    }
    if (realName !== ocrRepresentativeName) {
      throw new BadRequestException(
        '사업자등록증의 대표자명과 앞서 인증한 실명이 일치하지 않습니다. 본인 명의의 사업자등록증을 올려주세요.',
      );
    }

    const businessNumber = ocrResult.businessNumber;
    const formatOk = /^\d{3}-\d{2}-\d{5}$/.test(businessNumber);
    if (!formatOk) {
      throw new BadRequestException(
        '사업자등록증에서 올바른 사업자번호를 읽을 수 없습니다. 이미지를 확인해 주세요.',
      );
    }

    const existing = await this.usersService.findByBusinessNumber(businessNumber);
    if (existing) {
      return {
        verified: false,
        message: '이미 등록된 사업자번호입니다. 다른 사업자번호의 사업자등록증을 올려주세요.',
      };
    }

    const ntsResult = await this.businessNumberVerificationService.verifyWithNts(
      businessNumber,
      {
        representativeName: ocrResult.representativeName,
        openingDate: ocrResult.openingDate,
      },
    );
    if (ntsResult !== null && !ntsResult.verified) {
      return {
        verified: false,
        message:
          ntsResult.message ??
          '사업자등록정보(국세청)와 일치하지 않습니다. 정확한 사업자등록증을 올려주세요.',
      };
    }

    return { verified: true, businessNumber };
  }

  /**
   * 비즈니스 계정 전환 1단계: 사업자등록증 이미지 → OCR만 수행, 추출 결과와 가입자 실명 대조
   * - 전환은 하지 않음. 클라이언트에서 대조 결과 확인 후 전환하기 버튼으로 registerBusinessConfirm 호출
   * - OCR 실패 시: ocrFailed: true 반환 → 클라이언트에서 직접입력 폼 노출 후 confirm으로 제출
   */
  async extractBusinessFromDocument(
    userId: number,
    file: Express.Multer.File,
    dto: RegisterBusinessWithDocumentDto,
  ): Promise<{
    verified: boolean;
    ocrFailed?: boolean;
    message?: string;
    extracted?: { businessNumber: string; representativeName?: string; openingDate?: string };
    match?: boolean;
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    if (user.businessNumber && user.businessNumberVerified) {
      throw new BadRequestException('이미 비즈니스 계정으로 인증되어 있습니다.');
    }

    const normalizeName = (s: string | undefined | null): string =>
      (s ?? '').replace(/\s/g, '').trim();
    const realName = normalizeName(dto?.realName ?? user.realName ?? undefined);
    if (!realName) {
      throw new BadRequestException(
        '실명이 등록되어 있지 않습니다. 내 정보에서 실명을 먼저 등록해 주세요.',
      );
    }

    if (!this.businessRegistrationOcrService.isConfigured()) {
      throw new BadRequestException(
        '사업자등록증 검증(OCR) 서비스가 설정되지 않았습니다. 관리자에게 문의해 주세요.',
      );
    }

    if (!file?.buffer?.length) {
      return {
        verified: false,
        ocrFailed: true,
        message: '사업자등록증 이미지 파일을 업로드해 주세요.',
      };
    }

    const ocrResult = await this.businessRegistrationOcrService.extractFromFile(file);
    if (!ocrResult) {
      return {
        verified: false,
        ocrFailed: true,
        message: '사업자등록증 이미지에서 정보를 읽을 수 없습니다. 선명한 이미지를 올려주시거나 아래에서 직접 입력해 주세요.',
      };
    }

    const businessNumber = ocrResult.businessNumber;
    if (!/^\d{3}-\d{2}-\d{5}$/.test(businessNumber)) {
      return {
        verified: false,
        ocrFailed: true,
        message: '사업자등록증에서 올바른 사업자번호를 읽을 수 없습니다. 직접 입력해 주세요.',
      };
    }

    const ocrRepName = normalizeName(ocrResult.representativeName);
    const match = !!ocrRepName && realName === ocrRepName;

    return {
      verified: true,
      extracted: {
        businessNumber,
        representativeName: ocrResult.representativeName?.trim(),
        openingDate: ocrResult.openingDate,
      },
      match,
    };
  }

  /**
   * 비즈니스 계정 전환 2단계: 추출 정보 또는 직접입력으로 전환 확정
   * - 대표자명이 가입자 실명과 일치해야 함. 국세청 진위확인 후 계정에 반영
   */
  async registerBusinessConfirm(
    userId: number,
    dto: RegisterBusinessConfirmDto,
  ): Promise<{ verified: boolean; message?: string; businessNumber?: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    if (user.businessNumber && user.businessNumberVerified) {
      throw new BadRequestException('이미 비즈니스 계정으로 인증되어 있습니다.');
    }

    const normalizeName = (s: string | undefined | null): string =>
      (s ?? '').replace(/\s/g, '').trim();
    const realName = normalizeName(user.realName ?? undefined);
    if (!realName) {
      throw new BadRequestException(
        '실명이 등록되어 있지 않습니다. 내 정보에서 실명을 먼저 등록해 주세요.',
      );
    }

    const inputRepName = normalizeName(dto.representativeName);
    if (inputRepName && inputRepName !== realName) {
      return {
        verified: false,
        message: '입력한 대표자명이 등록된 실명과 일치하지 않습니다. 본인 명의의 사업자정보만 등록할 수 있습니다.',
      };
    }

    const existing = await this.usersService.findByBusinessNumber(dto.businessNumber, userId);
    if (existing) {
      return {
        verified: false,
        message: '이미 등록된 사업자번호입니다. 다른 사업자번호를 입력해 주세요.',
      };
    }

    const ntsResult = await this.businessNumberVerificationService.verifyWithNts(
      dto.businessNumber,
      {
        representativeName: inputRepName || realName,
        openingDate: dto.openingDate,
      },
    );
    if (ntsResult !== null && !ntsResult.verified) {
      return {
        verified: false,
        message:
          ntsResult.message ??
          '사업자등록정보(국세청)와 일치하지 않습니다. 사업자번호·대표자명·개업일자를 확인해 주세요.',
      };
    }

    await this.usersService.updateUser(userId, {
      businessNumber: dto.businessNumber,
      businessNumberVerified: true,
    });

    return { verified: true, businessNumber: dto.businessNumber };
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
        residenceSido: user.residenceSido || null,
        residenceSigungu: user.residenceSigungu || null,
        residenceAddress: user.residenceAddress || null,
      },
    };
  }

  async socialCallback(
    callbackDto: SocialCallbackDto,
    socialUserInfo: {
      providerUserId: string;
      email?: string;
      name?: string;
      nickname?: string;
      profileImageUrl?: string;
      phone?: string;
      gender?: string;
      age?: string;
    },
  ): Promise<AuthResponse> {
    // 기존 소셜 계정으로 로그인한 사용자 찾기
    let user: User | null = await this.usersService.findBySocialAccount(
      callbackDto.provider,
      socialUserInfo.providerUserId,
    );

    // 탈퇴한 사용자가 같은 소셜 계정으로 재가입 시도 → 재가입 처리 (상태 복구)
    // 단, 해당 이메일/전화가 이미 다른 활성 계정에 있으면 복구 대신 기존 계정 로그인 유도
    if (user?.status === UserStatus.DELETED) {
      const oauthEmail = socialUserInfo.email?.trim() || null;
      const oauthPhone = socialUserInfo.phone?.replace(/-/g, '').trim() || null;
      const existingOther = await this.usersService.findExistingUserByEmailOrPhone(oauthEmail, oauthPhone);
      if (existingOther && existingOther.id !== user.id) {
        const primaryAccount = existingOther.socialAccounts?.find((a) => a.isPrimary) ?? existingOther.socialAccounts?.[0];
        const existingProvider = primaryAccount?.provider;
        if (existingProvider) {
          const providerNames: Record<SocialProvider, string> = {
            [SocialProvider.NAVER]: '네이버',
            [SocialProvider.KAKAO]: '카카오',
            [SocialProvider.GOOGLE]: '구글',
          };
          const existingName = providerNames[existingProvider] ?? existingProvider;
          throw new BadRequestException({
            message: `이미 ${existingName}로 가입된 계정이 있습니다. ${existingName}로 로그인해 주세요.`,
            existingProvider,
          });
        }
      }
      try {
        user = await this.usersService.updateUser(user.id, {
          status: UserStatus.PENDING,
          isProfileComplete: false,
          nickname: '',
          tag: null,
          email: oauthEmail,
          realName: socialUserInfo.name?.trim() || null,
          realNameVerified: !!socialUserInfo.name?.trim(),
          phone: oauthPhone,
          phoneVerified: !!oauthPhone,
          residenceSido: '',
          residenceSigungu: '',
          residenceAddress: null,
        });
      } catch (updateErr) {
        // 이메일/전화 고유 제약 위반 시 기존 계정으로 로그인 유도
        if (updateErr instanceof QueryFailedError && (updateErr as any).code === '23505') {
          const existingOther = await this.usersService.findExistingUserByEmailOrPhone(oauthEmail, oauthPhone);
          if (existingOther) {
            const primaryAccount = existingOther.socialAccounts?.find((a) => a.isPrimary) ?? existingOther.socialAccounts?.[0];
            const existingProvider = primaryAccount?.provider;
            if (existingProvider) {
              const providerNames: Record<SocialProvider, string> = {
                [SocialProvider.NAVER]: '네이버',
                [SocialProvider.KAKAO]: '카카오',
                [SocialProvider.GOOGLE]: '구글',
              };
              const existingName = providerNames[existingProvider] ?? existingProvider;
              throw new BadRequestException({
                message: `이미 ${existingName}로 가입된 계정이 있습니다. ${existingName}로 로그인해 주세요.`,
                existingProvider,
              });
            }
          }
        }
        throw updateErr;
      }
    }

    const isNewUser = !user;

    if (isNewUser) {
      // 계정 찾기/통합 유도: 동일 이메일·전화번호로 다른 소셜 로그인 시도 시 기존 계정 안내
      const oauthEmail = socialUserInfo.email?.trim().toLowerCase() || null;
      const oauthPhone = socialUserInfo.phone?.replace(/-/g, '').trim() || null;
      const existingUser = await this.usersService.findExistingUserByEmailOrPhone(
        socialUserInfo.email?.trim() || null,
        oauthPhone,
      );
      if (existingUser) {
        const primaryAccount = existingUser.socialAccounts?.find((a) => a.isPrimary) ?? existingUser.socialAccounts?.[0];
        const existingProvider = primaryAccount?.provider;
        if (existingProvider && existingProvider !== callbackDto.provider) {
          const providerNames: Record<SocialProvider, string> = {
            [SocialProvider.NAVER]: '네이버',
            [SocialProvider.KAKAO]: '카카오',
            [SocialProvider.GOOGLE]: '구글',
          };
          const existingName = providerNames[existingProvider] ?? existingProvider;
          throw new BadRequestException({
            message: `이미 ${existingName}로 가입된 계정이 있습니다. ${existingName}로 로그인해 주세요.`,
            existingProvider,
          });
        }
      }

      // 신규 사용자: 임시 User 생성 (소셜에서 제공하는 name·email·phone 자동 저장)
      try {
        user = await this.usersService.createUser({
          email: oauthEmail,
          passwordHash: null,
          nickname: '', // 추가 정보 입력 시 받음
          realName: socialUserInfo.name?.trim() || null,
          realNameVerified: !!socialUserInfo.name?.trim(),
          phone: oauthPhone,
          phoneVerified: !!oauthPhone,
          gender: null,
          residenceSido: '',
          residenceSigungu: '',
          status: UserStatus.PENDING,
          isProfileComplete: false,
        });
      } catch (createErr) {
        // 이메일 중복(ConflictException) 시 기존 가입 경로로 유도
        if (createErr instanceof ConflictException && oauthEmail) {
          const existingByEmail = await this.usersService.findExistingUserByEmailOrPhone(
            socialUserInfo.email?.trim() || null,
            null,
          );
          if (existingByEmail) {
            const primaryAccount = existingByEmail.socialAccounts?.find((a) => a.isPrimary)
              ?? existingByEmail.socialAccounts?.[0];
            const existingProvider = primaryAccount?.provider;
            if (existingProvider && existingProvider !== callbackDto.provider) {
              const providerNames: Record<SocialProvider, string> = {
                [SocialProvider.NAVER]: '네이버',
                [SocialProvider.KAKAO]: '카카오',
                [SocialProvider.GOOGLE]: '구글',
              };
              const existingName = providerNames[existingProvider] ?? existingProvider;
              throw new BadRequestException({
                message: `이미 ${existingName}로 가입된 계정이 있습니다. ${existingName}로 로그인해 주세요.`,
                existingProvider,
              });
            }
          }
        }
        throw createErr;
      }

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

      // 프로필 미완성 사용자: 소셜에서 제공하는 정보가 비어있으면 보충
      if (!user.isProfileComplete) {
        const updates: Partial<typeof user> = {};
        if (!user.email?.trim() && socialUserInfo.email?.trim()) {
          updates.email = socialUserInfo.email.trim();
        }
        // 네이버: 실명·전화 제공. 카카오·구글: nickname/name만 (실명 없음)
        if (callbackDto.provider === SocialProvider.NAVER) {
          if (!user.realName?.trim() && socialUserInfo.name?.trim()) {
            updates.realName = socialUserInfo.name.trim();
            updates.realNameVerified = true;
          }
          if (!user.phone?.trim() && socialUserInfo.phone?.trim()) {
            updates.phone = socialUserInfo.phone.replace(/-/g, '').trim();
            updates.phoneVerified = true;
          }
        } else if ((callbackDto.provider === SocialProvider.KAKAO || callbackDto.provider === SocialProvider.GOOGLE) && !user.realName?.trim() && socialUserInfo.name?.trim()) {
          updates.realName = socialUserInfo.name.trim();
        }
        if (Object.keys(updates).length > 0) {
          user = await this.usersService.updateUser(user.id, updates);
        }
      }
    }

    // user가 null이 아님을 확인 (위의 로직으로 보장됨)
    if (!user) {
      throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
    }

    const token = this.generateToken(user);

    // 추가정보 입력 폼 자동 채움용 (닉네임·성별·연령대). 신규 또는 프로필 미완성 사용자
    let socialProfile: AuthResponse['socialProfile'] | undefined;
    if (isNewUser || !user.isProfileComplete) {
      const genderMap: Record<string, string> = { F: 'female', M: 'male', U: 'other' };
      const ageMap: Record<string, string> = {
        '10-19': '10-19',
        '20-29': '25-29',
        '30-39': '35-39',
        '40-49': '40-49',
        '50-59': '50+',
        '60+': '50+',
      };
      socialProfile = {
        nickname: socialUserInfo.nickname || socialUserInfo.name || undefined,
        gender: socialUserInfo.gender ? genderMap[socialUserInfo.gender] || undefined : undefined,
        ageRange: socialUserInfo.age ? (ageMap[socialUserInfo.age] ?? socialUserInfo.age) : undefined,
      };
      if (Object.values(socialProfile).every((v) => !v)) socialProfile = undefined;
    }

    return {
      token,
      isNewUser,
      user: {
        id: user.id,
        email: user.email || undefined,
        nickname: user.nickname || undefined,
        isProfileComplete: user.isProfileComplete,
        residenceSido: user.residenceSido || null,
        residenceSigungu: user.residenceSigungu || null,
        residenceAddress: user.residenceAddress || null,
      },
      providerEmail: socialUserInfo.email,
      socialProfile,
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

    // 회원가입과 동일: residenceAddress에 전체 주소가 오면 그대로 사용, 아니면 시/도+시/군/구 결합
    const fullAddress = profileDto.residenceAddress?.trim()
      || (profileDto.residenceSido && profileDto.residenceSigungu
        ? [profileDto.residenceSido, profileDto.residenceSigungu].filter(Boolean).join(' ').trim()
        : null)
      || null;
    const profileData: Record<string, unknown> = {
      nickname: profileDto.nickname,
      gender: profileDto.gender,
      ageRange: profileDto.ageRange,
      birthDate: profileDto.birthDate ? new Date(profileDto.birthDate) : null,
      residenceSido: profileDto.residenceSido,
      residenceSigungu: profileDto.residenceSigungu,
      residenceAddress: fullAddress,
      interestedSports: profileDto.interestedSports || [],
      sportPositions: profileDto.sportPositions || [],
      skillLevel: profileDto.skillLevel,
      termsServiceAgreed: profileDto.termsServiceAgreed,
      termsPrivacyAgreed: profileDto.termsPrivacyAgreed,
      marketingConsent: profileDto.marketingConsent || false,
      marketingEmailConsent: profileDto.marketingEmailConsent || false,
      marketingSmsConsent: profileDto.marketingSmsConsent || false,
    };
    if (profileDto.realName?.trim()) {
      profileData.realName = profileDto.realName.trim();
      profileData.realNameVerified = true;
    }
    // 휴대전화 필수 (가입자 구분)
    if (!profileDto.phone?.trim()) {
      throw new BadRequestException('휴대전화 번호는 필수입니다.');
    }
    const normalizedPhone = profileDto.phone.replace(/-/g, '').trim();
    const existingByPhone = await this.usersService.findByPhone(normalizedPhone);
    if (existingByPhone && existingByPhone.id !== userId) {
      throw new BadRequestException('이미 가입된 휴대폰 번호입니다. 다른 번호를 입력해주세요.');
    }
    profileData.phone = normalizedPhone;
    profileData.phoneVerified = true;
    const updatedUser = await this.usersService.completeProfile(userId, profileData as Partial<User>);

    const token = this.generateToken(updatedUser);

    return {
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email || undefined,
        nickname: updatedUser.nickname,
        isProfileComplete: updatedUser.isProfileComplete,
        residenceSido: updatedUser.residenceSido || null,
        residenceSigungu: updatedUser.residenceSigungu || null,
        residenceAddress: updatedUser.residenceAddress || null,
      },
    };
  }

  async checkNicknameAvailability(nickname: string): Promise<{ available: boolean; tag?: string }> {
    const available = await this.usersService.checkNicknameAvailable(nickname);
    const tag = available ? await this.usersService.generateTagForNickname(nickname) : undefined;
    return { available, tag };
  }

  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const available = await this.usersService.checkEmailAvailable(email);
    return { available };
  }

  async updateProfile(
    userId: number,
    updateData: {
      nickname?: string;
      phone?: string;
      verificationCode?: string;
      interestedSports?: string[];
      sportPositions?: { sport: string; positions: string[] }[];
      skillLevel?: SkillLevel;
      notifyRefereeRankMatchInRegion?: boolean;
    },
    file?: Express.Multer.File,
  ): Promise<User> {
    const smsEnabled = this.configService.get<string>('SMS_VERIFICATION_ENABLED') === 'true';

    // 연락처 수정 시 SMS 인증 강제
    if (updateData.phone !== undefined) {
      const normalizedNewPhone = updateData.phone.replace(/-/g, '').trim();

      if (smsEnabled) {
        if (!updateData.verificationCode?.trim()) {
          throw new BadRequestException('연락처 수정 시 SMS 인증이 필요합니다. 인증번호를 입력해주세요.');
        }
        await this.phoneVerificationService.verifyCode(updateData.phone, updateData.verificationCode);
      }

      updateData = { ...updateData, phone: normalizedNewPhone || null, phoneVerified: true } as any;
      delete (updateData as any).verificationCode;
    } else {
      const { verificationCode: _, ...rest } = updateData;
      updateData = rest as any;
    }

    // 파일이 있으면 프로필 이미지 업로드 처리
    if (file) {
      const profileImageUrl = await this.uploadProfileImage(userId, file);
      updateData = { ...updateData, profileImageUrl } as any;
    }
    return this.usersService.updateUser(userId, updateData);
  }

  /** 프로필 이미지만 업로드 (POST 전용 — PUT은 multipart 미지원 이슈로 별도 라우트 사용) */
  async updateProfileImage(userId: number, file: Express.Multer.File): Promise<User> {
    const profileImageUrl = await this.uploadProfileImage(userId, file);
    return this.usersService.updateUser(userId, { profileImageUrl } as Partial<User>);
  }

  async updateMercenaryProfile(
    userId: number,
    dto: {
      mercenaryActivityStatus?: 'active' | 'paused';
      mercenaryAvailability?: Array<{ dayOfWeek: number; timeSlots: Array<{ start: string; end: string }> }>;
      interestedSports?: string[];
      sportPositions?: { sport: string; positions: string[] }[];
      sportEquipment?: { sport: string; equipment: string[] }[];
      ohunRanks?: Record<string, string>;
      mercenaryActiveBySport?: Record<string, boolean>;
    },
  ): Promise<User> {
    const updateData: Partial<User> = {};
    if (dto.mercenaryActivityStatus !== undefined) updateData.mercenaryActivityStatus = dto.mercenaryActivityStatus;
    if (dto.mercenaryAvailability !== undefined) updateData.mercenaryAvailability = dto.mercenaryAvailability;
    if (dto.interestedSports !== undefined) updateData.interestedSports = dto.interestedSports;
    if (dto.sportPositions !== undefined) updateData.sportPositions = dto.sportPositions;
    if (dto.sportEquipment !== undefined) updateData.sportEquipment = dto.sportEquipment;
    if (dto.ohunRanks !== undefined) updateData.ohunRanks = dto.ohunRanks;
    if (dto.mercenaryActiveBySport !== undefined) updateData.mercenaryActiveBySport = dto.mercenaryActiveBySport;
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
    if (!user) {
      throw new UnauthorizedException('유효하지 않은 사용자입니다.');
    }
    // PENDING: 소셜 로그인 후 프로필 미완성 사용자 (complete-profile 접근 허용)
    // ACTIVE: 정상 사용자
    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING) {
      throw new UnauthorizedException('유효하지 않은 사용자입니다.');
    }
    return user;
  }

  /**
   * 사업자번호 검증 (로그인 후)
   * - 대표자명·개업일자를 함께 보내면 국세청 진위확인 API로 일치 여부 확인
   */
  async verifyBusinessNumber(userId: number, verifyDto: VerifyBusinessNumberDto): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const verified = await this.verifyBusinessNumberForRegistration(verifyDto.businessNumber, {
      representativeName: verifyDto.representativeName,
      openingDate: verifyDto.openingDate,
    });
    if (!verified) {
      throw new BadRequestException(
        '사업자등록번호 검증에 실패했습니다. 사업자번호·대표자명·개업일자를 확인해 주세요.',
      );
    }

    return this.usersService.updateUser(userId, {
      businessNumber: verifyDto.businessNumber,
      businessNumberVerified: true,
    });
  }

  /**
   * 비밀번호만 확인 (사업자번호 변경 1단계 등에서 사용)
   */
  async verifyPasswordOnly(userId: number, password: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('비밀번호를 확인할 수 없습니다.');
    }
    const isValid = await this.usersService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }
  }

  /**
   * 사업자번호 변경 (비밀번호 확인 후 API 검증 및 중복 검사)
   */
  async changeBusinessNumber(userId: number, dto: ChangeBusinessNumberDto): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    if (!user.passwordHash) {
      throw new BadRequestException('비밀번호로 가입한 계정만 사업자번호를 변경할 수 있습니다.');
    }

    const isPasswordValid = await this.usersService.verifyPassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    const newBusinessNumber = dto.newBusinessNumber.trim();
    const verified = await this.verifyBusinessNumberForRegistration(newBusinessNumber, undefined);
    if (!verified) {
      throw new BadRequestException('사업자등록번호 검증에 실패했습니다. 올바른 사업자등록번호를 입력해주세요.');
    }

    const existing = await this.usersService.findByBusinessNumber(newBusinessNumber, userId);
    if (existing) {
      throw new BadRequestException('이미 다른 계정에서 사용 중인 사업자번호입니다. 다른 사업자번호를 입력해주세요.');
    }

    return this.usersService.updateUser(userId, {
      businessNumber: newBusinessNumber,
      businessNumberVerified: true,
    });
  }

  /**
   * 회원 탈퇴
   */
  async withdraw(userId: number): Promise<void> {
    await this.usersService.withdrawUser(userId);
  }

}

