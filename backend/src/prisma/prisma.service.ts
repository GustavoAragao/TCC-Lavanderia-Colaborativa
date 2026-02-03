import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexão com Supabase estabelecida com sucesso!');
    } catch (error) {
      this.logger.error('Erro ao conectar ao banco de dados', error.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}