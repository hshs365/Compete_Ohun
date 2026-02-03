# Redis 환경별 설정 가이드

## 요약

- **개발 PC(노트북)**: Redis 없이 실행 가능. 별도 설정 없이 `npm run start:dev`만 하면 됩니다.
- **서버**: `.env`에 `REDIS_HOST` 등 설정해 두면 운영 시에만 Redis에 연결합니다.

## 동작 방식

| 환경 | REDIS_ENABLED | REDIS_HOST | 결과 |
|------|----------------|------------|------|
| 개발 (NODE_ENV≠production) | 비어있음 | 없음 | Redis **미연결** (로그: `ℹ️ Redis 비활성`) |
| 개발 | `false` | 있음 | Redis **미연결** |
| 개발 | `true` | 있음 | Redis **연결 시도** (로컬/원격 Redis 필요) |
| 운영 (NODE_ENV=production) | 비어있음 | 있음 | Redis **연결** |
| 운영 | `true` | 있음 | Redis **연결** |
| 운영 | `false` | 있음 | Redis **미연결** |

- **REDIS_ENABLED**  
  - `true`: 무조건 Redis 연결 시도  
  - `false`: 무조건 Redis 미사용  
  - 비어있음:  
    - 개발 → Redis 미사용  
    - 운영 + REDIS_HOST 있음 → Redis 사용  

## 개발 PC(노트북)에서

1. **Redis 없이 실행 (권장)**  
   - `server/.env`에 **REDIS_ENABLED**, **REDIS_HOST** 둘 다 넣지 않거나,  
     `REDIS_ENABLED=false` 로 두면 Redis 연결을 하지 않습니다.  
   - `NODE_ENV`를 설정하지 않으면 개발로 간주되어, 위 조건에서 Redis가 비활성입니다.

2. **예시 .env (최소)**  
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres123
   DB_NAME=ohun
   JWT_SECRET=dev-secret-change-in-production
   NODE_ENV=development
   # REDIS_ENABLED, REDIS_HOST 비우면 Redis 미사용
   ```

3. **로컬에서 Redis까지 쓰고 싶을 때**  
   - Redis를 로컬에 설치한 뒤  
   - `REDIS_ENABLED=true`  
   - `REDIS_HOST=127.0.0.1` (또는 `localhost`)  
   로 설정하면 됩니다.

## 서버에서

- `NODE_ENV=production` 이고, `.env`에 `REDIS_HOST`(및 필요 시 `REDIS_PORT`, `REDIS_PASSWORD`)가 있으면 Redis에 연결합니다.
- 서버용 기본값은 코드에서 `REDIS_HOST=192.168.132.81` 등으로 두었으므로, 서버 `.env`에 Redis 관련 값을 넣어두면 그대로 사용됩니다.

## 정리

- **매번 설정 바꾸지 않아도 됨**:  
  - 노트북은 Redis 설정 없이(또는 `REDIS_ENABLED=false`) 두고,  
  - 서버는 서버용 `.env`만 유지하면 됩니다.
- 같은 코드베이스로 개발(Redis 없음) / 서버(Redis 있음) 모두 대응합니다.
