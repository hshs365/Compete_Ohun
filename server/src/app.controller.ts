import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): { message: string; status: string; api: string } {
    return {
      message: 'Allcourtplay API Server',
      status: 'running',
      api: '/api'
    };
  }

  /** 주소 → 좌표 지오코딩 (브라우저 CORS 회피용 프록시) */
  @Get('api/geocode')
  async geocode(@Query('query') query: string): Promise<{ lat: number; lng: number } | null> {
    if (!query || typeof query !== 'string' || !query.trim()) return null;
    const clientId = this.configService.get<string>('NAVER_MAP_CLIENT_ID');
    const clientSecret = this.configService.get<string>('NAVER_MAP_CLIENT_SECRET');
    if (!clientId || !clientSecret) return null;
    try {
      const res = await fetch(
        `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query.trim())}`,
        {
          headers: {
            'X-NCP-APIGW-API-KEY-ID': clientId,
            'X-NCP-APIGW-API-KEY': clientSecret,
          },
        }
      );
      const data = await res.json();
      const addrs = data?.addresses;
      if (!Array.isArray(addrs) || addrs.length === 0) return null;
      const first = addrs[0];
      const lat = parseFloat(first.y);
      const lng = parseFloat(first.x);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    } catch {
      return null;
    }
  }
}
