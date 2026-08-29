import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from 'mercadopago';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceResult } from '../common/interfaces/service-result.interface';

@Injectable()
export class PaymentsService {
  private client: MercadoPagoConfig;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });
  }

  // Gera o link de pagamento (Checkout Pro)
  async createPreference(bookingId: string, amount: number, description: string): Promise<ServiceResult<{ preferenceId: string; initPoint: string }>> {
    try {
      const preference = new Preference(this.client);
      const response = await preference.create({
        body: {
          items: [
            {
              id: bookingId,
              title: description,
              unit_price: amount,
              quantity: 1,
              currency_id: 'BRL',
            },
          ],
          payment_methods: {
            excluded_payment_types: [
              { id: 'credit_card' }, // Bloqueia crédito
              { id: 'debit_card' },  // Bloqueia débito
              { id: 'ticket' }       // Bloqueia boleto
            ],
            installments: 1, // Remove opção de parcelamento
          },
          external_reference: bookingId,
          notification_url: `${process.env.WEBHOOK_URL}/payments/webhook`,
          back_urls: {
            success: 'lavanderia://payment-success',
            failure: 'lavanderia://payment-failure',
          },
          auto_return: 'approved',
        },
      });

      return {
        success: true,
        data: { preferenceId: response.id!, initPoint: response.init_point! },
      };
    } catch (error) {
      this.logger.error('Erro ao criar preferência MP:', error);
      return { success: false, error: 'PAYMENT_CREATION_FAILED' };
    }
  }

  // Processa o Webhook (O sinal que o MP envia)
  async handleWebhook(paymentId: string): Promise<ServiceResult<void>> {
    const payment = new Payment(this.client);
    try {
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo.status === 'approved') {

        console.log('Dados do Pagamento Recebidos:', paymentInfo);

        const bookingId = paymentInfo.external_reference;

        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { bookingId },
            data: { status: 'paid', mpPaymentId: paymentId, updatedAt: new Date() },
          }),
          this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'confirmed' },
          }),
        ]);
        
        this.logger.log(`Pagamento ${paymentId} aprovado para Agendamento ${bookingId}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      return { success: false, error: 'WEBHOOK_PROCESSING_FAILED' };
    }
  }

  async refundPayment(paymentId: string): Promise<ServiceResult<void>> {
    try {
      // buscamos o status ATUAL do pagamento no MP
      const payment = new Payment(this.client);
      const paymentInfo = await payment.get({ id: paymentId });

      // Verificamos se ele já foi estornado (total ou parcialmente)
      if (paymentInfo.status === 'refunded' || paymentInfo.status === 'charged_back') {
        this.logger.log(`Pagamento ${paymentId} já consta como estornado no Mercado Pago. Pulando criação.`);
        return { success: true };
      }

      const refund = new PaymentRefund(this.client);
      await refund.create({ payment_id: paymentId });
      
      this.logger.log(`Estorno realizado com sucesso para o pagamento: ${paymentId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Erro ao estornar pagamento ${paymentId}:`, error);
      return { success: false, error: 'REFUND_FAILED' };
    }
  }
}