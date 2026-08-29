// src/reviews/reviews.controller.ts
import { Controller, Post, Body, Get, Param, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
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
    
      const result = await this.reviewsService.create(user.sub, dto);
    if (!result.success) {
      switch (result.error) {
        case 'BOOKING_NOT_FOUND':
            throw new NotFoundException('Agendamento não encontrado.');
        case 'FORBIDDEN':
            throw new ForbiddenException('Você não tem permissão para avaliar este serviço.');
        case 'INVALID_STATUS':
            throw new BadRequestException('Apenas serviços finalizados podem ser avaliados.');
        case 'ALREADY_REVIEWED':
            throw new ConflictException('Você já avaliou este serviço.');
        default:
            throw new BadRequestException('Erro ao processar a avaliação.');
      }
    }

    return {
        message: 'Avaliação registrada com sucesso!',
        data: result.data,
    };
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