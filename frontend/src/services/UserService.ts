import { BaseService } from './BaseService';
import { User } from '../types/auth';

class UserService extends BaseService {
  private static instance: UserService;

  private constructor() {
    super();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // UC02 - Atualizar perfil (Telefone, Endereço, Status de Provedor)
  async updateProfile(data: Partial<User>): Promise<User> {
    const { data: updatedUser } = await this.api.patch<User>('/users/profile', data);
    return updatedUser;
  }
}

export const userService = UserService.getInstance();