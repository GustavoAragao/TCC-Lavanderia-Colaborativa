import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /*// Novo teste: Tenta fazer uma query simples no banco
  it('should connect to the database', async () => {
    // O $queryRaw executa um SQL puro. Se o 'SELECT 1' funcionar, a conexão está ok.
    const result = await service.$queryRaw`SELECT 1`;
    expect(result).toBeDefined();
  });*/
});