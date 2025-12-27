# Ohun 프로젝트 개발 진행 상황

## 📅 최종 업데이트: 2024년

## 🎯 프로젝트 개요

**Ohun**은 운동 모임 플랫폼으로, 가볍게 만나서 다양한 지역에서 다양한 사람들과 어울릴 수 있는 서비스입니다.
- **핵심 철학**: 동호회처럼 가입하는 형식이 아닌 "참가" 형식으로 부담 없이 참여 가능
- **목적**: 책임감과 압박감 없이 가볍게 운동 모임에 참여할 수 있는 환경 제공

---

## ✅ 완료된 기능

### 1. 인증 시스템 (완료)
- ✅ 일반 회원가입/로그인
- ✅ 소셜 로그인 (카카오, 구글)
- ✅ 프로필 완성
- ✅ JWT 인증
- ✅ 닉네임 중복 체크
- ✅ 자동 로그인 (Remember Me)

### 2. 모임(그룹) 기능 (완료)

#### 백엔드
- ✅ Group 엔티티 생성
  - 모임 이름, 위치, 좌표, 카테고리, 설명, 모임 시간, 연락처
  - 준비물 배열 (equipment)
  - 생성자 정보, 참가자 수
- ✅ GroupParticipant 엔티티 생성 (참가자 관리)
- ✅ Groups 모듈/서비스/컨트롤러 생성
- ✅ CRUD API 구현
  - `POST /api/groups` - 모임 생성
  - `GET /api/groups` - 모임 목록 조회 (카테고리/검색 필터)
  - `GET /api/groups/:id` - 모임 상세 조회
  - `PATCH /api/groups/:id` - 모임 수정 (생성자만)
  - `DELETE /api/groups/:id` - 모임 삭제 (생성자만, 비활성화 처리)
- ✅ 참가 API 구현
  - `POST /api/groups/:id/join` - 모임 참가
  - `POST /api/groups/:id/leave` - 모임 탈퇴

#### 프론트엔드
- ✅ 새 모임 만들기 모달
  - 운동별 준비물 선택 기능
  - 주소 찾기 버튼 (다음 주소 검색 API)
  - 지도에서 마커 드래그로 위치 선택
  - 주소 직접 입력 시 자동 좌표 변환 및 마커 이동
- ✅ 모임 목록 (API 연동)
  - 실시간 목록 조회
  - 카테고리 필터링
  - 검색 기능
- ✅ 모임 상세보기
  - 모임 정보, 준비물 표시
  - 참가/탈퇴 버튼
  - 참가자 수 실시간 업데이트
- ✅ 지도 기능
  - 모든 모임 마커 표시
  - 선택된 모임 강조 표시
  - 마커 클릭 시 모임 정보 팝업

### 3. 준비물 기능 (완료)
- ✅ 운동별 준비물 상수 정의 (`equipment.ts`)
- ✅ 운동 종목 선택 시 해당 운동의 준비물 목록 자동 표시
- ✅ 다중 선택 가능
- ✅ 모임 상세보기에 준비물 표시

### 4. 위치 검색 기능 (완료)
- ✅ 다음 주소 검색 API 연동 (무료, API 키 불필요)
- ✅ 카카오맵 API 연동 (지오코딩/역지오코딩)
  - 주소 → 좌표 변환
  - 좌표 → 주소 변환
- ✅ OpenStreetMap Nominatim API 대체 옵션 (무료)
- ✅ 주소 직접 입력 시 자동 좌표 변환 및 마커 이동
- ✅ 지도에서 마커 드래그 시 주소 자동 입력

---

## 📋 데이터베이스 구조

### 엔티티
1. **User** - 사용자 정보
2. **SocialAccount** - 소셜 계정 연동
3. **Group** - 모임 정보
4. **GroupParticipant** - 모임 참가자

### 주요 테이블
- `users` - 사용자
- `social_accounts` - 소셜 계정
- `groups` - 모임
- `group_participants` - 모임 참가자

---

## 🔧 기술 스택

### 프론트엔드
- React 19
- Vite 7
- TypeScript
- Tailwind CSS 4
- React Router DOM 7
- React Leaflet (지도)
- FullCalendar (일정 관리)
- Axios

### 백엔드
- NestJS 11
- TypeScript
- TypeORM 0.3
- PostgreSQL
- JWT 인증
- Passport

### 외부 API
- 다음 주소 검색 API (무료)
- 카카오맵 API (무료 제공량: 일 10만 건)
- OpenStreetMap Nominatim API (무료 대체 옵션)

---

## 💰 카카오맵 API 요금 정보

### 무료 제공량
- **로컬 API** (주소 검색, 좌표 변환): 일 최대 10만 건
- **지도 API**: 일 최대 30만 건
- **통합 쿼터**: 월 최대 300만 건

### 현재 사용량 예상
- 일일 수십~수백 건 수준
- **무료 제공량으로 충분**

### 대체 옵션
- OpenStreetMap Nominatim API (무료, API 키 불필요)
- 코드에 이미 대체 로직 포함

---

## 🚀 실행 방법

