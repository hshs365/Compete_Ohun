import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SocialProvider } from '../../social-accounts/entities/social-account.entity';

export interface OAuthUserInfo {
  providerUserId: string;
  email?: string;
  name?: string;
  nickname?: string;
  profileImageUrl?: string;
  /** 네이버: 휴대전화번호 (010-0000-0000 형식) */
  phone?: string;
  /** 네이버: F/M/U */
  gender?: string;
  /** 네이버: 10-19, 20-29, 40-49 등 */
  age?: string;
  /** 네이버: MM-DD */
  birthday?: string;
  birthyear?: string;
}

@Injectable()
export class OAuthService {
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  /**
   * 카카오 OAuth 인증 URL 생성
   * scope: profile_nickname, profile_image, account_email (닉네임·프로필사진·이메일)
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
      scope: 'profile_nickname,profile_image,account_email',
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
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code: code,
      });
      if (clientSecret) params.append('client_secret', clientSecret);

      const response = await axios.post(
        'https://kauth.kakao.com/oauth/token',
        params.toString(),
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
   * scope: profile_nickname, profile_image, account_email 요청 시 kakao_account.profile, email 사용 가능
   */
  async getKakaoUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = response.data;
      const kakaoAccount = data.kakao_account || {};
      const profile = kakaoAccount.profile || {};

      return {
        providerUserId: data.id?.toString() ?? '',
        email: kakaoAccount.email,
        name: profile.nickname || kakaoAccount.name,
        nickname: profile.nickname,
        profileImageUrl: profile.profile_image_url || profile.thumbnail_image_url,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errMsg = error.response?.data?.msg || error.response?.data?.error_description || error.message;
        throw new BadRequestException(`카카오 사용자 정보 조회 실패: ${errMsg}`);
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
   * 네이버 OAuth 인증 URL 생성
   */
  getNaverAuthUrl(state: string): string {
    const clientId = this.configService.get<string>('NAVER_LOGIN_CLIENT_ID');
    const redirectUri = `${this.frontendUrl}/auth/oauth/callback?provider=naver`;

    if (!clientId) {
      throw new BadRequestException('NAVER_LOGIN_CLIENT_ID가 설정되지 않았습니다.');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });

    return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  }

  /**
   * 네이버 OAuth code를 access token으로 교환
   */
  async exchangeNaverCode(code: string, redirectUri: string, state: string): Promise<string> {
    const clientId = this.configService.get<string>('NAVER_LOGIN_CLIENT_ID');
    const clientSecret = this.configService.get<string>('NAVER_LOGIN_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new BadRequestException('NAVER_LOGIN_CLIENT_ID 또는 NAVER_LOGIN_CLIENT_SECRET이 설정되지 않았습니다.');
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        state: state || '',
      });

      const response = await axios.get(
        `https://nid.naver.com/oauth2.0/token?${params.toString()}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' } },
      );

      return response.data.access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `네이버 토큰 교환 실패: ${error.response?.data?.error_description || error.message}`,
        );
      }
      throw new BadRequestException('네이버 토큰 교환 중 오류가 발생했습니다.');
    }
  }

  /**
   * 네이버 access token으로 사용자 정보 조회
   */
  async getNaverUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const response = await axios.get('https://openapi.naver.com/v1/nid/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const res = response.data;
      if (res.resultcode !== '00' || !res.response) {
        throw new Error(res.message || '프로필 조회 실패');
      }

      const profile = res.response;
      return {
        providerUserId: profile.id?.toString() ?? '',
        email: profile.email,
        name: profile.name || profile.nickname,
        nickname: profile.nickname,
        profileImageUrl: profile.profile_image,
        phone: profile.mobile ? String(profile.mobile).replace(/-/g, '').trim() || undefined : undefined,
        gender: profile.gender,
        age: profile.age,
        birthday: profile.birthday,
        birthyear: profile.birthyear,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `네이버 사용자 정보 조회 실패: ${error.response?.data?.message || error.message}`,
        );
      }
      throw new BadRequestException('네이버 사용자 정보 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * CSRF 방지를 위한 state 생성
   */
  generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}


