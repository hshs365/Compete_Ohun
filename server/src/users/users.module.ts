import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { SocialAccount } from '../social-accounts/entities/social-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, SocialAccount])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}


