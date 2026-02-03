import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MinLength(1, { message: '팀명을 입력해주세요.' })
  @MaxLength(50)
  teamName: string;

  @IsString()
  @MinLength(1, { message: '종목을 선택해주세요.' })
  sport: string;

  @IsString()
  @MinLength(1, { message: '팀 소재지를 선택해주세요.' })
  region: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  coach?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  assistantCoach?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contact?: string;

  @IsOptional()
  @IsString()
  inviteeIds?: string; // JSON array "[1,2,3]"
}
