import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

@Controller('api/notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Public()
  @Get()
  findAll() {
    return this.noticesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateNoticeDto, @CurrentUser() user: User) {
    return this.noticesService.create(dto, user);
  }
}
