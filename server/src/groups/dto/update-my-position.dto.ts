import { IsString, MaxLength, IsIn, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateMyPositionDto {
  @IsString()
  @MaxLength(10)
  positionCode: string;

  @IsString()
  @IsIn(['red', 'blue'])
  team: 'red' | 'blue';

  @IsOptional()
  @IsString()
  @MaxLength(10)
  slotLabel?: string | null;

  /** 전술판 좌표 X (0–100). 좌표 기반 배치 시 사용 */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  positionX?: number;

  /** 전술판 좌표 Y (0–100). 좌표 기반 배치 시 사용 */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  positionY?: number;
}
