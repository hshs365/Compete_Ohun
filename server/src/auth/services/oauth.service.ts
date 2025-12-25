import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SocialProvider } from '../../social-accounts/entities/social-account.entity';

export interface OAuthUserInfo {
  providerUserId: string;
  email?: string;
  name?: string;
  profileImageUrl?: string;
}

@Injectable()
export class OAuthService {
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  /**
   * 카카오 OAuth 인증 URL 생성
   */
  getKakaoAuthUrl(state: string): string {
    const clientId = this.configService.get<string>('KAKAO_CLIENT_ID');
    const redirectUri = `${this.frontendUrl}/auth/oauth/callback?provider=kakao`;
    
    if (!clientId) {
      throw new BadRequestException('KAKAO_CLIENT_ID가 설정되지 않았습니다.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state,
    });

    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * 카카오 OAuth code를 access token으로 교환
   */
  async exchangeKakaoCode(code: string, redirectUri: string): Promise<string> {
    const clientId = this.configService.get<string>('KAKAO_CLIENT_ID');
    const clientSecret = this.configService.get<string>('KAKAO_CLIENT_SECRET');

    if (!clientId) {
      throw new BadRequestException('KAKAO_CLIENT_ID가 설정되지 않았습니다.');
    }

    try {
      const response = await axios.post(
        'https://kauth.kakao.com/oauth/token',
        {
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code: code,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        },
      );

      return response.data.access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `카카오 토큰 교환 실패: ${error.response?.data?.error_description || error.message}`,
        );
      }
      throw new BadRequestException('카카오 토큰 교환 중 오류가 발생했습니다.');
    }
  }

  /**
   * 카카오 access token으로 사용자 정보 조회
   */
  async getKakaoUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          property_keys: JSON.stringify(['kakao_account.email', 'kakao_account.profile']),
        },
      });

      const kakaoAccount = response.data.kakao_account;
      const profile = kakaoAccount?.profile;

      return {
        providerUserId: response.data.id.toString(),
        email: kakaoAccount?.email,
        name: profile?.nickname,
        profileImageUrl: profile?.profile_image_url,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `카카오 사용자 정보 조회 실패: ${error.response?.data?.error_description || error.message}`,
        );
      }
      throw new BadRequestException('카카오 사용자 정보 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 구글 OAuth 인증 URL 생성
   */
  getGoogleAuthUrl(state: string): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = `${this.frontendUrl}/auth/oauth/callback?provider=google`;

    if (!clientId) {
      throw new BadRequestException('GOOGLE_CLIENT_ID가 설정되지 않았습니다.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * 구글 OAuth code를 access token으로 교환
   */
  async exchangeGoogleCode(code: string, redirectUri: string): Promise<string> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new BadRequestException('GOOGLE_CLIENT_ID 또는 GOOGLE_CLIENT_SECRET이 설정되지 않았습니다.');
    }

    try {
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data.access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `구글 토큰 교환 실패: ${error.response?.data?.error_description || error.message}`,
        );
      }
      throw new BadRequestException('구글 토큰 교환 중 오류가 발생했습니다.');
    }
  }

  /**
   * 구글 access token으로 사용자 정보 조회
   */
  async getGoogleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        providerUserId: response.data.id,
        email: response.data.email,
        name: response.data.name,
        profileImageUrl: response.data.picture,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `구글 사용자 정보 조회 실패: ${error.response?.data?.error_description || error.message}`,
        );
      }
      throw new BadRequestException('구글 사용자 정보 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * CSRF 방지를 위한 state 생성
   */
  generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}


