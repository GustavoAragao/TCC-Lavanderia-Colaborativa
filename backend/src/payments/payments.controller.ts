import { Controller, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('pagamentos')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook do Mercado Pago' })
  async webhook(@Query() query: any, @Body() body: any) {
    // O MP envia o ID de formas diferentes dependendo do evento
    const id = query.id || (body.data && body.data.id);
    const type = query.topic || body.type;

    if (type === 'payment') {
      await this.paymentsService.handleWebhook(id);
    }

    return { received: true };
  }
}