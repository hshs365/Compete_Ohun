import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { createClient } from 'redis';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // 배포 환경 기본값 설정 (환경변수가 없을 때만 적용)
  process.env.DB_HOST ||= '192.168.132.81';
  process.env.REDIS_HOST ||= '192.168.132.81';

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 정적 파일 서빙 설정 (업로드된 파일)
  // 환경변수 UPLOAD_DIR이 있으면 사용 (NFS 공유 스토리지 등)
  // 없으면 로컬 디렉토리 사용 (개발 환경)
  const uploadsPath = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });

  // Redis 세션 스토어 연결
  const redisHost = process.env.REDIS_HOST ?? '192.168.132.81';
  const redisPort = process.env.REDIS_PORT ?? '6379';
  const redisPassword = process.env.REDIS_PASSWORD ?? '';
  const redisUrl = redisPassword
    ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
    : `redis://${redisHost}:${redisPort}`;
  const redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on('error', (error) => {
    console.error('❌ Redis 연결 오류:', error);
  });

  try {
    await redisClient.connect();
    console.log(`✅ Redis 연결 완료 (${redisHost}:${redisPort})`);
  } catch (error) {
    console.error('❌ Redis 연결 실패:', error);
  }
  
  // CORS 설정 (프론트엔드와 통신)
  // localhost와 IP 주소 모두 허용
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.198.172:5173', // 현재 PC의 IP 주소
  ];
  
  // 환경 변수로 추가 origin 지정 가능
  if (process.env.FRONTEND_URL) {
    const envOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    allowedOrigins.push(...envOrigins);
  }
  
  app.enableCors({
    origin: (origin, callback) => {
      // origin이 없으면 (같은 origin 요청 등) 허용
      if (!origin) {
        return callback(null, true);
      }
      
      // 허용된 origin 목록에 있으면 허용
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // 개발 환경에서는 localhost나 192.168.x.x로 시작하는 origin 허용
      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (isDevelopment) {
        if (origin.startsWith('http://localhost:') || 
            origin.startsWith('http://127.0.0.1:') ||
            origin.match(/^http:\/\/192\.168\.\d+\.\d+:5173$/)) {
          return callback(null, true);
        }
      } else {
        // 운영 환경에서는 특정 도메인만 허용
        const productionOrigins = [
          'https://ohun.kr',
          'https://www.ohun.kr',
        ];
        if (productionOrigins.some(allowed => origin.startsWith(allowed))) {
          return callback(null, true);
        }
      }
      
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
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

  // Graceful shutdown 처리
  process.on('SIGTERM', async () => {
    console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
    await redisClient.quit().catch(() => undefined);
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT 신호를 받았습니다. 서버를 종료합니다...');
    await redisClient.quit().catch(() => undefined);
    await app.close();
    process.exit(0);
  });
}
bootstrap();
