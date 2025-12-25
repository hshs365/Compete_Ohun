# 데이터베이스 연결 문제 해결

## 현재 문제

`.env` 파일에 `DB_NAME=ohun_dev`로 설정되어 있는데, 실제로는 `ohun` 데이터베이스를 사용하려고 합니다.

## 해결 방법

### 옵션 1: .env 파일 수정 (권장)

`server/.env` 파일을 열어서:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=ohun
```

`DB_NAME`을 `ohun_dev`에서 `ohun`으로 변경하세요.

### 옵션 2: ohun 데이터베이스 생성

`ohun` 데이터베이스가 없다면 생성하세요:

```bash
psql -U postgres
```

접속 후:

```sql
CREATE DATABASE ohun;
```

### 옵션 3: ohun_dev 사용

현재 `.env`에 `ohun_dev`가 설정되어 있다면, 그대로 사용할 수도 있습니다.

## .env 파일 수정 후

서버를 재시작하세요:

```bash
cd server
npm run start:dev
```


