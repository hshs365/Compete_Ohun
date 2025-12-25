import { IsString, IsEnum } from 'class-validator';
import { SocialProvider } from '../../social-accounts/entities/social-account.entity';

export class SocialCallbackDto {
  @IsString()
  code: string;

  @IsString()
  state: string;

  @IsEnum(SocialProvider)
  provider: SocialProvider;
}


