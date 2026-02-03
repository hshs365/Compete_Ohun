# Ohun 미구현 기능 목록

앱에 미구현된 기능을 정리한 문서입니다. 하나씩 구현할 때 참고하세요.

---

## 우선순위 높음 (핵심 플로우)

| # | 기능 | 위치 | 설명 |
|---|------|------|------|
| ~~1~~ | ~~**내가 참가한/생성한 모임 목록**~~ | MyInfoPage, 백엔드 | ✅ 완료: `GET /api/groups/my-participations`, `GET /api/groups/my-creations` API 추가, MyInfo 활동 기록·목록 연동, `/?group=id`로 상세 열기 |
| 2 | **모임 수정** | GroupDetail, 백엔드 | 이미 `PATCH /api/groups/:id` 있음 → 프론트에서 수정 폼/모달만 구현 |
| 3 | **모임 삭제** | GroupDetail | 이미 `DELETE /api/groups/:id` 있음 → 삭제 버튼 + 확인 후 API 호출 |
| 4 | **참가자 목록 조회** | GroupDetail | 상세 API에 participants 포함 여부 확인 후, 없으면 백엔드에 필드 추가 |

---

## 우선순위 중간 (사용자 경험)

| # | 기능 | 위치 | 설명 |
|---|------|------|------|
| 5 | **즐겨찾기(찜)** | FavoritesPage, 백엔드 | 찜하기/찜 해제 API → FavoritesPage에서 목록 조회·제거 연동 (현재 TODO: 즐겨찾기 제거 API) |
| 6 | **전화번호 수정** | MyInfoPage | 전화번호 저장 API 호출 (현재 TODO: 전화번호 저장 로직) |
| 7 | **비밀번호 변경** | MyInfoPage | 비밀번호 변경 모달 또는 전용 페이지 + 백엔드 `PUT /api/auth/change-password` |
| 8 | **마케팅 동의 업데이트** | MyInfoPage | 마케팅 수신 동의 API (현재 TODO: 마케팅 동의 업데이트 API) |
| 9 | **소셜 계정 연결 해제** | MyInfoPage | 소셜 연동 해제 API (현재 TODO) |
| 10 | **문의하기 전송** | ContactPage | 문의 폼 제출 시 백엔드 API 또는 이메일 전송 연동 |

---

## 우선순위 중간 (페이지별)

| # | 기능 | 위치 | 설명 |
|---|------|------|------|
| 11 | **시설 예약** | FacilityReservationPage | 시설 클릭 시 예약 페이지/모달 (현재 TODO: 예약 페이지로 이동 또는 예약 모달) |
| 12 | **이벤트매치 참가/생성** | EventMatchPage | 이벤트 참가 API, 이벤트 생성 모달 (현재 TODO) |
| 13 | **스포츠용품 장바구니** | SportsEquipmentPage | 장바구니 추가 API (현재 TODO) |
| 14 | **내 일정 / meetingTime 파싱** | MyInfoPage, MySchedulePage | 내 모임 일정 표시, meetingTime 파싱 로직 (TODO: meetingTime 파싱) |
| 15 | **찜한 매치** | MyInfoPage | 찜한 매치 API 구현 후 MyInfo에서 탭/목록 활성화 (TODO: 찜한 매치 API 구현 후 활성화) |

---

## 백엔드 TODO

| # | 기능 | 파일 | 설명 |
|---|------|------|------|
| A | 사업자등록번호 조회/검증 | auth.service.ts | 실제 사업자 API 연동 (현재 더미/로컬 검증) |
| B | 랭커 판단 로직 | groups.service.ts | 랭킹 시스템 연동 후 랭커 여부 판단 |
| C | 팀 정보 사용자별 조회 | teams.service.ts | DB 연동 시 사용자별 팀 정보 조회로 교체 |
| D | 사용자별 모임 조회 API | (신규) | 스포츠 통계 등에서 사용 (SportsStatisticsModal TODO) |

---

## 추천 구현 순서 (한 번에 하나씩)

1. **모임 수정/삭제 (프론트)** – API 있음, UI만 추가하면 됨.
2. **내가 참가한/생성한 모임 API + MyInfo 연동** – 내 활동 보기 핵심.
3. **즐겨찾기 API + Favorites 연동** – 찜하기/찜 해제/목록.
4. **전화번호 수정, 비밀번호 변경** – 내정보 보완.
5. **문의하기 전송** – ContactPage 백엔드/이메일 연동.
6. **시설 예약 플로우** – FacilityReservation 예약 모달/페이지.
7. **이벤트매치 참가·생성** – EventMatchPage 연동.
8. **사업자번호 API** – 외부 API 키 필요 시 나중에 연동.

---

## 다음 단계

- **지금 바로 시작할 기능 하나**를 정하면, 그 기능만 골라서 API 설계 → 백엔드 구현 → 프론트 연동 순으로 단계별로 같이 구현할 수 있습니다.
- 예: “먼저 **모임 수정/삭제**부터 할게요” 또는 “**내가 참가한 모임 목록**부터 할게요”라고 정해 주시면, 그 기능부터 구체적으로 짚어 드리겠습니다.
