import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
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
    // 본인인증 완료 여부 확인 (이미 인증된 상태인지 확인)
    const normalizedPhone = registerDto.phone.replace(/-/g, '');
    const isVerified = await this.phoneVerificationService.isVerified(registerDto.phone);

    if (!isVerified) {
      throw new BadRequestException('전화번호 본인인증이 완료되지 않았습니다. 인증번호를 먼저 요청하고 인증을 완료해주세요.');
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
      phoneVerified: true, // 전화번호 본인인증 완료
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

  async updateProfile(userId: number, updateData: { nickname?: string; phone?: string; latitude?: number; longitude?: number; interestedSports?: string[]; skillLevel?: SkillLevel }): Promise<User> {
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

  /**
   * 좌표를 주소로 변환 (역지오코딩)
   */
  async reverseGeocode(longitude: number, latitude: number): Promise<string> {
    const NAVER_CLIENT_ID = this.configService.get<string>('NAVER_MAP_CLIENT_ID');
    const NAVER_CLIENT_SECRET = this.configService.get<string>('NAVER_MAP_CLIENT_SECRET');

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      throw new BadRequestException('네이버 지도 API 키가 설정되지 않았습니다.');
    }

    try {
      // 네이버 클라우드 플랫폼 Maps 서비스의 역지오코딩 API
      // Maps 서비스는 API Gateway를 통해 제공되므로 엔드포인트가 다를 수 있음
      const response = await axios.get(
        `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc`,
        {
          params: {
            coords: `${longitude},${latitude}`,
            output: 'json',
          },
          headers: {
            'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
            'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
          },
        }
      );
      
      console.log('역지오코딩 API 호출 성공:', {
        url: `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc`,
        params: { coords: `${longitude},${latitude}`, output: 'json' },
        clientId: NAVER_CLIENT_ID,
      });

      const geoData = response.data;
      const address = geoData.results?.[0]?.region?.area1?.name && 
                     geoData.results?.[0]?.region?.area2?.name &&
                     geoData.results?.[0]?.region?.area3?.name
                     ? `${geoData.results[0].region.area1.name} ${geoData.results[0].region.area2.name} ${geoData.results[0].region.area3.name}`
                     : geoData.results?.[0]?.land?.name || 
                     '주소를 가져올 수 없습니다';

      return address;
    } catch (error: any) {
      console.error('역지오코딩 실패:', error);
      console.error('에러 상세:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // 401 Unauthorized 에러인 경우 더 자세한 메시지 제공
      if (error.response?.status === 401) {
        throw new BadRequestException(
          '네이버 지도 API 인증에 실패했습니다. API 키와 서비스 활성화 상태를 확인해주세요. (401 Unauthorized)'
        );
      }
      
      throw new BadRequestException('주소를 가져오는데 실패했습니다.');
    }
  }

  async geocode(address: string): Promise<{ latitude: number; longitude: number }> {
    const NAVER_CLIENT_ID = this.configService.get<string>('NAVER_MAP_CLIENT_ID');
    const NAVER_CLIENT_SECRET = this.configService.get<string>('NAVER_MAP_CLIENT_SECRET');

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      throw new BadRequestException('네이버 지도 API 키가 설정되지 않았습니다.');
    }

    try {
      // 네이버 클라우드 플랫폼 Maps 서비스의 지오코딩 API
      const response = await axios.get(
        `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode`,
        {
          params: {
            query: address,
          },
          headers: {
            'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
            'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
          },
        }
      );

      const geoData = response.data;
      
      if (geoData.status === 'OK' && geoData.addresses && geoData.addresses.length > 0) {
        const { y: latitude, x: longitude } = geoData.addresses[0];
        return {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
      }

      throw new BadRequestException('주소에 대한 위치 정보를 찾을 수 없습니다.');
    } catch (error: any) {
      console.error('지오코딩 실패:', error);
      console.error('에러 상세:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.status === 401) {
        throw new BadRequestException('네이버 지도 API 인증에 실패했습니다. API 키와 서비스 활성화 상태를 확인해주세요. (401 Unauthorized)');
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('주소 검색에 실패했습니다. 다시 시도해주세요.');
    }
  }
}

