import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Torna o módulo disponível em todo o app sem precisar importar de novo
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Permite que outros módulos usem o PrismaService
})
export class PrismaModule {}
