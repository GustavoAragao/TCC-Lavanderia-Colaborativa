import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  // Criamos um objeto simulado (mock) do AuthService
  // Isso evita que o teste tente usar o Google ou o JWT de verdade
  const mockAuthService = {
    authenticate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        // Dizemos ao Nest para usar o nosso mock no lugar do serviço real
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });
});