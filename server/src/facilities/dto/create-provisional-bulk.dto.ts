import { IsArray, IsNumber, IsString, Matches, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreateProvisionalBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsNumber({}, { each: true })
  facilityIds: number[];

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '예약 날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  reservationDate: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: '시작 시간은 HH:MM 형식이어야 합니다.' })
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: '종료 시간은 HH:MM 형식이어야 합니다.' })
  endTime: string;
}
