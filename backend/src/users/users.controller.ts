import { Controller, Get, Param, Patch, Body, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/auth.service';

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

  @Patch('profile')
  @ApiOperation({ summary: 'Editar perfil do usuário atual' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async update(
    @CurrentUser() user: JwtPayload, 
    @Body() updateUserDto: UpdateUserDto
  ) {
      const result = await this.usersService.update(user.sub, updateUserDto);

      if (result.error=== 'USER_NOT_FOUND') {
        throw new NotFoundException('Usuário não encontrado no sistema.');
      }

      return result.data;
  }
}