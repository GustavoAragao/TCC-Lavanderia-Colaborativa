import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('usuários')
@ApiBearerAuth() // Ativa o campo de Token JWT no Swagger para estas rotas
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Buscar perfil do usuário' })
  @ApiResponse({ status: 200, description: 'Dados do usuário retornados.' })
  @ApiResponse({ status: 401, description: 'Não autorizado (Token ausente ou inválido).' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    
    if (!user) throw new NotFoundException('Usuário não encontrado');
    
    return user;
  }
}