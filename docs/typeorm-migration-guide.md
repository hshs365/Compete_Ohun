# TypeORM 마이그레이션 가이드

## 📋 현재 상태

- **현재 설정:** `synchronize: true` (개발용)
- **위험성:** 운영 환경에서 데이터 손실 가능
- **마이그레이션:** 아직 설정되지 않음

## ⚠️ synchronize: true의 동작 방식

### 개발 환경에서 (현재)
```typescript
synchronize: true  // Entity 변경 시 자동으로 DB 스키마 변경
```

**동작:**
1. Entity 파일 변경 감지
2. 서버 시작 시 자동으로 ALTER TABLE 실행
3. **기존 데이터는 보존됨** (일반적으로)
4. **하지만 위험한 변경은 데이터 손실 가능**

### 위험한 시나리오

#### 1. 컬럼 삭제
```typescript
// Entity에서 컬럼 제거
@Column()
oldField: string;  // 이 줄 삭제
```
**결과:** DB에서 컬럼 삭제 → **데이터 손실!**

#### 2. 컬럼 타입 변경
```typescript
// varchar(50) → integer로 변경
@Column({ type: 'varchar', length: 50 })
nickname: string;  // → number로 변경
```
**결과:** 타입 변환 실패 가능 → **데이터 손실 또는 에러!**

#### 3. NOT NULL 제약 추가
```typescript
// nullable → NOT NULL로 변경
@Column({ nullable: true })
email: string;  // → nullable: false
```
**결과:** 기존 NULL 데이터가 있으면 → **에러 발생!**

#### 4. 테이블 정규화 (새 테이블 생성)
```typescript
// 새 Entity 추가
@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;
  
  @ManyToOne(() => User)
  user: User;
}
```
**결과:** 새 테이블 생성 → **기존 데이터는 안전**

## ✅ 안전한 방법: TypeORM 마이그레이션

### 1. 마이그레이션 설정

**파일:** `server/src/app.module.ts`
```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [/* ... */],
    synchronize: process.env.NODE_ENV !== 'production', // 운영에서는 false
    migrations: ['dist/migrations/*.js'], // 마이그레이션 파일 경로
    migrationsRun: false, // 자동 실행 안 함 (수동 실행)
    migrationsTableName: 'migrations', // 마이그레이션 히스토리 테이블
  }),
  inject: [ConfigService],
}),
```

### 2. 마이그레이션 파일 생성

**package.json에 스크립트 추가:**
```json
{
  "scripts": {
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/data-source.ts",
    "migration:create": "typeorm-ts-node-commonjs migration:create",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d src/data-source.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/data-source.ts",
    "migration:show": "typeorm-ts-node-commonjs migration:show -d src/data-source.ts"
  }
}
```

**DataSource 파일 생성:** `server/src/data-source.ts`
```typescript
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST') || 'localhost',
  port: configService.get<number>('DB_PORT') || 5432,
  username: configService.get<string>('DB_USERNAME') || 'postgres',
  password: configService.get<string>('DB_PASSWORD') || 'postgres',
  database: configService.get<string>('DB_NAME') || 'ohun',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
```

### 3. 마이그레이션 사용 예시

#### 예시 1: 컬럼 추가 (안전)
```typescript
// 1. Entity 수정
@Entity('users')
export class User {
  // ... 기존 필드들
  
  @Column({ nullable: true }) // nullable로 시작 (안전)
  newField: string;
}

// 2. 마이그레이션 생성
npm run migration:generate src/migrations/AddNewFieldToUser

// 3. 생성된 마이그레이션 파일 확인
// src/migrations/1234567890-AddNewFieldToUser.ts
```

**생성된 마이그레이션:**
```typescript
export class AddNewFieldToUser1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "newField" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "newField"
    `);
  }
}
```

#### 예시 2: 컬럼 타입 변경 (데이터 변환 필요)
```typescript
// 마이그레이션 파일 직접 작성
export class ChangeNicknameType1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 임시 컬럼 생성
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "nickname_new" integer
    `);
    
    // 2. 데이터 변환 (예: 문자열 길이를 숫자로)
    await queryRunner.query(`
      UPDATE "users" 
      SET "nickname_new" = LENGTH("nickname")
    `);
    
    // 3. 기존 컬럼 삭제
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "nickname"
    `);
    
    // 4. 새 컬럼 이름 변경
    await queryRunner.query(`
      ALTER TABLE "users" 
      RENAME COLUMN "nickname_new" TO "nickname"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백 로직
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "nickname_old" character varying
    `);
    // ... 데이터 복원
  }
}
```

#### 예시 3: 테이블 정규화
```typescript
// 새 Entity 생성
@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  userId: number;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
  
  @Column()
  bio: string;
}

