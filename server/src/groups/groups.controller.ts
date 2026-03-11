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
import { UpdateMyPositionDto } from './dto/update-my-position.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import type { Request } from 'express';
import { GroupsGateway } from './groups.gateway';
import { QrVerificationService } from './qr-verification.service';

@Controller('api/groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupsGateway: GroupsGateway,
    private readonly qrVerificationService: QrVerificationService,
  ) {}

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

  /** 내 일정용: 생성한 매치 + 참가한 매치(용병 포함) 중 아직 종료되지 않은 목록 */
  @UseGuards(JwtAuthGuard)
  @Get('my-schedule')
  async findMySchedule(@CurrentUser() user: User) {
    return this.groupsService.findMyScheduleGroups(user.id);
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

  /** 찜한 매치 개수 (활동 기록 페이지용) */
  @UseGuards(JwtAuthGuard)
  @Get('my-favorite-count')
  async getMyFavoriteCount(@CurrentUser() user: User) {
    return this.groupsService.getFavoriteCount(user.id);
  }

  /** 운동 통계: 매치 유형별 비율, 월별 활동 추이, 종목별 참여 (도넛차트·그래프 데이터) */
  @UseGuards(JwtAuthGuard)
  @Get('my-activity-stats')
  async getMyActivityStats(@CurrentUser() user: User) {
    return this.groupsService.getMyActivityStats(user.id);
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

  /** 참가 시 랭크 평균 균형에 따라 배정될 팀(레드/블루) 제안 */
  @UseGuards(JwtAuthGuard)
  @Get(':id/suggested-team')
  async getSuggestedTeam(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.groupsService.getSuggestedTeamForJoin(id, user.id);
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
      return await this.groupsService.joinGroup(id, user.id, body?.positionCode, body?.team, body?.slotLabel);
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

  /** 슈퍼 노출: 500P 사용 시 리스트 최상단 24시간 고정 (글 작성자 전용) */
  @UseGuards(JwtAuthGuard)
  @Post(':id/boost')
  @HttpCode(HttpStatus.OK)
  async boostGroup(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.groupsService.boostGroup(id, user.id);
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

  /** QR 인증 토큰 생성 (호스트 전용, 1분 유효) */
  @UseGuards(JwtAuthGuard)
  @Post(':id/qr-token')
  @HttpCode(HttpStatus.OK)
  async createQrToken(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.qrVerificationService.generateToken(id, user.id);
  }

  /** QR 스캔 인증 (용병 참가자만) */
  @UseGuards(JwtAuthGuard)
  @Post(':id/qr-verify')
  @HttpCode(HttpStatus.OK)
  async verifyQrScan(
    @Param('id', ParseIntPipe) id: number,
    @Body('token') token: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.qrVerificationService.verifyScan(id, token, user.id);
    this.groupsGateway.emitMercenaryVerified(id, result.nickname);
    return result;
  }

  /** 참가자가 자신의 포지션/팀 변경 (포지션 지정 매치) */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/my-position')
  async updateMyPosition(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() body: UpdateMyPositionDto,
  ) {
    const result = await this.groupsService.updateMyPosition(
      id,
      user.id,
      body.positionCode,
      body.team,
      body.slotLabel ?? undefined,
      body.positionX,
      body.positionY,
    );
    this.groupsGateway.emitPositionUpdated(id);
    return result;
  }

  /** 예약 대기 등록. 인원 마감된 매치에만 가능. 반환: { position: number } */
  @UseGuards(JwtAuthGuard)
  @Post(':id/waitlist')
  @HttpCode(HttpStatus.OK)
  async addToWaitlist(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.groupsService.addToWaitlist(id, user.id);
  }

  /** 예약 대기 취소 */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/waitlist')
  @HttpCode(HttpStatus.OK)
  async removeFromWaitlist(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.groupsService.removeFromWaitlist(id, user.id);
    return { success: true, message: '예약 대기를 취소했습니다.' };
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

  /** 랭크매치 승패 기록 (심판만). 이긴 팀 +25·1승, 진 팀 -25·1패 반영 */
  @UseGuards(JwtAuthGuard)
  @Post(':id/record-rank-result')
  @HttpCode(HttpStatus.OK)
  async recordRankMatchResult(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() body: { finalScoreRed: number; finalScoreBlue: number },
  ) {
    const { finalScoreRed, finalScoreBlue } = body;
    if (typeof finalScoreRed !== 'number' || typeof finalScoreBlue !== 'number' || finalScoreRed < 0 || finalScoreBlue < 0) {
      throw new BadRequestException('finalScoreRed, finalScoreBlue는 0 이상의 숫자여야 합니다.');
    }
    return this.groupsService.recordRankMatchResult(id, user.id, finalScoreRed, finalScoreBlue);
  }

  /** 매치 종료 후 리뷰 작성 가능 여부 및 항목·참가자 목록 */
  @UseGuards(JwtAuthGuard)
  @Get(':id/review-eligibility')
  async getReviewEligibility(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.groupsService.getReviewEligibility(id, user.id);
  }

  /** 매치 리뷰 제출 (항목별 선택된 참가자 userId). 제출 시 포인트 지급 */
  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  @HttpCode(HttpStatus.CREATED)
  async submitReview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() body: { answers: Record<string, number> },
  ) {
    if (!body?.answers || typeof body.answers !== 'object') {
      throw new BadRequestException('answers 객체를 보내주세요.');
    }
    return this.groupsService.submitReview(id, user.id, body.answers);
  }

  /** 시설 리뷰 제출. 선수리뷰와 별도 500P 지급 */
  @UseGuards(JwtAuthGuard)
  @Post(':id/facility-review')
  @HttpCode(HttpStatus.CREATED)
  async submitFacilityReview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() body: { facilityId: number; cleanliness: number; suitableForGame: number; overall: number },
  ) {
    if (
      body?.facilityId == null ||
      typeof body.cleanliness !== 'number' ||
      typeof body.suitableForGame !== 'number' ||
      typeof body.overall !== 'number'
    ) {
      throw new BadRequestException('facilityId, cleanliness, suitableForGame, overall를 보내주세요.');
    }
    return this.groupsService.submitFacilityReview(id, body.facilityId, user.id, {
      cleanliness: body.cleanliness,
      suitableForGame: body.suitableForGame,
      overall: body.overall,
    });
  }

  /** 용병 구하기 매치: 호스트 전용 용병 리뷰 작성 가능 여부 및 목록 */
  @UseGuards(JwtAuthGuard)
  @Get(':id/mercenary-review-eligibility')
  async getMercenaryReviewEligibility(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.groupsService.getMercenaryReviewEligibility(id, user.id);
  }

  /** 용병 리뷰 제출 (노쇼/장비 미지참/매너 좋음 선택) */
  @UseGuards(JwtAuthGuard)
  @Post(':id/mercenary-review')
  @HttpCode(HttpStatus.CREATED)
  async submitMercenaryReview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() body: { noShowIds?: number[]; noEquipmentIds?: number[]; goodMannerIds?: number[] },
  ) {
    return this.groupsService.submitMercenaryReview(id, user.id, {
      noShowIds: body.noShowIds ?? [],
      noEquipmentIds: body.noEquipmentIds ?? [],
      goodMannerIds: body.goodMannerIds ?? [],
    });
  }
}

