import { AuthResponse } from '../types/auth';
import { BaseService } from './BaseService';
import * as SecureStore from 'expo-secure-store';

class AuthService extends BaseService {
  private static instance: AuthService;

  private constructor() {
    super(); // Inicializa o Axios da BaseService
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    // Usamos o 'this.api' herdado da BaseService
    const { data } = await this.api.post<AuthResponse>('/auth/google', { token: idToken });
    
    if (data.access_token) {
      // Salva o Token e o Usuário (como string)
      await SecureStore.setItemAsync('user_token', data.access_token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(data.user));

      //console.log("MEU TOKEN PARA O SWAGGER:", data.access_token);
    }
    
    return data;
  }

  async logout() {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_data');
  }
}

export const authService = AuthService.getInstance();