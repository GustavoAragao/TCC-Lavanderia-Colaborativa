import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../../services/AuthService'; 
import { User } from '../../types/auth';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await SecureStore.getItemAsync('user_data');
      if (userData) {
        setUser(JSON.parse(userData) as User);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      await GoogleSignin.signOut();
      router.replace('/');
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lavanderia Colaborativa</Text>

      {user ? (
        <View style={styles.profileArea}>
          <Text style={styles.welcomeText}>Olá, {user.name}!</Text>
          <Text style={styles.emailText}>{user.email}</Text>
          {user.isProvider && (
            <Text style={styles.badge}>Modo Administrador</Text>
          )}
        </View>
      ) : (
        <Text>Carregando perfil...</Text>
      )}

      <Button 
        title="Ver Máquinas Disponíveis"
        onPress={() => router.push('/machines')}
      />

      <Button title="Sair" onPress={handleLogout} color="#d9534f" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  profileArea: { alignItems: 'center', marginBottom: 30 },
  welcomeText: { fontSize: 18, fontWeight: '600' },
  emailText: { color: '#666', marginTop: 5 },
  badge: { 
    marginTop: 10, 
    padding: 5, 
    backgroundColor: '#E3F2FD', 
    color: '#1976D2', 
    borderRadius: 5, 
    fontSize: 12, 
    fontWeight: 'bold' 
  }
});