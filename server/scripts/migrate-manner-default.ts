/**
 * 기존 사용자 mannerScore 0 -> 80 기본값 마이그레이션
 * 매너카드 시스템: 가입 시 80점, 매너칭찬 +1, 신고 5회당 -10
 * 실행: npx ts-node -r tsconfig-paths/register scripts/migrate-manner-default.ts
 */
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

async function migrateMannerDefault() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ohun',
    entities: [User],
  });

  try {
    await dataSource.initialize();
    console.log('데이터베이스 연결 성공');

    const result = await dataSource
      .createQueryBuilder()
      .update(User)
      .set({ mannerScore: 80 })
      .where('mannerScore = 0')
      .execute();

    console.log(`mannerScore 0 -> 80 기본값 적용: ${result.affected ?? 0}명`);
  } finally {
    await dataSource.destroy();
  }
}

migrateMannerDefault().catch((e) => {
  console.error(e);
  process.exit(1);
});
