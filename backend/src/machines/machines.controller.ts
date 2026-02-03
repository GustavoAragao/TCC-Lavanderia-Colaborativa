import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/auth.service';

@ApiTags('máquinas')
@ApiBearerAuth()
@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Cadastrar uma nova máquina', 
    description: 'Cria uma nova máquina no sistema vinculada ao usuário logado.' 
  })
  @ApiResponse({ status: 201, description: 'Máquina cadastrada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado (Token ausente ou inválido).' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  async create(
    @Body() createMachineDto: CreateMachineDto,
    @CurrentUser() user : JwtPayload, 
  ) {
    return this.machinesService.create(createMachineDto, user.sub);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar todas as máquinas', 
    description: 'Retorna uma lista de todas as máquinas cadastradas, incluindo os dados dos proprietários.' 
  })
  @ApiResponse({ status: 200, description: 'Lista de máquinas retornada com sucesso.' })
  async findAll() {
    return this.machinesService.findAll();
  }
}