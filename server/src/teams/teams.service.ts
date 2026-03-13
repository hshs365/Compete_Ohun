import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { CreateTeamDto } from './dto/create-team.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

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
  /** 크루를 생성한 사용자 ID. 크루장은 1인당 1개로 제한. */
  captainUserId?: number;
}

/**
 * 팀(크루) 서비스.
 * ⚠️ 현재 mockTeams는 메모리 배열이라 서버 재시작 시 새로 생성한 크루가 모두 사라집니다.
 * 영구 저장이 필요하면 Team 엔티티 및 DB 연동이 필요합니다.
 */
@Injectable()
export class TeamsService {
  constructor(private readonly notificationsService: NotificationsService) {}

  private readonly mockTeams: TeamMembership[] = [];

  /** 내가 속한 크루만 반환 (캡틴 또는 멤버) */
  getMyTeams(userId: number): TeamMembership[] {
    return this.mockTeams.filter(
      (t) =>
        t.captainUserId === userId ||
        (t.participants ?? []).some((p) => p.id === userId),
    );
  }

  async createTeam(
    dto: CreateTeamDto,
    captainUserId: number,
    logo?: Express.Multer.File,
  ): Promise<TeamMembership> {
    // 크루장은 1인당 1개로 제한 (내가 생성해 크루장이 되는 모임은 하나만 가능)
    const alreadyCaptainOf = this.mockTeams.find((t) => t.captainUserId === captainUserId);
    if (alreadyCaptainOf) {
      throw new BadRequestException('이미 크루장으로 등록된 용병 크루가 있습니다. 크루장은 1개로 제한됩니다.');
    }

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
      sport: (dto.sport?.trim() || '전체'),
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
      captainUserId,
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

  /** 현재 사용자 기준으로 role을 설정해 반환 */
  withUserRole(team: TeamMembership, userId: number): TeamMembership {
    const role = team.captainUserId === userId ? 'captain' as const
      : (team.participants ?? []).some((p) => p.id === userId) ? 'member' as const
      : undefined;
    return { ...team, role };
  }

  /** 팀 둘러보기: 종목·지역·검색으로 필터 */
  /**
   * 크루 초대: 캡틴이 팔로워/팔로잉 유저에게 초대 알림 발송
   */
  async inviteUsers(
    teamId: number,
    captainUserId: number,
    userIds: number[],
    inviterNickname: string,
  ): Promise<{ invited: number }> {
    const team = this.getTeamById(teamId);
    if (!team) {
      throw new NotFoundException('크루 정보를 찾을 수 없습니다.');
    }
    if (team.captainUserId !== captainUserId) {
      throw new ForbiddenException('크루장만 초대할 수 있습니다.');
    }
    const existingIds = new Set((team.participants ?? []).map((p) => p.id));
    const toInvite = userIds.filter((id) => id !== captainUserId && !existingIds.has(id));
    for (const userId of toInvite) {
      try {
        await this.notificationsService.createNotification(
          userId,
          NotificationType.TEAM_INVITE,
          '크루 초대',
          `${inviterNickname}님이 "${team.teamName}" 크루에 초대했습니다.`,
          { teamId, teamName: team.teamName, inviterId: captainUserId },
        );
      } catch (err) {
        // 알림 실패 시 로그만 남기고 계속 진행
        console.warn('크루 초대 알림 발송 실패:', userId, err);
      }
    }
    return { invited: toInvite.length };
  }

  browseTeams(sport?: string, region?: string, search?: string, excludeRegion?: string): TeamMembership[] {
    let list = sport && sport.trim() ? this.mockTeams.filter((t) => t.sport === sport) : [...this.mockTeams];
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
