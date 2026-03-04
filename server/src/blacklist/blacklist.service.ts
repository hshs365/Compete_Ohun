import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blacklist } from './entities/blacklist.entity';

@Injectable()
export class BlacklistService {
  constructor(
    @InjectRepository(Blacklist)
    private blacklistRepository: Repository<Blacklist>,
  ) {}

  private normalizePhone(phone: string): string {
    return phone.replace(/-/g, '').trim();
  }

  /** 전화번호가 블랙리스트에 있는지 확인 */
  async isBlacklisted(phone: string): Promise<boolean> {
    const normalized = this.normalizePhone(phone);
    if (!normalized) return false;
    const exist = await this.blacklistRepository.findOne({
      where: { phone: normalized },
    });
    return !!exist;
  }

  /** 블랙리스트 추가 (관리자 전용) */
  async add(phone: string, reason: string | null, adminUserId: number): Promise<Blacklist> {
    const normalized = this.normalizePhone(phone);
    if (!normalized || normalized.length < 10) {
      throw new BadRequestException('올바른 전화번호 형식이 아닙니다.');
    }
    const existing = await this.blacklistRepository.findOne({ where: { phone: normalized } });
    if (existing) {
      throw new BadRequestException('이미 블랙리스트에 등록된 전화번호입니다.');
    }
    const entry = this.blacklistRepository.create({
      phone: normalized,
      reason: reason?.trim() || null,
      createdByUserId: adminUserId,
    });
    return this.blacklistRepository.save(entry);
  }

  /** 블랙리스트 제거 (관리자 전용) */
  async remove(phone: string): Promise<void> {
    const normalized = this.normalizePhone(phone);
    await this.blacklistRepository.delete({ phone: normalized });
  }

  /** 블랙리스트 목록 조회 (관리자 전용) */
  async findAll(): Promise<Blacklist[]> {
    return this.blacklistRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['createdBy'],
    });
  }
}
