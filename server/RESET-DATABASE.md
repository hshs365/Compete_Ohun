# 데이터베이스 초기화 가이드

## 문제 상황
TypeORM 동기화 중 인덱스 충돌 에러가 발생했습니다:
- `IDX_9a8a82462cab47c73d25f49261` 인덱스가 이미 존재함
- PostgreSQL 에러 코드: `42P07`

## 해결 방법

### 방법 1: 문제가 되는 인덱스만 삭제 (권장)

1. PostgreSQL에 접속:
```bash
psql -U postgres -d ohun
```

2. 다음 SQL 실행:
```sql
DROP INDEX IF EXISTS "IDX_9a8a82462cab47c73d25f49261";
```

3. 서버 재시작

### 방법 2: phone_verifications 테이블만 삭제 (데이터 손실 있음)

```sql
DROP TABLE IF EXISTS phone_verifications CASCADE;
```

### 방법 3: 전체 데이터베이스 초기화 (모든 데이터 손실!)

⚠️ **주의: 이 방법은 모든 데이터를 삭제합니다!**

```sql
-- PostgreSQL 접속
psql -U postgres

-- 데이터베이스 삭제 및 재생성
DROP DATABASE IF EXISTS ohun;
CREATE DATABASE ohun;
```

그 다음 서버를 재시작하면 TypeORM이 자동으로 모든 테이블을 다시 생성합니다.

## 추천 방법

**개발 환경**이라면 방법 3 (전체 초기화)을 권장합니다.
**운영 환경**이라면 방법 1 (인덱스만 삭제)을 사용하세요.
