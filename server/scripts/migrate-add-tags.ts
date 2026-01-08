import { DataSource, IsNull } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { SocialAccount } from '../src/social-accounts/entities/social-account.entity';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// .env 파일 로드
dotenv.config({ path: resolve(__dirname, '../.env') });

async function migrateTags() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ohun',
    entities: [User, SocialAccount],
  });

  try {
    await dataSource.initialize();
    console.log('데이터베이스 연결 성공');

    const userRepository = dataSource.getRepository(User);

    // tag가 null인 모든 사용자 조회
    const usersWithoutTag = await userRepository.find({
      where: { tag: IsNull() },
      order: { id: 'ASC' },
    });

    console.log(`태그가 없는 사용자 수: ${usersWithoutTag.length}`);

    // 각 사용자에게 태그 부여
    for (const user of usersWithoutTag) {
      if (!user.nickname) {
        console.log(`사용자 ID ${user.id}: 닉네임이 없어 태그를 부여할 수 없습니다.`);
        continue;
      }

      // 같은 닉네임을 가진 사용자 수 확인 (태그가 있는 사용자만)
      const count = await userRepository
        .createQueryBuilder('user')
        .where('user.nickname = :nickname', { nickname: user.nickname })
        .andWhere('user.tag IS NOT NULL')
        .getCount();

      // 다음 태그 번호 생성
      const tagNumber = count + 1;
      const tag = `#KR${tagNumber}`;

      // 태그가 중복되지 않는지 확인
      const existingUser = await userRepository.findOne({
        where: { nickname: user.nickname, tag },
      });

      if (existingUser) {
        // 중복되면 다음 번호 사용
        const newTagNumber = count + 2;
        user.tag = `#KR${newTagNumber}`;
      } else {
        user.tag = tag;
      }

      await userRepository.save(user);
      console.log(`사용자 ID ${user.id} (${user.nickname}): 태그 ${user.tag} 부여 완료`);
    }

    console.log('마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 오류:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

migrateTags()
  .then(() => {
    console.log('스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  });
