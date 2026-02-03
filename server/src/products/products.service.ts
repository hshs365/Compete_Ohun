import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as XLSX from 'xlsx';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { BulkCreateProductDto } from './dto/bulk-create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UsersService } from '../users/users.service';
import { uploadConfig } from '../config/upload.config';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private usersService: UsersService,
  ) {}

  private async ensureBusiness(sellerId: number): Promise<void> {
    const seller = await this.usersService.findOne(sellerId);
    if (seller.isAdmin) return;
    if (seller.memberType !== 'business') {
      throw new ForbiddenException('사업자 회원만 상품을 등록할 수 있습니다.');
    }
    if (!seller.businessNumberVerified) {
      throw new ForbiddenException('사업자번호 검증이 완료된 사용자만 상품을 등록할 수 있습니다.');
    }
  }

  async uploadProductImage(sellerId: number, file: Express.Multer.File): Promise<string> {
    await this.ensureBusiness(sellerId);
    const uploadDir = uploadConfig.productImageDir ?? path.join(process.cwd(), 'uploads', 'product');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${sellerId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);
    return `/uploads/product/${filename}`;
  }

  async create(createProductDto: CreateProductDto, sellerId: number): Promise<Product> {
    await this.ensureBusiness(sellerId);
    const images = createProductDto.images?.length
      ? createProductDto.images
      : createProductDto.image
        ? [createProductDto.image]
        : [];
    if (!images.length) {
      throw new BadRequestException('이미지는 최소 1개 이상 등록해 주세요.');
    }
    const product = this.productRepository.create({
      ...createProductDto,
      images,
      image: images[0] ?? null,
      sellerId,
      originalPrice: createProductDto.originalPrice ?? null,
      sport: createProductDto.sport ?? null,
    });
    return this.productRepository.save(product);
  }

  async createBulk(dto: BulkCreateProductDto, sellerId: number): Promise<{ created: number; products: Product[] }> {
    await this.ensureBusiness(sellerId);
    if (!dto.products?.length) {
      throw new BadRequestException('등록할 상품이 없습니다.');
    }
    if (dto.products.length > 100) {
      throw new BadRequestException('한 번에 최대 100개까지 등록할 수 있습니다.');
    }
    const products: Product[] = [];
    for (const item of dto.products) {
      const images = item.images?.length ? item.images : item.image ? [item.image] : [];
      if (!images.length) {
        throw new BadRequestException('각 상품마다 이미지는 최소 1개 이상 필요합니다.');
      }
      const product = this.productRepository.create({
        ...item,
        images,
        image: images[0] ?? null,
        sellerId,
        originalPrice: item.originalPrice ?? null,
        sport: item.sport ?? null,
      });
      products.push(await this.productRepository.save(product));
    }
    return { created: products.length, products };
  }

  /** 엑셀 컬럼: 상품명, 브랜드, 가격, 정가(선택), 카테고리, 종목(선택), 설명(선택), 이미지URL */
  async importFromExcel(sellerId: number, file: Express.Multer.File): Promise<{ created: number; errors: string[] }> {
    await this.ensureBusiness(sellerId);
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    if (rows.length < 2) {
      throw new BadRequestException('엑셀에 헤더와 최소 1행의 데이터가 필요합니다.');
    }
    const headers = (rows[0] as unknown[]).map((h) => String(h ?? '').trim());
    const nameIdx = headers.findIndex((h) => /상품명/i.test(h));
    const brandIdx = headers.findIndex((h) => /브랜드/i.test(h));
    const priceIdx = headers.findIndex((h) => /가격/i.test(h));
    const origIdx = headers.findIndex((h) => /정가/i.test(h));
    const catIdx = headers.findIndex((h) => /카테고리/i.test(h));
    const sportIdx = headers.findIndex((h) => /종목/i.test(h));
    const descIdx = headers.findIndex((h) => /설명/i.test(h));
    const imageIdx = headers.findIndex((h) => /이미지/i.test(h) && /url|주소|링크/i.test(h));
    if (nameIdx < 0 || brandIdx < 0 || priceIdx < 0 || catIdx < 0 || imageIdx < 0) {
      throw new BadRequestException(
        '엑셀에 "상품명", "브랜드", "가격", "카테고리", "이미지URL"(또는 이미지주소/이미지링크) 컬럼이 필요합니다.',
      );
    }
    const errors: string[] = [];
    let created = 0;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      const name = row[nameIdx] != null ? String(row[nameIdx]).trim() : '';
      const brand = row[brandIdx] != null ? String(row[brandIdx]).trim() : '';
      const priceVal = row[priceIdx];
      const price = typeof priceVal === 'number' ? priceVal : parseInt(String(priceVal ?? ''), 10);
      const origVal = origIdx >= 0 ? row[origIdx] : undefined;
      const originalPrice = origVal != null && origVal !== '' ? (typeof origVal === 'number' ? origVal : parseInt(String(origVal), 10)) : undefined;
      const category = catIdx >= 0 && row[catIdx] != null ? String(row[catIdx]).trim() : '';
      const sport = sportIdx >= 0 && row[sportIdx] != null ? String(row[sportIdx]).trim() || undefined : undefined;
      const description = descIdx >= 0 && row[descIdx] != null ? String(row[descIdx]).trim() || undefined : undefined;
      const image = row[imageIdx] != null ? String(row[imageIdx]).trim() : '';
      if (!name || !brand || Number.isNaN(price) || price < 0 || !category || !image) {
        errors.push(`${i + 1}행: 필수값(상품명, 브랜드, 가격, 카테고리, 이미지URL)을 확인해 주세요.`);
        continue;
      }
      try {
        const images = [image];
        const product = this.productRepository.create({
          name: name.slice(0, 200),
          brand: brand.slice(0, 100),
          price,
          originalPrice: originalPrice != null && !Number.isNaN(originalPrice) ? originalPrice : null,
          category: category.slice(0, 100),
          sport: sport?.slice(0, 50) ?? null,
          description: description?.slice(0, 2000) ?? null,
          image,
          images,
          sellerId,
        });
        await this.productRepository.save(product);
        created++;
      } catch (e) {
        errors.push(`${i + 1}행: ${e instanceof Error ? e.message : '저장 실패'}`);
      }
    }
    return { created, errors };
  }

  async findAll(queryDto: ProductQueryDto): Promise<{ products: Product[]; total: number }> {
    const { category, sport, brand, search, page = 1, limit = 50 } = queryDto;
    const skip = (page - 1) * limit;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller')
      .where('product.isActive = :isActive', { isActive: true });

    if (category) {
      qb.andWhere('product.category = :category', { category });
    }
    if (sport) {
      qb.andWhere('product.sport = :sport', { sport });
    }
    if (brand) {
      qb.andWhere('product.brand = :brand', { brand });
    }
    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.brand ILIKE :search OR product.category ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [products, total] = await qb.orderBy('product.createdAt', 'DESC').skip(skip).take(limit).getManyAndCount();
    return { products, total };
  }

  async findOne(id: number): Promise<Product | null> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
      relations: ['seller'],
    });
    if (product && !product.images?.length && product.image) {
      product.images = [product.image];
    }
    return product;
  }
}
