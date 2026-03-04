# 중복 예약 방지 설계안

> 타 예약 플랫폼(네이버 예약 등)과의 실시간 API 연동이 불가능한 환경에서, 사장님들의 관리 피로도를 줄이기 위한 중복 예약 최소화 기술·기획 설계

---

## 1. 문제 정의

- **올코트플레이** 시설 예약과 **외부 플랫폼**(네이버 예약, 전화 예약, 현장 예약 등)이 공존
- 실시간 API 연동이 없어 **동일 시간대 이중 예약** 발생 가능
- 사장님은 여러 채널을 수동으로 확인·관리해야 함 → 관리 부담 증가

---

## 2. 기술적 로직

### 2.1. 예약 승인제 (Approval-based Reservation)

| 구분 | 즉시 확정 | 승인제 |
|------|----------|--------|
| **플로우** | 결제/신청 즉시 확정 | 신청 → 사장님 검토 → 승인/거절 |
| **장점** | 사용자 편의 높음 | 외부 예약 반영 시간 확보, 충돌 사전 방지 |
| **권장** | 올코트플레이 단일 채널 시설 | 외부 채널 병행 시설 |

**구현 방향**

- `ReservationStatus`: `PENDING`(대기) → `CONFIRMED`(승인) / `CANCELLED`(거절)
- 시설별 설정: `requiresApproval: boolean` (기본값 `false`)
- 사장님 대시보드: "승인 대기" 목록 + 한 번에 승인/거절

### 2.2. iCal 캘린더 동기화 (권장)

**원리**: 사장님이 구글/네이버 캘린더에 예약을 두고, 올코트플레이가 **읽기 전용 iCal URL**로 가져와 블록 처리

```
[올코트플레이] → iCal 피드 구독 (읽기)
                 ↓
[사장님 캘린더] ← 네이버 예약, 전화 예약, 현장 예약 등 수동 등록
```

**구현 포인트**

1. 시설 엔티티에 `icalFeedUrl` (nullable) 추가
2. 예약 생성 시: iCal 피드에서 해당 시간대 이벤트 있는지 확인
3. **폴링/캐시**: 5~15분 간격으로 iCal 파싱 결과 캐시 (과도한 요청 방지)
4. **블록 표시**: iCal 이벤트가 있는 슬롯은 "예약 불가"로 표시 (선택 시 경고)

**제약**

- iCal이 제공되지 않는 플랫폼은 사장님이 구글 캘린더에 수동 등록 필요
- 실시간성이 떨어지므로 **승인제**와 병행 사용 권장

### 2.3. 간편 블록(수동 차단) 기능

**목적**: iCal 없이도 사장님이 특정 시간대를 직접 "예약 불가"로 지정

**데이터**

```
facility_block_slots
- facility_id
- block_date (YYYY-MM-DD)
- start_time, end_time
- reason (선택): "네이버 예약", "단체 예약", "시설 점검" 등
- created_at
```

**UI**

- 사장님 캘린더/예약 화면에서 "블록 추가" 버튼
- 날짜·시간대 선택 → 저장
- 블록된 구간은 예약 불가로 표시, 일반 예약과 동일하게 중복 체크

### 2.4. 예약 시 중복 검증 (현재 + 강화)

**현재**

- `createReservation` 시 `PENDING`, `CONFIRMED`, `PROVISIONAL` 상태만 대상으로 시간 겹침 검사

**강화 사항**

1. **블록 슬롯**: `facility_block_slots`와 겹치면 예약 거부
2. **iCal**: 캐시된 iCal 이벤트와 겹치면 경고 또는 거부 (설정에 따라)
3. **낙관적 락**: 동시 요청 시 DB 레벨 유니크 제약 또는 `SELECT FOR UPDATE`로 재검증

---

## 3. 기획적 로직

### 3.1. 채널 안내 및 정책

- 시설 등록/수정 시: "다른 예약 채널(네이버, 전화 등)을 사용하시나요?" 질문
- **예** 선택 시:
  - 기본값으로 **승인제** 권장
  - iCal 연동 또는 블록 기능 사용 안내
- **아니오** 선택 시: 기존 즉시 확정 유지

### 3.2. 예약 슬롯 표시 방식

| 표시 | 의미 |
|------|------|
| **예약 가능** | 올코트플레이·블록·iCal 모두 비어 있음 |
| **예약됨** | 올코트플레이 예약 존재 |
| **외부 예약** | iCal 또는 블록으로 차단 |
| **승인 대기** | PENDING, 사장님 승인 전 |

### 3.3. 사장님 알림

- 새 예약 신청 시: "승인 대기" 알림
- 승인 대기 건이 일정 시간(예: 24시간) 미처리 시 알림

---

## 4. 구현 우선순위

| 순위 | 기능 | 예상 공수 | 효과 |
|------|------|----------|------|
| 1 | **예약 승인제** (시설별 옵션) | 중 | 외부 예약 반영 시간 확보 |
| 2 | **간편 블록** (날짜·시간 수동 차단) | 중 | iCal 없이도 빠른 반영 |
| 3 | **iCal 동기화** | 상 | 자동 동기화, 관리 부담 감소 |
| 4 | **채널 안내 / 정책 UI** | 하 | 사용 패턴에 맞는 설정 유도 |

---

## 5. DB 스키마 (추가 예시)

```sql
-- 시설별 예약 정책
ALTER TABLE facilities ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN ical_feed_url TEXT;

-- 수동 블록 슬롯
CREATE TABLE facility_block_slots (
  id SERIAL PRIMARY KEY,
  facility_id INT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_block_facility_date ON facility_block_slots(facility_id, block_date);
```

---

## 6. 참고: 올코트플레이 현재 구조

- `ReservationStatus`: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`, `PROVISIONAL`
- `createReservation`: 시간 겹침 검사 수행 (`reservationDate`, `startTime`, `endTime`)
- `getFacilityIdsWithOccupiedSlot`: 가용 시설 조회 시 점유된 시설 ID 반환
