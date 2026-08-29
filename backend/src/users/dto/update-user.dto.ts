import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
    @ApiPropertyOptional({ description: 'Nome completo do usuário', example: 'Gustavo Aragão' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Endereço (Foco no bairro Salobrinho)', example: 'Rua Principal, Salobrinho' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'Telefone de contato', example: '73988887777' })
    @IsOptional()
    @IsString()
    @Length(10, 15, { message: 'O telefone deve ter entre 10 e 15 caracteres' })
    phone?: string;

    @ApiPropertyOptional({ description: 'Define se o usuário é um provedor' })
    @IsOptional()
    @IsBoolean()
    isProvider?: boolean;
}
