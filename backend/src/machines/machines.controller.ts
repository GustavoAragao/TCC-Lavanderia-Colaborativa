import { Controller, Post, Body, Get, Patch, Delete, Param, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/auth.service';
import { UpdateMachineDto } from './dto/update-machine.dto';

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
    const result = await this.machinesService.create(createMachineDto, user.sub);
    if ('error' in result && result.error === 'MISSING_FULL_CYCLE_DURATION') 
      throw new BadRequestException('Máquinas Lava e Seca precisam de uma duração para o ciclo completo.');
    
    return result
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
  
  @Get('me')
  @ApiOperation({ summary: 'Listar máquinas do usuario logado' })
  async findMyMachines(@CurrentUser() user: JwtPayload) {
    return this.machinesService.findByProvider(user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma máquina' })
  @ApiResponse({ status: 200, description: 'Atualizado com sucesso' })
  @ApiResponse({ status: 403, description: 'Você não é o dono' })
  async update(
    @Param('id') id: string, 
    @Body() updateMachineDto: UpdateMachineDto,
    @CurrentUser() user: JwtPayload
  ) {
    const result = await this.machinesService.update(id, updateMachineDto, user.sub);

    if (result.error === 'NOT_FOUND') throw new NotFoundException('Máquina não encontrada');
    if (result.error === 'FORBIDDEN') throw new ForbiddenException('Acesso negado a esta máquina');

    return result.data;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma máquina' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const result = await this.machinesService.remove(id, user.sub);

    if (result.error === 'NOT_FOUND') throw new NotFoundException('Máquina não encontrada');
    if (result.error === 'FORBIDDEN') throw new ForbiddenException('Acesso negado');

    return { message: 'Máquina removida com sucesso' };
  }
  
}