import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { OAuthService } from './services/oauth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { SocialCallbackDto } from './dto/social-callback.dto';
import { OAuthAuthUrlDto } from './dto/oauth-auth-url.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { SocialProvider } from '../social-accounts/entities/social-account.entity';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private oauthService: OAuthService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Get('social/auth-url')
  @HttpCode(HttpStatus.OK)
  async getSocialAuthUrl(@Query(ValidationPipe) query: OAuthAuthUrlDto) {
    const state = this.oauthService.generateState();
    let authUrl: string;

    if (query.provider === SocialProvider.KAKAO) {
      authUrl = this.oauthService.getKakaoAuthUrl(state);
    } else if (query.provider === SocialProvider.GOOGLE) {
      authUrl = this.oauthService.getGoogleAuthUrl(state);
    } else {
      throw new BadRequestException('지원하지 않는 소셜 로그인 제공자입니다.');
    }

    return {
      authUrl,
      state,
    };
  }

  @Public()
  @Post('social/callback')
  @HttpCode(HttpStatus.OK)
  async socialCallback(
    @Query(ValidationPipe) callbackDto: SocialCallbackDto,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUri = `${frontendUrl}/auth/oauth/callback?provider=${callbackDto.provider}`;

    let accessToken: string;
    let userInfo: {
      providerUserId: string;
      email?: string;
      name?: string;
      profileImageUrl?: string;
    };

    try {
      // OAuth code를 access token으로 교환
      if (callbackDto.provider === SocialProvider.KAKAO) {
        accessToken = await this.oauthService.exchangeKakaoCode(callbackDto.code, redirectUri);
        userInfo = await this.oauthService.getKakaoUserInfo(accessToken);
      } else if (callbackDto.provider === SocialProvider.GOOGLE) {
        accessToken = await this.oauthService.exchangeGoogleCode(callbackDto.code, redirectUri);
        userInfo = await this.oauthService.getGoogleUserInfo(accessToken);
      } else {
        throw new BadRequestException('지원하지 않는 소셜 로그인 제공자입니다.');
      }

      // 사용자 정보를 기반으로 로그인 처리
      return this.authService.socialCallback(callbackDto, userInfo);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : '소셜 로그인 처리 중 오류가 발생했습니다.',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete-profile')
  @HttpCode(HttpStatus.OK)
  async completeProfile(
    @CurrentUser() user: User,
    @Body(ValidationPipe) completeProfileDto: CompleteProfileDto,
  ) {
    return this.authService.completeProfile(user.id, completeProfileDto);
  }

  @Public()
  @Get('check-nickname')
  @HttpCode(HttpStatus.OK)
  async checkNickname(@Query('nickname') nickname: string) {
    if (!nickname || nickname.length < 2) {
      throw new BadRequestException('닉네임은 2자 이상이어야 합니다.');
    }
    return this.authService.checkNicknameAvailability(nickname);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: User) {
    // 소셜 계정 정보 조회
    const socialAccounts = user.socialAccounts || [];
    const connectedProviders = {
      kakao: socialAccounts.some((account) => account.provider === SocialProvider.KAKAO),
      naver: false, // 네이버 로그인은 아직 구현되지 않음
      google: socialAccounts.some((account) => account.provider === SocialProvider.GOOGLE),
    };

    return {
      id: user.id,
      email: user.email || null,
      nickname: user.nickname || null,
      gender: user.gender || null,
      ageRange: user.ageRange || null,
      birthDate: user.birthDate || null,
      residenceSido: user.residenceSido || null,
      residenceSigungu: user.residenceSigungu || null,
      interestedSports: user.interestedSports || [],
      skillLevel: user.skillLevel || null,
      isProfileComplete: user.isProfileComplete,
      createdAt: user.createdAt,
      marketingEmailConsent: user.marketingEmailConsent,
      marketingSmsConsent: user.marketingSmsConsent,
      socialAccounts: connectedProviders,
      // phone 필드는 DB에 없으므로 null로 반환
      phone: null,
    };
  }
}

