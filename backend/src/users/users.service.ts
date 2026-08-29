import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findOrCreate(data: {
        googleId: string;
        email: string;
        name: string;
        avatarUrl?: string;
    }) {
        // 1. Tenta encontrar o usuário pelo googleId único
        let user = await this.prisma.user.findUnique({where: { googleId: data.googleId }});

        // 2. Se não encontrar, cria um novo registro
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    googleId: data.googleId,
                    email: data.email,
                    name: data.name,
                    avatarUrl: data.avatarUrl,
                    isProvider: false, // Todo usuário começa como cliente por padrão
                },
            });
        }

        return user;
    }

    // Método auxiliar para buscar por ID interno
    async findOne(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.findOne(id);

        if (!user) return { error: 'USER_NOT_FOUND' };

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: updateUserDto,
        });

        return { data: updatedUser };
    }
}