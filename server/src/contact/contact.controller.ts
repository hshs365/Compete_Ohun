import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  async create(@Body() dto: CreateContactDto) {
    const submitterEmail = dto.submitterEmail?.trim();
    if (!submitterEmail) {
      throw new BadRequestException('이메일을 입력해주세요.');
    }
    return this.contactService.create(
      { ...dto, submitterEmail },
      undefined,
    );
  }
}
