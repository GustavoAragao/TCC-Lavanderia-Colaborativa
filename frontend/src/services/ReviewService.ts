import { BaseService } from './BaseService';

export interface CreateReviewPayload {
  bookingId: string;
  rating: number;
  comment?: string;
}

class ReviewService extends BaseService {
  private static instance: ReviewService;

  private constructor() {
    super();
  }

  public static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  async createReview(payload: CreateReviewPayload): Promise<any> {
    const { data } = await this.api.post('/reviews', payload);
    return data;
  }
}

export const reviewService = ReviewService.getInstance();