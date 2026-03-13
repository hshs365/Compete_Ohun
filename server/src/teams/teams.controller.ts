import { Controller, Get, Post, Param, Query, Body, UseGuards, NotFoundException, ValidationPipe, UseInterceptors, UploadedFile, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteTeamDto } from './dto/invite-team.dto';

@Controller('api/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyTeams(@CurrentUser() user: User) {
    return this.teamsService.getMyTeams(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('logo', {
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
      }
    },
  }))
  createTeam(
    @Body(ValidationPipe) dto: CreateTeamDto,
    @CurrentUser() user: User,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return this.teamsService.createTeam(dto, user.id, logo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('browse')
  browseTeams(
    @Query('sport') sport: string | undefined,
    @Query('region') region: string | undefined,
    @Query('search') search: string | undefined,
    @Query('excludeRegion') excludeRegion: string | undefined,
  ) {
    return this.teamsService.browseTeams(sport, region, search, excludeRegion);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invite')
  async inviteUsers(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: InviteTeamDto,
    @CurrentUser() user: User,
  ) {
    const nickname = user.nickname ?? user.email?.split('@')[0] ?? '크루장';
    return this.teamsService.inviteUsers(id, user.id, dto.userIds, nickname);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getTeamDetail(@Param('id') id: string, @CurrentUser() user: User) {
    const teamId = Number(id);
    if (Number.isNaN(teamId)) {
      throw new NotFoundException('팀 정보를 찾을 수 없습니다.');
    }

    const team = this.teamsService.getTeamById(teamId);
    if (!team) {
      throw new NotFoundException('팀 정보를 찾을 수 없습니다.');
    }

    return this.teamsService.withUserRole(team, user.id);
  }
}
