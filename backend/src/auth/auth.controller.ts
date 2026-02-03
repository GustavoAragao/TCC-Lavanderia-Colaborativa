import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('autenticação') // Nome da seção no Swagger
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public() //Torna rota publica
    @Post('google')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Autenticação via Google', 
        description: 'Valida o token do Google e gera um JWT próprio para a Lavanderia Salobrinho.' 
    })
    @ApiResponse({ status: 200, description: 'Login realizado com sucesso. Retorna o perfil e o access_token.' })
    @ApiResponse({ status: 401, description: 'Token inválido ou falha na autenticação.' })
    @ApiResponse({ status: 400, description: 'Dados incompletos fornecidos pelo Google.' })
    async authenticate(@Body() loginDto: LoginDto) {
        try {
            return await this.authService.authenticate(loginDto.token);
        } catch (error) { // Controller faz o seu trabalho de "porteiro" retornando as respostas http corretas
            if (error.message === 'INVALID_TOKEN') 
                throw new UnauthorizedException('Token do Google inválido ou expirado.');
            
            if (error.message === 'INCOMPLETE_DATA') 
                throw new BadRequestException('O Google não forneceu dados básicos (e-mail ou nome).');
            
            throw new UnauthorizedException('Falha na autenticação. ' + error.message);
        }
    }
}