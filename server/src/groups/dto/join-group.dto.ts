import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

export class JoinGroupDto {
  /** 포지션 지정 매치일 때 선택한 포지션 코드 (예: GK, DF, MF, FW) */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  positionCode?: string;

  /** 포지션 지정 매치일 때 선택한 팀 ('red' | 'blue') */
  @IsOptional()
  @IsString()
  @IsIn(['red', 'blue'])
  team?: 'red' | 'blue';

  /** 슬롯 라벨 (예: LW, RW, CM). 없으면 포지션 내 기본 슬롯 */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  slotLabel?: string;
}
