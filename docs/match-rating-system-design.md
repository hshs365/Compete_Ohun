# 매칭 완료 후 상호 평가 시스템 설계

## 개요
매치가 종료된 후 참가자 간 상호 평가를 통해 신뢰도 점수(mannerScore)를 갱신하고, 장기적으로 품질 높은 매칭 생태계를 구축합니다.

## 현재 구조
- **GroupEvaluation**: 모임장 → 참가자 평가 (단방향)
- **MatchReview**: 참가자 간 리뷰 (항목별 1명 선택, 예: "가장 기술이 좋은 선수")
- **mannerScore**: users 테이블, 가입 시 80점, 매너칭찬 +1, 신고 5회당 -10, 노쇼 1회당 -41

## 상호 평가 로직 설계

### 1. 평가 시점
- 매치 `meetingDateTime`이 지난 후 + `isCompleted` 또는 수동 종료 시
- 참가자에게 "리뷰 작성" 알림

### 2. 평가 대상
- **기존 GroupEvaluation 확장**: 모임장↔참가자 상호 평가
  - 모임장: 참가자 각각에 대해 (rating 0-5, wasPunctual, wasCooperative, wasSkilled, comment)
  - 참가자: 모임장에 대해 동일한 형태
- **MatchReview 유지**: "가장 기술 좋은 선수" 등 항목별 선수 선택 (종목별)

### 3. mannerScore 반영 공식 (제안)
- **매너칭찬**: GroupEvaluation에서 rating >= 4 이고 wasCooperative=true → +1
- **신고**: 기존 로직 유지 (5회당 -10)
- **노쇼**: 기존 로직 유지 (1회당 -41)
- **상호 평가 평균**: (평가받은 평균 rating)이 2.0 미만이면 추가 패널티 검토

### 4. 구현 단계
1. **Phase 1**: GroupEvaluation에 evaluatee → evaluator 역방향 평가 허용 (참가자가 모임장 평가)
2. **Phase 2**: 매치 종료 시 "상호 평가" 모달/페이지 진입 유도
3. **Phase 3**: 평가 완료 시 mannerScore 재계산 (user-score.service 확장)

### 5. DB 스키마 (변경 없음)
- GroupEvaluation: evaluatorId, evaluateeId, rating, comment, wasPunctual, wasCooperative, wasSkilled
- 동일 테이블로 evaluator=참가자, evaluatee=모임장 추가하면 상호 평가 구현 가능
