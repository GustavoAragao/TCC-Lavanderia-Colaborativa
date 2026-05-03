// src/reviews/reviews.controller.ts
import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/auth.service';

@ApiTags('Avaliações')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova avaliação' })
  async create(
    @CurrentUser() user: JwtPayload, 
    @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.sub, dto);
  }

  @Get('machine/:machineId')
  @ApiOperation({ summary: 'Buscar média e lista de comentários de uma máquina específica' })
  async getByMachine(@Param('machineId') machineId: string) {
    const result = await this.reviewsService.getMachineReviews(machineId);

    if (!result.success) {
      throw new BadRequestException('Não foi possível carregar as avaliações desta máquina.');
    }

    return result.data;
  }
}