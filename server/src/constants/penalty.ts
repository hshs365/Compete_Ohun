/**
 * 패널티(신고) 점수 시스템.
 * 본인인증 도입 후에도 penaltyScore는 users 테이블에 유지되어 데이터 손실 없이 마이그레이션 가능.
 */

/** 매치 참여 제한 임계값. 이 값을 초과하면 새 매치 참가 불가 */
export const PENALTY_THRESHOLD_FOR_MATCH_RESTRICTION = 10;

/** 신고 1건당 증가하는 패널티 점수 */
export const PENALTY_POINTS_PER_REPORT = 1;

/** 신뢰도 점수 임계값. 이 미만이면 용병 신청·참가 제한 (Penalty Guard) */
export const MANNER_SCORE_THRESHOLD = 20;
