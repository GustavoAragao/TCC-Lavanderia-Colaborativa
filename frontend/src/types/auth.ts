export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  address: string | null;
  isProvider: boolean;
  createdAt: string; // Nota: No JSON vira string (ISO date)
}

export interface AuthResponse {
  user: User;
  access_token: string;
}