import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FacilityCourtsService } from './facility-courts.service';
import { CreateFacilityCourtDto } from './dto/create-facility-court.dto';
import { UpdateFacilityCourtDto } from './dto/update-facility-court.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

/** 구장 CRUD - 시설 소유자 전용. POST copy-from은 기존 구장 복사 */
@Controller('api/facilities/:facilityId/courts')
@UseGuards(JwtAuthGuard)
export class FacilityCourtsController {
  constructor(private readonly courtsService: FacilityCourtsService) {}

  @Get()
  findAll(
    @Param('facilityId', ParseIntPipe) facilityId: number,
    @CurrentUser() user: User,
  ) {
    return this.courtsService.findByFacilityIdForOwner(facilityId, user.id);
  }

  @Post()
  create(
    @Param('facilityId', ParseIntPipe) facilityId: number,
    @Body() dto: CreateFacilityCourtDto,
    @CurrentUser() user: User,
  ) {
    return this.courtsService.create(facilityId, dto, user.id);
  }

  /** 기존 구장 정보 복사하여 새 구장 생성. body에 courtName 등 덮어쓸 필드 전달 */
  @Post('copy-from/:sourceCourtId')
  createFromCopy(
    @Param('facilityId', ParseIntPipe) facilityId: number,
    @Param('sourceCourtId', ParseIntPipe) sourceCourtId: number,
    @Body() overrides: Partial<CreateFacilityCourtDto>,
    @CurrentUser() user: User,
  ) {
    return this.courtsService.createFromCopy(facilityId, sourceCourtId, overrides, user.id);
  }

  @Patch(':courtId')
  update(
    @Param('facilityId', ParseIntPipe) facilityId: number,
    @Param('courtId', ParseIntPipe) courtId: number,
    @Body() dto: UpdateFacilityCourtDto,
    @CurrentUser() user: User,
  ) {
    return this.courtsService.update(facilityId, courtId, dto, user.id);
  }

  @Delete(':courtId')
  remove(
    @Param('facilityId', ParseIntPipe) facilityId: number,
    @Param('courtId', ParseIntPipe) courtId: number,
    @CurrentUser() user: User,
  ) {
    return this.courtsService.remove(facilityId, courtId, user.id);
  }
}
