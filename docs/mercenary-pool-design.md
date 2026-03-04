# 용병 풀(Mercenary Pool) 설계

## 개요
사용자가 자신을 용병 구직자로 등록하고, 구인자가 용병을 검색할 때 해당 정보를 활용하는 구조입니다.

## 데이터 모델 (User 엔티티 확장)

| 필드 | 타입 | 설명 |
|------|------|------|
| mercenaryActivityStatus | 'active' \| 'paused' | 활동 상태. **'active'일 때만 구인자 검색에 노출** |
| mercenaryAvailability | JSON Array | 활동 가능 요일·시간 [{ dayOfWeek: 0, timeSlots: [{ start: "09:00", end: "12:00" }] }] |

기존 필드 활용:
- `interestedSports`: 주력 종목
- `ohunRanks`: 종목별 실력 등급 (급수)
- `sportPositions`: 선호 포지션/역할
- `residenceSido`, `residenceSigungu`: 활동 지역

## API

### 용병 프로필 업데이트
`PATCH /api/auth/me/mercenary-profile`
- mercenaryActivityStatus, mercenaryAvailability, interestedSports, ohunRanks, sportPositions 수정 가능

### 구인자용 용병 검색 API (추가 구현 예정)
`GET /api/mercenaries/search?category=축구&grade=A&region=대전&dayOfWeek=6&timeStart=09:00`

**필터링 로직:**
1. `mercenaryActivityStatus === 'active'` 인 사용자만 포함
2. category: interestedSports에 해당 종목 포함
3. grade: ohunRanks[category]가 일치
4. region: residenceSido/residenceSigungu 기반
5. dayOfWeek, timeStart: mercenaryAvailability와 교차하는 시간대

## 구인자 검색 시 노출 조건
- `mercenaryActivityStatus === 'active'` 인 사용자만 검색 결과에 포함됩니다.
- '잠시 멈춤' 상태는 검색 대상에서 제외됩니다.
