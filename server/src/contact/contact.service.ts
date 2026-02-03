import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  async create(dto: CreateContactDto & { submitterEmail: string }, userId?: number) {
    const contact = this.contactRepository.create({
      type: dto.type,
      title: dto.title,
      content: dto.content,
      submitterEmail: dto.submitterEmail,
      userId: userId ?? null,
    });
    return this.contactRepository.save(contact);
  }
}
