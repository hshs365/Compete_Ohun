import { IsEnum } from 'class-validator';
import { SocialProvider } from '../../social-accounts/entities/social-account.entity';

export class OAuthAuthUrlDto {
  @IsEnum(SocialProvider)
  provider: SocialProvider;
}


