import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private noticeRepository: Repository<Notice>,
  ) {}

  async findAll(): Promise<Notice[]> {
    return this.noticeRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateNoticeDto, user: User): Promise<Notice> {
    if (!user.isAdmin) {
      throw new ForbiddenException('관리자만 공지사항을 등록할 수 있습니다.');
    }
    const notice = this.noticeRepository.create({
      type: dto.type,
      title: dto.title.trim(),
      content: dto.content.trim(),
      version: dto.version?.trim() || null,
      isImportant: dto.isImportant ?? false,
    });
    return this.noticeRepository.save(notice);
  }
}
