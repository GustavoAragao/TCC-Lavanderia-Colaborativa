import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min, IsDecimal } from 'class-validator';

export class CreateMachineDto {
  @ApiProperty({ 
    description: 'Nome de exibição da máquina', 
    example: 'Brastemp 12kg - Lavanderia B' 
  })
  @IsString()
  @IsNotEmpty({ message: 'O nome da máquina é obrigatório.' })
  name: string;

  @ApiPropertyOptional({ 
    description: 'Detalhes opcionais sobre da máquina', 
    example: 'Consumo da maquina...' 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Capacidade em kilograms', 
    example: 12 
  })
  @IsNumber()
  @Min(1, { message: 'A capacidade deve ser de pelo menos 1kg.' })
  capacityKg: number;

  @ApiProperty({ 
    description: 'Preço cobrado por cada lavagem/secagem', 
    example: '15.50'
  })
  @IsDecimal({}, { message: 'O preço deve ser um valor decimal válido (ex: 15.50).' })
  @IsNotEmpty()
  pricePerLoad: string;

  @ApiProperty({ 
    description: 'Indica se é uma unidade combinada de lavar e secar', 
    default: false 
  })
  @IsBoolean()
  isWasherDryer: boolean;

  @ApiPropertyOptional({ 
    description: 'URL da imagem da máquina', 
    example: 'https://storage.link/machine.jpg' 
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}