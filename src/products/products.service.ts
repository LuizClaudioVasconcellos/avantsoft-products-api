import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  private validateProductData(dto: CreateProductDto | UpdateProductDto) {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('Product name cannot be empty');
    }

    if (dto.name.length > 100) {
      throw new BadRequestException(
        'Product name cannot exceed 100 characters',
      );
    }

    if (dto.price === undefined || dto.price === null) {
      throw new BadRequestException('Price is required');
    }

    if (typeof dto.price !== 'number' || isNaN(dto.price)) {
      throw new BadRequestException('Price must be a valid number');
    }

    if (dto.price <= 0) {
      throw new BadRequestException('Price must be greater than zero');
    }

    if (dto.price.toString().split('.')[1]?.length > 2) {
      throw new BadRequestException('Price can have at most 2 decimal places');
    }

    if ('sku' in dto) {
      if (!dto.sku || dto.sku.trim().length === 0) {
        throw new BadRequestException('SKU cannot be empty');
      }

      if (dto.sku.length > 50) {
        throw new BadRequestException('SKU cannot exceed 50 characters');
      }

      const skuRegex = /^[a-zA-Z0-9\-_]+$/;
      if (!skuRegex.test(dto.sku)) {
        throw new BadRequestException(
          'SKU can only contain letters, numbers, hyphens and underscores',
        );
      }
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    this.validateProductData(createProductDto);

    const existingProduct = await this.productsRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new BadRequestException(
        `Product with SKU ${createProductDto.sku} already exists`,
      );
    }

    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productsRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('Invalid product ID');
    }

    if (Object.keys(updateProductDto).length === 0) {
      throw new BadRequestException('No update data provided');
    }

    this.validateProductData(updateProductDto);

    const product = await this.findOne(id);

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const skuExists = await this.productsRepository.findOne({
        where: { sku: updateProductDto.sku },
      });
      if (skuExists) {
        throw new BadRequestException(
          `Product with SKU ${updateProductDto.sku} already exists`,
        );
      }
    }

    this.productsRepository.merge(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('Invalid product ID');
    }

    const result = await this.productsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  findMissingLetter(name: string): string {
    if (!name || typeof name !== 'string') {
      return '_';
    }

    const lowerName = name.toLowerCase();
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';

    for (const letter of alphabet) {
      if (!lowerName.includes(letter)) {
        return letter;
      }
    }

    return '_';
  }
}
