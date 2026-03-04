import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: '메시지 내용을 입력해 주세요.' })
  @MaxLength(1000, { message: '메시지는 1000자 이내로 입력해 주세요.' })
  content: string;
}
