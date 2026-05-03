import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, Min, IsDecimal, IsInt } from 'class-validator';

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
  @IsInt()
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

  @ApiProperty({ 
    description: 'Tempo padrão do ciclo de lavagem (em minutos)', 
    example: 45,
    default: 30
  })
  @IsInt({ message: 'A duração da lavagem deve ser um número inteiro.' })
  @Min(1, { message: 'A duração mínima é de 1 minuto.' })
  washDuration: number;

  @ApiPropertyOptional({ 
    description: 'Tempo do ciclo completo (lavar + secar) em minutos. Obrigatório se isWasherDryer for true.', 
    example: 150 
  })
  @IsOptional()
  @IsInt({ message: 'A duração do ciclo completo deve ser um número inteiro.' })
  @Min(1)
  fullCycleDuration?: number;

  @ApiPropertyOptional({ 
    description: 'URL da imagem da máquina', 
    example: 'https://storage.link/machine.jpg' 
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}