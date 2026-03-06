import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import { HttpExceptionLoggerFilter } from './common/filters/http-exception-logger.filter';

/** Redis 사용 여부: true면 연결, false/비어있으면 개발 환경에서 미사용 */
function isRedisEnabled(): boolean {
  const enabled = process.env.REDIS_ENABLED;
  if (enabled === 'true') return true;
  if (enabled === 'false') return false;
  // REDIS_ENABLED가 없으면: 개발 환경은 미사용, 운영은 REDIS_HOST 있으면 사용
  const isProduction = process.env.NODE_ENV === 'production';
  const hasRedisHost = !!process.env.REDIS_HOST;
  return isProduction && hasRedisHost;
}

async function bootstrap() {
  // 배포(운영) 환경에서만 서버용 기본값 적용 (로컬 .env가 우선되도록)
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    process.env.DB_HOST ||= '192.168.132.81';
    process.env.REDIS_HOST ||= '192.168.132.81';
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // WebSocket (Socket.io) 어댑터 — 포지션 실시간 반영용
  app.useWebSocketAdapter(new IoAdapter(app));

  // 5xx 등 모든 예외 로그 (배포 환경 500 원인 파악용)
  app.useGlobalFilters(new HttpExceptionLoggerFilter());

  // 정적 파일 서빙 설정 (업로드된 파일)
  // UPLOAD_DIR 미설정 시: process.cwd()/uploads (예: ~/my-app/server/uploads)
  const uploadsPath = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, { prefix: '/uploads' });
  Logger.log(`📁 업로드 경로: ${uploadsPath}`, 'Bootstrap');

  // Redis: 개발 환경에서는 기본 비활성, 운영 또는 REDIS_ENABLED=true 시에만 연결
  let redisClient: RedisClientType | null = null;
  if (isRedisEnabled()) {
    const redisHost = process.env.REDIS_HOST ?? '192.168.132.81';
    const redisPort = process.env.REDIS_PORT ?? '6379';
    const redisPassword = process.env.REDIS_PASSWORD ?? '';
    const redisUrl = redisPassword
      ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
      : `redis://${redisHost}:${redisPort}`;
    redisClient = createClient({ url: redisUrl }) as RedisClientType;

    redisClient.on('error', (error) => {
      console.error('❌ Redis 연결 오류:', error);
    });

    try {
      await redisClient.connect();
      console.log(`✅ Redis 연결 완료 (${redisHost}:${redisPort})`);
    } catch (error) {
      console.error('❌ Redis 연결 실패:', error);
      redisClient = null;
    }
  } else {
    console.log('ℹ️ Redis 비활성 (개발 환경 또는 REDIS_ENABLED=false)');
  }
  
  // CORS 설정 (프론트엔드와 통신)
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.198.172:5173',
  ];
  if (process.env.FRONTEND_URL) {
    const envOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    allowedOrigins.push(...envOrigins);
  }
  const productionOriginPatterns = [
    'https://allcourtplay.com',
    'https://www.allcourtplay.com',
    'http://allcourtplay.com',
    'http://www.allcourtplay.com',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (productionOriginPatterns.some(allowed => origin.startsWith(allowed))) return callback(null, true);
      if (origin.includes('allcourtplay.com')) return callback(null, true);

      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (isDevelopment) {
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') ||
            origin.match(/^http:\/\/192\.168\.\d+\.\d+:5173$/)) {
          return callback(null, true);
        }
      }

      console.warn('[CORS] 차단된 origin:', origin);
      // 거부 시 Error를 넘기면 500이 되므로, false만 넘겨 브라우저에서 CORS 실패로 처리
      callback(null, false);
    },
    credentials: true,
  });

  // 전역 ValidationPipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Graceful shutdown 설정
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  const host = process.env.HOST ?? '0.0.0.0';
  
  // 포트가 이미 사용 중인지 확인하고 재시도
  let server;
  try {
    server = await app.listen(port, host);
    console.log(`🚀 서버가 http://${host}:${port}에서 실행 중입니다.`);
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ 포트 ${port}가 이미 사용 중입니다.`);
      console.error('다음 명령어로 포트를 사용하는 프로세스를 종료하세요:');
      console.error(`  netstat -ano | findstr :${port}`);
      console.error(`  taskkill /PID <PID> /F`);
      process.exit(1);
    } else {
      throw error;
    }
  }

  // Graceful shutdown 처리 (한 번만 실행되도록 플래그 사용 → TypeORM pool 중복 종료 방지)
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`${signal} 신호를 받았습니다. 서버를 종료합니다...`);
    if (redisClient) await redisClient.quit().catch(() => undefined);
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
bootstrap();
