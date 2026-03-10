import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsLatitude,
  IsLongitude,
  MaxLength,
  MinLength,
  IsBoolean,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// GameSettingsDto를 먼저 선언
export class GameSettingsDto {
  @IsString()
  @IsIn(['team', 'individual'])
  @IsOptional()
  gameType?: 'team' | 'individual';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  positions?: string[]; // 모집할 포지션 목록

  @IsNumber()
  @IsOptional()
  minPlayersPerTeam?: number; // 팀당 최소 인원

  @IsBoolean()
  @IsOptional()
  balanceByExperience?: boolean; // 선수 출신 여부 고려

  @IsBoolean()
  @IsOptional()
  balanceByRank?: boolean; // 랭커 여부 고려

  /** 모임장이 참가할 포지션 (GK, DF, MF, FW). 포지션 지정 매치(축구 등)에서만 사용 */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  creatorPositionCode?: string;

  /** 모임장이 참가할 슬롯 라벨 (LW, RW, LB 등). 없으면 해당 행 첫 슬롯에 표시 */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  creatorSlotLabel?: string;

  /** 모임장이 참가할 팀 ('red' | 'blue') */
  @IsOptional()
  @IsString()
  @IsIn(['red', 'blue'])
  creatorTeam?: 'red' | 'blue';

  /** 모임장 전술판 좌표 X (0–100). 좌표 기반 배치 시 사용 */
  @IsOptional()
  @IsNumber()
  creatorPositionX?: number;

  /** 모임장 전술판 좌표 Y (0–100). 좌표 기반 배치 시 사용 */
  @IsOptional()
  @IsNumber()
  creatorPositionY?: number;

  /** 랭크 매치 포지션 지정 시 참가 가능 최소 랭크 (S,A,B,C,D,E,F). 미설정 시 제한 없음 */
  @IsOptional()
  @IsIn(['S', 'A', 'B', 'C', 'D', 'E', 'F'])
  minRankGrade?: 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location: string;

  @IsNumber()
  @IsLatitude()
  latitude: number;

  @IsNumber()
  @IsLongitude()
  longitude: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  meetingTime?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contact?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  equipment?: string[]; // 준비물 목록

  @IsNumber()
  @IsOptional()
  maxParticipants?: number; // 최대 참여자 수

  @IsNumber()
  @IsOptional()
  minParticipants?: number; // 최소 참여자 수

  @IsOptional()
  meetingDateTime?: Date | string; // 실제 모임 일시

  @IsOptional()
  @IsString()
  meetingEndTime?: string; // 종료 시간 (HH:mm). 가예약 생성용

  @IsOptional()
  @IsString()
  meetingEndDate?: string; // 종료 일자 (YYYY-MM-DD). 야간 매치 시

  @IsOptional()
  @IsBoolean()
  hasFee?: boolean; // 참가비 여부

  @IsOptional()
  @IsNumber()
  feeAmount?: number; // 참가비 금액 (포인트 단위)

  @IsOptional()
  @IsNumber()
  facilityId?: number; // 단일 시설 시 (레거시). 가계약 시에는 provisionalFacilityIds 사용

  /** 가계약: 1·2·3순위 시설 ID 배열. 인원 마감 시 1→2→3순위 순으로 빈 슬롯 있는 시설 확정 */
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  provisionalFacilityIds?: number[]; // [1순위 시설ID, 2순위 시설ID, 3순위 시설ID] (1~3개)

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female'])
  genderRestriction?: 'male' | 'female'; // 성별 제한 (남자만/여자만)

  // 게임 설정 (선택사항)
  @IsOptional()
  @ValidateNested()
  @Type(() => GameSettingsDto)
  gameSettings?: GameSettingsDto;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'rank', 'event'])
  type?: 'normal' | 'rank' | 'event'; // 매치 유형 (기본값: 'normal')

  /** 종목별 확장 데이터 (배드민턴: 급수/종목, 축구: 포지션 등). 종목에 따라 필수값 검증 */
  @IsOptional()
  sportSpecificData?: Record<string, unknown>;

  /** 용병 구하기 글 여부. true이면 해당 종목 용병 알림 수신 유저에게 알림 발송 */
  @IsOptional()
  @IsBoolean()
  isMercenaryRecruit?: boolean;

  /** 노쇼 방지 예치금 (용병 참가 시 부과, 경기 종료 후 환급. 0 또는 미설정 시 예치금 없음) */
  @IsOptional()
  @IsNumber()
  depositAmount?: number;
}





