import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { BulkCreateProductDto } from './dto/bulk-create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  findAll(@Query() queryDto: ProductQueryDto) {
    return this.productsService.findAll(queryDto);
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
    return this.productsService.uploadProductImage(user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: User) {
    return this.productsService.create(createProductDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  createBulk(@Body() dto: BulkCreateProductDto, @CurrentUser() user: User) {
    return this.productsService.createBulk(dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import-excel')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ok =
          file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel';
        if (!ok) {
          cb(new BadRequestException('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  importExcel(@CurrentUser() user: User, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('엑셀 파일을 선택해 주세요.');
    }
    return this.productsService.importFromExcel(user.id, file);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productsService.findOne(id);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    return product;
  }
}
