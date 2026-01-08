import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// .env 파일 로드
config({ path: path.join(__dirname, '../.env') });

async function clearDatabase() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'compete_ohun',
  });

  try {
    await dataSource.initialize();
    console.log('✓ 데이터베이스 연결 성공');

    // 외래 키 제약조건 비활성화 (삭제 순서 문제 방지)
    await dataSource.query('SET session_replication_role = replica;');

    // 테이블 목록 (외래 키 참조 순서 고려하여 역순으로 삭제)
    const tables = [
      'group_participants',  // groups를 참조
      'notifications',        // users, groups를 참조
      'phone_verifications',  // users를 참조
      'social_accounts',      // users를 참조
      'groups',               // users를 참조
      'facilities',           // 독립적
      'users',                // 다른 테이블들이 참조
    ];

    console.log('\n🗑️  데이터 삭제 시작...\n');

    for (const table of tables) {
      try {
        const result = await dataSource.query(`DELETE FROM ${table};`);
        // PostgreSQL DELETE 결과는 배열 형태: [결과, rowCount]
        const rowCount = Array.isArray(result) && result.length > 0 ? (result[0]?.rowCount || result[1] || 0) : 0;
        console.log(`✓ ${table}: ${rowCount}개 레코드 삭제`);
      } catch (error) {
        console.error(`✗ ${table} 삭제 실패:`, error instanceof Error ? error.message : String(error));
      }
    }

    // 시퀀스 리셋 (AUTO_INCREMENT 초기화)
    console.log('\n🔄 시퀀스 리셋 중...\n');
    const sequences = [
      'users_id_seq',
      'social_accounts_id_seq',
      'groups_id_seq',
      'group_participants_id_seq',
      'facilities_id_seq',
      'notifications_id_seq',
      'phone_verifications_id_seq',
    ];

    for (const sequence of sequences) {
      try {
        await dataSource.query(`SELECT setval('${sequence}', 1, false);`);
        console.log(`✓ ${sequence} 리셋 완료`);
      } catch (error) {
        // 시퀀스가 없을 수 있으므로 에러는 무시
        console.log(`⚠ ${sequence} 리셋 건너뜀 (시퀀스가 없거나 이미 초기화됨)`);
      }
    }

    // 외래 키 제약조건 다시 활성화
    await dataSource.query('SET session_replication_role = DEFAULT;');

    console.log('\n✅ 데이터베이스 초기화 완료!');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

clearDatabase();
