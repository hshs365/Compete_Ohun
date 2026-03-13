import { IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class InviteTeamDto {
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1명 이상 선택해주세요.' })
  @ArrayMaxSize(20, { message: '한 번에 최대 20명까지 초대할 수 있습니다.' })
  @Type(() => Number)
  userIds: number[];
}
