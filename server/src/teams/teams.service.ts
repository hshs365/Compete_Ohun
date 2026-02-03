import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { CreateTeamDto } from './dto/create-team.dto';

export interface TeamParticipant {
  id: number;
  nickname: string;
  tag?: string;
  position: string;
  role?: 'captain' | 'member';
}

export interface TeamMembership {
  id: number;
  teamName: string;
  sport: string;
  position: string;
  role?: 'captain' | 'member';
  description?: string;
  memberCount?: number;
  logoUrl?: string;
  winRate?: number;
  participants?: TeamParticipant[];
  region?: string;
  coach?: string;
  assistantCoach?: string;
  contact?: string;
}

@Injectable()
export class TeamsService {
  private readonly mockTeams: TeamMembership[] = [
    {
      id: 1,
      teamName: '청계 FC',
      sport: '축구',
      position: 'DF',
      role: 'member',
      description: '주말마다 모이는 지역 축구팀입니다.',
      memberCount: 24,
      winRate: 65,
      region: '대전광역시',
      participants: [
        { id: 1, nickname: '홍길동', tag: '#0001', position: 'GK', role: 'captain' },
        { id: 2, nickname: '김철수', tag: '#0002', position: 'DF', role: 'member' },
        { id: 3, nickname: '이영희', tag: '#0003', position: 'MF', role: 'member' },
        { id: 4, nickname: '박민수', tag: '#0004', position: 'FW', role: 'member' },
      ],
    },
    {
      id: 2,
      teamName: '드림즈',
      sport: '야구',
      position: 'CF',
      role: 'captain',
      description: '사회인 야구 리그 참가팀.',
      memberCount: 18,
      winRate: 72,
      region: '대전광역시',
      participants: [
        { id: 5, nickname: '최대한', tag: '#0005', position: 'P', role: 'captain' },
        { id: 6, nickname: '정수진', tag: '#0006', position: 'C', role: 'member' },
        { id: 7, nickname: '한지민', tag: '#0007', position: '1B', role: 'member' },
      ],
    },
    {
      id: 3,
      teamName: '유성 FC',
      sport: '축구',
      position: 'MF',
      role: 'member',
      description: '유성구 일대 풋살팀.',
      memberCount: 15,
      winRate: 58,
      region: '대전광역시',
      participants: [],
    },
    {
      id: 4,
      teamName: '강남 유나이티드',
      sport: '축구',
      position: 'FW',
      region: '서울특별시',
      participants: [],
    },
    {
      id: 5,
      teamName: '해운대 슛',
      sport: '축구',
      position: 'GK',
      region: '부산광역시',
      participants: [],
    },
    {
      id: 6,
      teamName: '인천 윙스',
      sport: '축구',
      position: 'DF',
      region: '인천광역시',
      participants: [],
    },
    {
      id: 7,
      teamName: '수원 로열',
      sport: '축구',
      position: 'MF',
      region: '경기도',
      participants: [],
    },
    { id: 8, teamName: '대전 풋살클럽', sport: '풋살', position: 'MF', region: '대전광역시', participants: [] },
    { id: 9, teamName: '서울 스트리트', sport: '풋살', position: 'FW', region: '서울특별시', participants: [] },
    { id: 10, teamName: '궁동 농구팀', sport: '농구', position: 'SG', region: '대전광역시', participants: [] },
    { id: 11, teamName: '강남 슬램덩크', sport: '농구', position: 'PF', region: '서울특별시', participants: [] },
  ];

  getMyTeams(): TeamMembership[] {
    return this.mockTeams;
  }

  async createTeam(
    dto: CreateTeamDto,
    captainUserId: number,
    logo?: Express.Multer.File,
  ): Promise<TeamMembership> {
    let logoUrl: string | undefined;
    if (logo) {
      logoUrl = await this.uploadTeamLogo(logo);
    }

    const inviteeIds: number[] = [];
    if (dto.inviteeIds) {
      try {
        const parsed = JSON.parse(dto.inviteeIds);
        if (Array.isArray(parsed)) {
          inviteeIds.push(...parsed.filter((id: unknown) => typeof id === 'number'));
        }
      } catch {
        // ignore
      }
    }

    const nextId = Math.max(...this.mockTeams.map((t) => t.id), 0) + 1;
    const participants: TeamParticipant[] = inviteeIds.slice(0, 20).map((id, i) => ({
      id,
      nickname: `초대유저${i + 1}`,
      tag: undefined,
      position: '',
      role: 'member' as const,
    }));

    const team: TeamMembership = {
      id: nextId,
      teamName: dto.teamName,
      sport: dto.sport,
      position: '',
      role: 'captain',
      description: dto.description,
      memberCount: 1 + participants.length,
      region: dto.region,
      coach: dto.coach,
      assistantCoach: dto.assistantCoach,
      contact: dto.contact,
      logoUrl,
      participants,
    };
    this.mockTeams.push(team);
    return team;
  }

  private async uploadTeamLogo(file: Express.Multer.File): Promise<string> {
    const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    const uploadDir = path.join(baseUploadDir, 'team');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    const ext = path.extname(file.originalname) || '.jpg';
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const filename = `logo_${Date.now()}_${randomBytes}${ext}`;
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);
    return `/uploads/team/${filename}`;
  }

  getTeamById(teamId: number): TeamMembership | null {
    return this.mockTeams.find((team) => team.id === teamId) || null;
  }

  /** 팀 둘러보기: 종목·지역·검색으로 필터 */
  browseTeams(sport: string, region?: string, search?: string, excludeRegion?: string): TeamMembership[] {
    let list = this.mockTeams.filter((t) => t.sport === sport);
    if (region) {
      list = list.filter((t) => t.region === region);
    }
    if (excludeRegion) {
      list = list.filter((t) => t.region !== excludeRegion);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.teamName.toLowerCase().includes(q) ||
          (t.region || '').toLowerCase().includes(q),
      );
    }
    return list;
  }
}
