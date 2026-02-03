import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'ID Token retornado pelo Google após o login no cliente (web/mobile).',
    example: 'eyJhbGci...',
  })
  @IsString({ message: 'O token deve ser uma string válida.' })
  @IsNotEmpty({ message: 'O token é obrigatório.' })
  token: string;
}