// src/reviews/reviews.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ServiceResult } from '../common/interfaces/service-result.interface';
import { Review } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto): Promise<ServiceResult<Review>> {
    try {
      // Busca o agendamento
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        include: { review: true },
      });

      if (!booking) return { success: false, error: 'BOOKING_NOT_FOUND' };

      // Validações de segurança e regra de negócio
      if (booking.clientId !== userId) return { success: false, error: 'FORBIDDEN' };
      
      if (booking.status !== 'finished') return { success: false, error: 'INVALID_STATUS' };
      
      if (booking.review) return { success: false, error: 'ALREADY_REVIEWED' };

      // 3. Cria a avaliação
      const review = await this.prisma.review.create({
        data: {
          bookingId: dto.bookingId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      return { success: true, data: review };
    } catch (error) {
      return { success: false, error: 'INTERNAL_ERROR' };
    }
  }

  async getMachineReviews(machineId: string): Promise<ServiceResult<any>> {
    try {
        // Buscamos a média e a contagem usando agregação do Prisma
        const stats = await this.prisma.review.aggregate({
            where: { booking: { machineId } },
            _avg: { rating: true },
            _count: { rating: true },
        });

        // 2. Buscamos a lista detalhada de comentários
        const reviews = await this.prisma.review.findMany({
            where: { booking: { machineId } },
            include: {
            booking: {
                select: {
                client: { select: { name: true, avatarUrl: true } },
                scheduledAt: true
                }
            }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { 
            success: true, 
            data: {
            average: stats._avg.rating || 0,
            total: stats._count.rating,
            reviews
            } 
        };
        } catch (error) {
        return { success: false, error: 'FETCH_REVIEWS_ERROR' };
        }
    }
}