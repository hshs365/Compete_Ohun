# 환경 설정 가이드 (Dev/Prod)

## 📋 개요

환경변수로 개발(Development)과 운영(Production)을 구분합니다. 현재는 **Dev + Prod 2단계**만 사용하고, Staging은 필요 시 추가합니다.

---

## 🔧 환경변수 설정

### 개발 환경 (로컬)

**server/.env:**
```env
NODE_ENV=development
SMS_VERIFICATION_ENABLED=false
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=ohun
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**client/.env:**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SMS_VERIFICATION_ENABLED=false
```

### 운영 환경 (서버)

**server/.env (웹서버):**
```env
NODE_ENV=production
SMS_VERIFICATION_ENABLED=true
DB_HOST=192.168.132.81
DB_PORT=5432
DB_USERNAME=ohun_admin
DB_PASSWORD=강력한_비밀번호
DB_NAME=ohun
PORT=3000
FRONTEND_URL=https://ohun.kr,https://www.ohun.kr
UPLOAD_DIR=/mnt/shared/uploads

# SMS (NCP SENS)
NCP_ACCESS_KEY=실제_액세스_키
NCP_SECRET_KEY=실제_시크릿_키
NCP_SMS_SERVICE_ID=실제_서비스_ID
NCP_SMS_SENDER=01012345678
```

클라이언트는 빌드 시점에 `VITE_SMS_VERIFICATION_ENABLED` 등이 결정됩니다.

---

## 🚀 Jenkins 배포

- "파라미터와 함께 빌드" → **ENVIRONMENT**: `development` / `production` 선택
- 선택에 따라 `NODE_ENV`, `SMS_VERIFICATION_ENABLED` 등이 자동 설정됩니다.

---

## 📝 환경별 동작

| 항목 | 개발 | 운영 |
|------|------|------|
| **NODE_ENV** | `development` | `production` |
| **SMS 인증** | 비활성화 | 활성화 |
| **CORS** | 192.168.x.x 허용 | ohun.kr 등 지정 도메인만 |
| **회원가입** | SMS 없이 가능 | SMS 인증 필수 |

---

## ✅ 체크리스트 및 개선 사항

### 인프라 (참고)
- 웹서버: 192.168.132.185, 192.168.132.126
- DB 서버: 192.168.132.81
- LB: 192.168.132.147, Jenkins: 192.168.132.191

### 권장 보안 설정
- DB 전용 사용자 생성 후 `DB_USERNAME`/`DB_PASSWORD` 사용 (예: `ohun_admin`)
- 운영 환경: TypeORM `synchronize: false` (코드에서 `NODE_ENV === 'production'`일 때 false 처리)

### 참고 문서
- `deployment-summary.md` — 배포 요약
- `jenkins-deploy.md` — Jenkins 배포
- `db-server-connection-guide.md` — DB 서버 접속
