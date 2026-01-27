# 환경 설정 완료 현황 및 체크리스트

## ✅ 완료된 항목

### 1. 개발 환경
- ✅ 노트북에서 Cursor로 개발 중
- ✅ Git 저장소 연결 및 커밋/푸시 설정 완료

### 2. 서버 인프라
- ✅ 서버PC에 VMware 설치
- ✅ 가상머신 4대 생성:
  - 웹서버1: `192.168.132.185` (webmaster 계정)
  - 웹서버2: `192.168.132.126` (webmaster 계정)
  - DB 서버: `192.168.132.81` (dbmaster 계정)
  - LB 서버: `192.168.132.147`
  - Jenkins 서버: `192.168.132.191`

### 3. CI/CD 파이프라인
- ✅ Jenkins 파이프라인 설정 완료
- ✅ Git Push → Jenkins 빌드 → 서버 배포 자동화
- ✅ 로컬 변경사항 자동 해결 기능 추가

### 4. 데이터베이스
- ✅ DB 서버에 `ohun` 데이터베이스 생성 완료
- ✅ TypeORM `synchronize: true`로 자동 스키마 생성
- ⚠️ 운영 환경에서는 `synchronize: false`로 변경 필요

### 5. 도메인 및 네트워크
- ✅ 도메인 `ohun.kr` 구매 및 Cloudflare 연결
- ✅ Cloudflare Tunnel 설정 (LB 서버)
- ✅ Nginx 라우팅 설정:
  - `/api/` → 백엔드(3000)
  - `/` → 프론트엔드(5173)
- ✅ 테스트 완료: `ohun.kr` 접속 시 로그인 화면 정상 표시

## ⚠️ 개선 필요 사항

### 1. 보안 설정

#### 1-1. PostgreSQL 전용 사용자 생성 (권장)
**현재 상태:** `postgres` 사용자 직접 사용 중  
**권장:** 전용 DB 사용자 생성

```bash
# DB 서버에서 실행
sudo -u postgres psql
CREATE USER ohun_admin WITH PASSWORD '강력한_비밀번호';
GRANT ALL PRIVILEGES ON DATABASE ohun TO ohun_admin;
\c ohun
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ohun_admin;
```

**웹서버 .env 수정:**
```env
DB_USERNAME=ohun_admin  # postgres 대신
DB_PASSWORD=강력한_비밀번호
```

#### 1-2. TypeORM synchronize 설정
**현재:** `synchronize: true` (개발용)  
**운영 환경:** `synchronize: false`로 변경 필요

**파일:** `server/src/app.module.ts`
```typescript
synchronize: process.env.NODE_ENV !== 'production', // 운영에서는 false
```

#### 1-3. CORS 설정 개선
**현재:** 개발 환경에서 모든 192.168.x.x 허용  
**운영 환경:** 특정 도메인만 허용

**파일:** `server/src/main.ts`
```typescript
// 운영 환경에서는 특정 도메인만 허용
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push('https://ohun.kr', 'https://www.ohun.kr');
}
```

### 2. 파일 업로드 설정 (미완료)

#### 2-1. 현재 상태
- ✅ `multer` 패키지 설치됨
- ✅ 클라이언트에서 프로필 이미지 업로드 기능 구현됨
- ❌ 서버에서 파일 업로드 처리 미구현
- ❌ 파일 저장 경로 설정 없음
- ❌ Nginx 정적 파일 서빙 설정 없음

#### 2-2. 필요한 작업

**A. 서버 파일 업로드 구현**

1. 파일 저장 디렉토리 생성 (웹서버)
```bash
# 웹서버에서
mkdir -p /home/webmaster/my-app/uploads/profile
mkdir -p /home/webmaster/my-app/uploads/groups
chmod 755 /home/webmaster/my-app/uploads
```

2. 서버 코드 수정
- `auth.controller.ts`에 파일 업로드 엔드포인트 추가
- `FileInterceptor` 사용하여 파일 받기
- 파일 저장 및 URL 반환

3. Nginx 정적 파일 서빙 설정 (LB 서버)
```nginx
# /etc/nginx/sites-available/default
location /uploads/ {
    alias /home/webmaster/my-app/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

**B. 대안: 클라우드 스토리지 사용**
- AWS S3, Cloudflare R2, 또는 다른 객체 스토리지 사용
- 서버 디스크 사용량 절약
- 확장성 향상

### 3. Redis 설정 확인

**현재:** DB 서버(192.168.132.81)에 Redis 설치 및 실행 확인 필요

```bash
# DB 서버에서
redis-cli ping
# 응답: PONG (정상)
```

### 4. 환경 변수 관리

**웹서버 .env 파일 확인:**
```bash
# 웹서버에서
cat /home/webmaster/my-app/server/.env
```

**필수 환경 변수:**
- DB 연결 정보
- JWT_SECRET
- OAuth 클라이언트 정보
- SMS API 키 (SMS 인증 사용 시)

## 📋 다음 단계 체크리스트

### 즉시 해야 할 것 (선택사항)
- [ ] PostgreSQL 전용 사용자 생성
- [ ] 파일 업로드 기능 구현 또는 클라우드 스토리지 연동
- [ ] 운영 환경 TypeORM synchronize: false 설정

### 기능 개발로 넘어가기 전 확인
- [x] 기본 인프라 설정 완료
- [x] CI/CD 파이프라인 작동 확인
- [x] 도메인 연결 및 접속 테스트 완료
- [ ] 파일 업로드 기능 (선택사항 - 나중에 구현 가능)

## 🚀 다음 단계

환경 설정이 대부분 완료되었으므로, 다음 기능 개발을 진행해도 됩니다:

1. **간편 로그인 (OAuth)**
   - 카카오/구글 로그인 API 연동 완료 여부 확인
   - 프론트엔드 OAuth 콜백 처리

2. **SMS 인증번호 발송**
   - NCP SMS 서비스 연동
   - 인증번호 생성 및 검증 로직

3. **앱 내부 기능**
   - 모임 생성/참가
   - 프로필 관리
   - 알림 기능

4. **파일 업로드** (필요 시)
   - 프로필 이미지 업로드
   - 모임 이미지 업로드

## 📝 참고 문서

- `docs/deployment-summary.md` - 배포 설정 요약
- `docs/jenkins-deploy.md` - Jenkins 배포 가이드
- `docs/server-account-security-guide.md` - 서버 계정 보안 가이드
- `docs/db-migration-guide.md` - DB 마이그레이션 가이드
