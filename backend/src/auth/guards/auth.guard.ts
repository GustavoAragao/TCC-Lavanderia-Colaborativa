import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core'; // O Reflector lê as etiquetas (metadados) que colocamos nas rotas.
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Verifica se a rota (ou a classe) tem o decorator @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) 
        return true; 
    
    // 2. Se não for pública, segue o fluxo normal de verificar o JWT
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Acesso negado: Token não fornecido');
    }

    try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
            secret: process.env.JWT_SECRET,
        });
        // Anexa o payload na requisição para uso futuro nos controllers
        request.user = {
            sub: payload.sub,
            email: payload.email,
            isProvider: payload.isProvider,
        };
    } catch {
      throw new UnauthorizedException('Acesso negado: Token inválido ou expirado');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}