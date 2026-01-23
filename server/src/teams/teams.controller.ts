import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamsService } from './teams.service';

@Controller('api/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyTeams() {
    return this.teamsService.getMyTeams();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getTeamDetail(@Param('id') id: string) {
    const teamId = Number(id);
    if (Number.isNaN(teamId)) {
      throw new NotFoundException('팀 정보를 찾을 수 없습니다.');
    }

    const team = this.teamsService.getTeamById(teamId);
    if (!team) {
      throw new NotFoundException('팀 정보를 찾을 수 없습니다.');
    }

    return team;
  }
}
