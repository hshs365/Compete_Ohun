# 베타 버전 인증 가이드

베타에서는 **전화번호 기반 중복 가입 방지**와 **블랙리스트**를 우선 적용합니다. 본인인증(i-PIN, PASS 등)은 이후 단계에서 도입 예정이며, 현재 구조는 마이그레이션 시 데이터 손실 없이 확장 가능하게 설계되어 있습니다.

## 1. 전화번호 필수 + 중복 방지

- 회원가입 시 **전화번호 필수**
- 동일 전화번호로 중복 가입 불가 (활성 계정 기준)
- 블랙리스트에 등록된 전화번호는 가입 불가

## 2. SENS(SMS 인증)

네이버 클라우드 SENS를 사용한 SMS 인증을 지원합니다.

### 서버 설정 (.env)

```env
# 베타: SMS 인증 활성화 (true 시 실제 문자 발송)
SMS_VERIFICATION_ENABLED=true

# 네이버 클라우드 SENS (SMS)
NCP_ACCESS_KEY=발급받은_AccessKey
NCP_SECRET_KEY=발급받은_SecretKey
NCP_SMS_SERVICE_ID=SENS_서비스_ID
NCP_SMS_SENDER=01012345678
```

### 클라이언트 설정 (client/.env 또는 .env.local)

```env
VITE_SMS_VERIFICATION_ENABLED=true
```

### SENS 서비스 신청 절차

1. [네이버 클라우드 콘솔](https://console.ncloud.com) → Simple & Easy Notification Service
2. SMS 메뉴에서 **발신번호 등록** (사전 승인 필요)
3. **서비스 생성** 후 Service ID, Access Key, Secret Key 확인
4. 위 환경 변수에 설정

## 3. 블랙리스트 (관리자 전용)

전화번호 기반 블랙리스트. 등록된 번호로는 가입·재가입 불가.

### API (관리자 JWT 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/blacklist | 블랙리스트 목록 조회 |
| POST | /api/blacklist | 추가 (body: `{ phone, reason? }`) |
| DELETE | /api/blacklist | 제거 (body: `{ phone }`) |

## 4. 패널티 점수 시스템 (신고)

- **users.penaltyScore**: 신고 누적 시 증가 (기본 0)
- 매치 리뷰에서 "신고" 항목으로 참가자 선택 시 해당 사용자 패널티 +1
- **10점 이상** 시 새 매치 참가 불가
- 본인인증 도입 후에도 `penaltyScore`는 users 테이블에 유지되어 마이그레이션 가능

### 상수 (server/src/constants/penalty.ts)

- `PENALTY_THRESHOLD_FOR_MATCH_RESTRICTION`: 10
- `PENALTY_POINTS_PER_REPORT`: 1

## 5. 이후 단계 (본인인증)

- 현재: 전화번호 + (선택) SMS 인증
- 향후: 나이스평가정보, KG모빌리언스 등 본인인증 API 연동 시
  - `realNameVerified`, `phoneVerified` 플래그 활용
  - `penaltyScore`는 그대로 유지
