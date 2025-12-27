# 다음 작업 단계 가이드

## 🎯 PC 재부팅 후 작업 재개 시

### 1. 카카오맵 API 키 설정 (선택사항, 권장)

**카카오맵 API 키가 있으면 더 정확한 주소 변환이 가능합니다.**

1. `client/.env.example` 파일을 `client/.env`로 복사
2. 카카오 개발자 콘솔에서 REST API 키 발급
3. `.env` 파일에 API 키 입력:
   ```env
   VITE_KAKAO_REST_API_KEY=your_actual_api_key_here
   ```
4. 클라이언트 재시작

**자세한 설정 방법**: `KAKAO-MAP-API-SETUP.md` 참고

**참고**: API 키가 없어도 OpenStreetMap API로 동작합니다 (정확도는 낮을 수 있음)

### 2. 환경 확인 및 실행
```powershell
# 서버 디렉토리로 이동
cd C:\Compete_Ohun\server

# 서버 실행
npm run start:dev

# 새 터미널에서 클라이언트 디렉토리로 이동
cd C:\Compete_Ohun\client

# 클라이언트 실행
npm run dev
```

### 2. 현재 상태 확인
- ✅ 모임 생성/조회/참가 기능 완료
- ✅ 주소 검색 및 지도 마커 기능 완료
- ✅ 준비물 선택 기능 완료

### 3. 즉시 테스트 가능한 기능
1. 로그인/회원가입
2. 새 모임 만들기
   - 주소 찾기 버튼 테스트
   - 지도에서 마커 드래그 테스트
   - 주소 직접 입력 테스트
3. 모임 목록 조회
4. 모임 참가/탈퇴

---

## 🔧 다음 구현할 기능 (우선순위)

### 1. 모임 수정/삭제 UI
**현재 상태**: 백엔드 API는 완료, 프론트엔드 UI 필요

**구현 내용**:
- GroupDetail에 수정/삭제 버튼 추가 (생성자만 표시)
- 수정 모달 생성 (CreateGroupModal 재사용 가능)
- 삭제 확인 다이얼로그

**파일**:
- `client/src/components/GroupDetail.tsx` 수정
- `client/src/components/EditGroupModal.tsx` 생성 (또는 CreateGroupModal 재사용)

---

### 2. 참가자 목록 조회
**현재 상태**: GroupParticipant 엔티티는 있으나 조회 API 없음

**구현 내용**:
- 백엔드: `GET /api/groups/:id/participants` API 추가
- 프론트엔드: GroupDetail에 참가자 목록 표시

**파일**:
- `server/src/groups/groups.controller.ts` 수정
- `server/src/groups/groups.service.ts` 수정
- `client/src/components/GroupDetail.tsx` 수정

---

### 3. 내가 참가한 모임 목록
**현재 상태**: 전체 모임 목록만 있음

**구현 내용**:
- 백엔드: `GET /api/groups/my-participations` API 추가
- 프론트엔드: "내 모임" 페이지 또는 필터 추가

**파일**:
- `server/src/groups/groups.controller.ts` 수정
- `server/src/groups/groups.service.ts` 수정
- `client/src/components/MyGroupsPage.tsx` 생성 (또는 기존 페이지 수정)

---

### 4. 모임 일정 관리
**현재 상태**: FullCalendar 설치됨, 연동 필요

**구현 내용**:
- 모임별 일정 등록/수정/삭제
- 내 일정 페이지에 참가한 모임 일정 표시
- 일정 알림 기능 (선택)

**파일**:
- `server/src/groups/entities/group-schedule.entity.ts` 생성
- `client/src/components/MySchedulePage.tsx` 수정

---

## 🐛 확인 필요 사항

### 1. 카카오맵 API 키 없을 때 동작
- OpenStreetMap API로 자동 대체되는지 확인
- 한국 주소 정확도 테스트

### 2. 모바일 반응형
- 주소 찾기 버튼 모바일에서 동작 확인
- 지도 드래그 모바일에서 동작 확인

### 3. 성능 최적화
- 모임 목록 페이지네이션 확인
- 지도 마커 렌더링 최적화

---

## 📝 코드 스니펫 참고

### 주소 → 좌표 변환 (현재 구현)
```typescript
// 카카오맵 API 우선, 실패 시 OpenStreetMap API 사용
const handleAddressToCoordinates = async (address: string) => {
  // 1순위: 카카오맵 API
  // 2순위: OpenStreetMap Nominatim API
}
```

### 좌표 → 주소 변환 (현재 구현)
```typescript
// 마커 드래그 시 역지오코딩
const handleMarkerDragEnd = async (e: L.DragEndEvent) => {
  // 카카오맵 API 또는 OpenStreetMap API 사용
}
```

---

## 🔗 관련 파일 위치

### 주요 컴포넌트
- `client/src/components/CreateGroupModal.tsx` - 모임 생성
- `client/src/components/GroupList.tsx` - 모임 목록
- `client/src/components/GroupDetail.tsx` - 모임 상세
- `client/src/components/MapPanel.tsx` - 지도

### 주요 서비스
- `server/src/groups/groups.service.ts` - 모임 비즈니스 로직
- `server/src/groups/groups.controller.ts` - 모임 API 엔드포인트

### 상수 파일
- `client/src/constants/sports.ts` - 운동 종목
- `client/src/constants/equipment.ts` - 운동별 준비물

---

## 💡 개발 팁

### API 테스트
```bash
# 모임 목록 조회
GET http://localhost:3000/api/groups

# 모임 생성
POST http://localhost:3000/api/groups
Authorization: Bearer {token}

# 모임 참가
POST http://localhost:3000/api/groups/1/join
Authorization: Bearer {token}
```

### 데이터베이스 확인
```sql
-- 모임 목록 확인
SELECT * FROM groups;

-- 참가자 확인
SELECT * FROM group_participants;
```

---

**작업 재개 시 이 문서와 PROJECT-PROGRESS.md를 함께 참고하세요!**


