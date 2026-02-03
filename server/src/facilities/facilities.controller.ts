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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { FacilityQueryDto } from './dto/facility-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

@Controller('api/facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Public()
  @Get()
  findAll(@Query() queryDto: FacilityQueryDto) {
    return this.facilitiesService.findAll(queryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMy(@CurrentUser() user: User) {
    return this.facilitiesService.findByOwner(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  uploadImage(@CurrentUser() user: User, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('이미지 파일을 선택해 주세요.');
    }
    return this.facilitiesService.uploadFacilityImage(user.id, file);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.facilitiesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createFacilityDto: CreateFacilityDto, @CurrentUser() user: User) {
    return this.facilitiesService.create(createFacilityDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateFacilityDto>,
    @CurrentUser() user: User,
  ) {
    return this.facilitiesService.update(id, updateData, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.facilitiesService.remove(id, user.id);
  }
}