// 마이그레이션 생성
export class CreateUserProfileTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 새 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL,
        "bio" character varying NOT NULL,
        CONSTRAINT "FK_user_profiles_user" 
          FOREIGN KEY ("userId") REFERENCES "users"("id")
      )
    `);
    
    // 2. 기존 users 테이블에서 데이터 마이그레이션 (필요시)
    await queryRunner.query(`
      INSERT INTO "user_profiles" ("userId", "bio")
      SELECT "id", COALESCE("bio", '') FROM "users"
      WHERE "bio" IS NOT NULL
    `);
    
    // 3. users 테이블에서 bio 컬럼 제거 (선택사항)
    // await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백: 테이블 삭제
    await queryRunner.query(`DROP TABLE "user_profiles"`);
  }
}
```

### 4. 마이그레이션 실행

#### 개발 환경
```bash
# 마이그레이션 실행
npm run migration:run

# 마이그레이션 상태 확인
npm run migration:show

# 마이그레이션 롤백 (마지막 마이그레이션 취소)
npm run migration:revert
```

#### 운영 환경 (서버)
```bash
# 서버에서
cd /home/webmaster/my-app/server
npm run build
npm run migration:run
```

**Jenkins 파이프라인에 추가:**
```groovy
stage('Run Migrations') {
  steps {
    sh '''
      cd "$BACKEND_DIR"
      npm run build
      npm run migration:run
    '''
  }
}
```

## 🔄 운영 환경 마이그레이션 전략

### 1. 개발 → 운영 마이그레이션 프로세스

```
1. 로컬에서 Entity 수정
   ↓
2. 마이그레이션 파일 생성 및 테스트
   ↓
3. Git 커밋 및 푸시
   ↓
4. Jenkins 빌드 (자동 또는 수동)
   ↓
5. 마이그레이션 실행 (자동 또는 수동)
   ↓
6. 애플리케이션 재시작
```

### 2. 데이터 백업 (중요!)

**마이그레이션 전 필수:**
```bash
# DB 서버에서 백업
pg_dump -h 192.168.132.81 -U ohun_admin -d ohun -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# 또는 전체 백업
pg_dumpall -h 192.168.132.81 -U postgres > full_backup_$(date +%Y%m%d).sql
```

### 3. 안전한 마이그레이션 체크리스트

- [ ] **백업 생성** (마이그레이션 전 필수)
- [ ] **스테이징 환경에서 테스트** (가능한 경우)
- [ ] **마이그레이션 파일 검토** (생성된 SQL 확인)
- [ ] **롤백 계획 수립** (down 메서드 구현)
- [ ] **데이터 변환 로직 검증** (타입 변경 시)
- [ ] **다운타임 계획** (필요한 경우)

## 📊 synchronize vs 마이그레이션 비교

| 항목 | synchronize: true | 마이그레이션 |
|------|------------------|-------------|
| **편의성** | ⭐⭐⭐⭐⭐ 자동 | ⭐⭐⭐ 수동 |
| **안전성** | ⭐⭐ 위험 | ⭐⭐⭐⭐⭐ 안전 |
| **데이터 보존** | ⚠️ 위험한 변경 시 손실 | ✅ 안전 |
| **롤백** | ❌ 불가능 | ✅ 가능 |
| **버전 관리** | ❌ 불가능 | ✅ 가능 |
| **운영 환경** | ❌ 사용 금지 | ✅ 권장 |

## 🎯 권장 사항

### 개발 환경
```typescript
synchronize: true  // 빠른 개발을 위해 사용 가능
```

### 운영 환경
```typescript
synchronize: false  // 반드시 false
migrations: ['dist/migrations/*.js']  // 마이그레이션 사용
```

### 하이브리드 접근
```typescript
synchronize: process.env.NODE_ENV !== 'production',
migrations: process.env.NODE_ENV === 'production' 
  ? ['dist/migrations/*.js'] 
  : [],
```

## 💡 실무 팁

1. **작은 변경은 여러 마이그레이션으로 분리**
   - 하나의 큰 마이그레이션보다 여러 작은 마이그레이션이 안전

2. **NOT NULL 추가는 단계적으로**
   ```sql
   -- 1단계: nullable로 추가
   ALTER TABLE users ADD COLUMN new_field VARCHAR;
   
   -- 2단계: 데이터 채우기
   UPDATE users SET new_field = 'default' WHERE new_field IS NULL;
   
   -- 3단계: NOT NULL 제약 추가
   ALTER TABLE users ALTER COLUMN new_field SET NOT NULL;
   ```

3. **인덱스는 별도 마이그레이션으로**
   - 테이블 변경과 인덱스 생성을 분리하면 롤백이 쉬움

4. **외래 키는 나중에 추가**
   - 테이블 생성 → 데이터 입력 → 외래 키 추가

## 📝 요약

**현재 상태:**
- ✅ 개발 환경: `synchronize: true` 사용 가능
- ⚠️ 운영 환경: 마이그레이션으로 전환 필요

**기존 데이터 보존:**
- `synchronize: true`: 위험한 변경 시 데이터 손실 가능
- **마이그레이션**: 데이터 변환 로직으로 안전하게 보존

**다음 단계:**
1. 마이그레이션 설정 추가
2. 운영 환경에서 `synchronize: false` 설정
3. Entity 변경 시 마이그레이션 파일 생성 및 실행
