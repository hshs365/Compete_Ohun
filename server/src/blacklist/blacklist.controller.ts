import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { BlacklistService } from './blacklist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('api/blacklist')
@UseGuards(JwtAuthGuard)
export class BlacklistController {
  constructor(private blacklistService: BlacklistService) {}

  private ensureAdmin(user: User): void {
    if (!user?.isAdmin) {
      throw new ForbiddenException('관리자만 접근할 수 있습니다.');
    }
  }

  @Get()
  async list(@CurrentUser() user: User) {
    this.ensureAdmin(user);
    return this.blacklistService.findAll();
  }

  @Post()
  async add(
    @CurrentUser() user: User,
    @Body('phone') phone: string,
    @Body('reason') reason?: string,
  ) {
    this.ensureAdmin(user);
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException('전화번호를 입력해 주세요.');
    }
    return this.blacklistService.add(phone, reason ?? null, user.id);
  }

  @Delete()
  async remove(@CurrentUser() user: User, @Body('phone') phone: string) {
    this.ensureAdmin(user);
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException('전화번호를 입력해 주세요.');
    }
    await this.blacklistService.remove(phone);
    return { success: true, message: '블랙리스트에서 제거되었습니다.' };
  }
}
