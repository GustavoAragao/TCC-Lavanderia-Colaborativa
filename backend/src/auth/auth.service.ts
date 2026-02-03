import { Injectable  } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

export type JwtPayload = {
  sub: string;
  email: string;
  isProvider: boolean;
};

@Injectable()
export class AuthService {
    private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

    async authenticate(token: string) {
        //valida o token com os servidores do Google
        const ticket = await this.googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) throw new Error('INVALID_TOKEN'); 

        // se o token for real, extraímos os dados
        const { sub: googleId, email, name, picture: avatarUrl } = payload;

        if (!email || !name) throw new Error('INCOMPLETE_DATA');

        // Busca ou cria o usuário no banco
        const user = await this.usersService.findOrCreate({googleId, email, name, avatarUrl});

        // 2. Gera o JWT 
        const jwtPayload : JwtPayload = { sub: user.id, email: user.email, isProvider: user.isProvider };
        
        return {
            user,
            access_token: await this.jwtService.signAsync(jwtPayload),
        };
    }
}