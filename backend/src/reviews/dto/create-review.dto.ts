// src/reviews/dto/create-review.dto.ts
import { IsInt, IsString, IsUUID, Min, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  bookingId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}