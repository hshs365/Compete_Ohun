import { Injectable } from '@nestjs/common';

export interface TeamMembership {
  id: number;
  teamName: string;
  sport: string;
  position: string;
  role?: 'captain' | 'member';
  description?: string;
  memberCount?: number;
}

@Injectable()
export class TeamsService {
  // TODO: 실제 DB 연동 시 사용자별 팀 정보 조회로 교체
  private readonly mockTeams: TeamMembership[] = [
    {
      id: 1,
      teamName: '청계 FC',
      sport: '축구',
      position: 'DF',
      role: 'member',
      description: '주말마다 모이는 지역 축구팀입니다.',
      memberCount: 24,
    },
    {
      id: 2,
      teamName: '드림즈',
      sport: '야구',
      position: 'CF',
      role: 'captain',
      description: '사회인 야구 리그 참가팀.',
      memberCount: 18,
    },
  ];

  getMyTeams(): TeamMembership[] {
    return this.mockTeams;
  }

  getTeamById(teamId: number): TeamMembership | null {
    return this.mockTeams.find((team) => team.id === teamId) || null;
  }
}
