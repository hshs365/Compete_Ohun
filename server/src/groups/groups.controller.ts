import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupQueryDto } from './dto/group-query.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import type { Request } from 'express';

@Controller('api/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createGroupDto: CreateGroupDto, @CurrentUser() user: User) {
    return this.groupsService.create(createGroupDto, user.id);
  }

  @Get()
  findAll(@Query() queryDto: GroupQueryDto) {
    return this.groupsService.findAll(queryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-groups')
  async findMyGroups(@CurrentUser() user: User) {
    return this.groupsService.findMyGroups(user.id);
  }

  /** 내가 참가한 모임 (다른 사람이 만든 모임에 참가한 목록) */
  @UseGuards(JwtAuthGuard)
  @Get('my-participations')
  async findMyParticipations(@CurrentUser() user: User) {
    return this.groupsService.findMyParticipations(user.id);
  }

  /** 내가 생성한 모임 중 완료된 것만 (활동 기록·집계용) */
  @UseGuards(JwtAuthGuard)
  @Get('my-creations')
  async findMyCreations(@CurrentUser() user: User) {
    return this.groupsService.findMyCreationsCompleted(user.id);
  }

  @Public()
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    // 선택적으로 사용자 정보 가져오기 (인증된 경우에만)
    // JWT 가드가 Public이어도 토큰이 있으면 req.user를 설정하도록 수정 필요
    // 일단 토큰이 없어도 동작하도록 함
    const user = (req as any).user as User | undefined;
    return this.groupsService.findOne(id, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  async joinGroup(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() body?: JoinGroupDto,
  ) {
    try {
      return await this.groupsService.joinGroup(id, user.id, body?.positionCode, body?.team);
    } catch (error) {
      console.error('joinGroup 컨트롤러 에러:', {
        groupId: id,
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invite')
  @HttpCode(HttpStatus.OK)
  async inviteUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    // 모임장만 다른 사용자를 초대할 수 있음
    const group = await this.groupsService.findOne(id, user.id);
    if (group.creatorId !== user.id) {
      throw new BadRequestException('모임장만 다른 사용자를 초대할 수 있습니다.');
    }
    
    // 초대 대상 사용자가 자기 자신이 아닌지 확인
    if (userId === user.id) {
      throw new BadRequestException('자기 자신을 초대할 수 없습니다.');
    }

    // 초대 (자동 참가)
    return await this.groupsService.joinGroup(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  async leaveGroup(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.groupsService.leaveGroup(id, user.id);
    return { success: true, message: '모임에서 나갔습니다.' };
  }

  /** 찜 토글. 반환: { favorited: boolean } */
  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.groupsService.toggleFavorite(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGroupDto: UpdateGroupDto,
    @CurrentUser() user: User,
  ) {
    return this.groupsService.update(id, updateGroupDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.groupsService.remove(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  closeGroup(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.groupsService.closeGroup(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  reopenGroup(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.groupsService.reopenGroup(id, user.id);
  }

  /** 심판 신청 */
  @UseGuards(JwtAuthGuard)
  @Post(':id/referee-apply')
  @HttpCode(HttpStatus.OK)
  async applyReferee(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.groupsService.applyReferee(id, user.id);
  }

  /** 심판 신청 취소 */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/referee-apply')
  @HttpCode(HttpStatus.OK)
  async cancelReferee(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.groupsService.cancelReferee(id, user.id);
  }
}