### 1. 서버 실행
```powershell
cd server
npm run start:dev
```
- 포트: 3000
- 데이터베이스: PostgreSQL (자동 스키마 생성)

### 2. 클라이언트 실행
```powershell
cd client
npm run dev
```
- 포트: 5173

### 3. 환경 변수 설정

**server/.env**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=ohun

JWT_SECRET=your-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d

PORT=3000
FRONTEND_URL=http://localhost:5173

# 카카오 OAuth (선택)
KAKAO_CLIENT_ID=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# 구글 OAuth (선택)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**client/.env** (선택)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_KAKAO_REST_API_KEY=your_kakao_rest_api_key
```

---

## 📝 주요 파일 구조

### 백엔드
```
server/src/
├── auth/              # 인증 모듈
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/        # JWT 가드
│   ├── strategies/    # Passport 전략
│   └── services/      # OAuth 서비스
├── users/             # 사용자 모듈
│   ├── users.service.ts
│   └── entities/
├── groups/            # 모임 모듈
│   ├── groups.controller.ts
│   ├── groups.service.ts
│   ├── entities/
│   │   ├── group.entity.ts
│   │   └── group-participant.entity.ts
│   └── dto/
└── app.module.ts
```

### 프론트엔드
```
client/src/
├── components/
│   ├── CreateGroupModal.tsx    # 새 모임 만들기
│   ├── GroupList.tsx            # 모임 목록
│   ├── GroupDetail.tsx          # 모임 상세
│   ├── MapPanel.tsx             # 지도
│   └── ...
├── constants/
│   ├── sports.ts                # 운동 종목
│   └── equipment.ts             # 운동별 준비물
├── contexts/
│   └── AuthContext.tsx           # 인증 컨텍스트
└── utils/
    └── api.ts                    # API 유틸리티
```

---

## 🎨 주요 기능 상세

### 1. 새 모임 만들기
- **위치 입력 방법**:
  1. 주소 직접 입력 → 자동 좌표 변환 및 마커 이동
  2. "주소 찾기" 버튼 → 다음 주소 검색 팝업
  3. 지도에서 마커 드래그 → 주소 자동 입력
- **준비물 선택**: 운동 종목 선택 시 해당 운동의 준비물 목록 표시
- **API 연동**: 모임 생성 후 목록 자동 새로고침

### 2. 모임 참가
- "모임 참가하기" 버튼 클릭
- 중복 참가 방지
- 참가자 수 실시간 업데이트
- 생성자는 탈퇴 불가

### 3. 지도 기능
- 모든 모임을 마커로 표시
- 선택된 모임은 더 진하게 표시
- 마커 클릭 시 모임 정보 팝업

---

## 🔄 다음 단계 (TODO)

### 우선순위 높음
- [ ] 모임 수정 기능 프론트엔드 구현
- [ ] 모임 삭제 기능 프론트엔드 구현
- [ ] 참가자 목록 조회 기능
- [ ] 내가 참가한 모임 목록 페이지

### 우선순위 중간
- [ ] 모임 일정 관리 (FullCalendar 연동)
- [ ] 즐겨찾기 기능
- [ ] 모임 공유 기능
- [ ] 알림 기능

### 우선순위 낮음
- [ ] 시설 예약 기능
- [ ] 운동 용품 관리
- [ ] 이벤트 매칭
- [ ] 명예의 전당
- [ ] 공지사항

---

## 🐛 알려진 이슈

### 해결됨
- ✅ JWT 가드 Public 엔드포인트 처리
- ✅ TypeScript 타입 에러 (Request import)
- ✅ 지도 마커 이동 기능

### 확인 필요
- [ ] 카카오맵 API 키 없을 때 OpenStreetMap API 동작 확인
- [ ] 모바일 반응형 UI 테스트

---

## 📚 참고 문서

### 카카오맵 API
- [카카오 디벨로퍼스](https://developers.kakao.com/)
- 무료 제공량: 일 10만 건 (로컬 API)

### 다음 주소 검색 API
- [다음 주소 검색 API](https://postcode.map.daum.net/guide)
- 무료, API 키 불필요

### OpenStreetMap Nominatim
- [Nominatim API](https://nominatim.org/)
- 무료, API 키 불필요
- 한국 주소 정확도는 카카오맵보다 낮을 수 있음

---

## 💡 개발 팁

### 서버 재시작 시
1. 데이터베이스 연결 확인
2. TypeORM synchronize: true (개발 환경)
3. 환경 변수 확인

### 클라이언트 재시작 시
1. 환경 변수 확인 (VITE_*)
2. API 베이스 URL 확인
3. 카카오맵 API 키 확인 (선택)

### 디버깅
- 서버: `npm run start:dev` (자동 재시작)
- 클라이언트: 브라우저 개발자 도구
- API 테스트: Postman 또는 브라우저 개발자 도구 Network 탭

---

## 📞 연락처 및 리소스

- 프로젝트 위치: `C:\Compete_Ohun`
- Git 저장소: `git@github.com:hshs365/ohun.git`

---

**마지막 업데이트**: 2024년
**다음 작업 시작 시 이 문서를 먼저 확인하세요!**




