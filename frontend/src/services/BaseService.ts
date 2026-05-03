import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

export abstract class BaseService {
  protected readonly api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL, 
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.initializeRequestInterceptors();
  }

  private initializeRequestInterceptors() {
    // Interceptador de REQUISIÇÃO: injeta o token antes de sair do app
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStore.getItemAsync('user_token');
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptador de RESPOSTA: lida com erros globais (ex: token expirado)
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('Sessão expirada ou token inválido.');
          // Aqui podemos disparar um logout automático futuramente
        }
        return Promise.reject(error);
      }
    );
  }
}