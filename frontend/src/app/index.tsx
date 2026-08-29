import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { signInWithGoogle } from '../services/googleAuth';
import { authService } from '../services/AuthService';

export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await signInWithGoogle();

      if (response.type === 'success') {
        const idToken = response.data.idToken;

        if (!idToken) {
          Alert.alert("Erro", "Google não enviou o ID Token.");
          return;
        }

        const { user } = await authService.loginWithGoogle(idToken);

        console.log(`Logado como: ${user.name}`);
        router.replace('/home');
      } else {
        console.log("O login não foi concluído. Tipo:", response.type);
      }

    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      Alert.alert("Erro", "Falha ao tentar entrar com o Google.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Topo: Branding e Título */}
      <View style={styles.topSection}>
        <Text style={styles.appName}>
          Salobrinho<Text style={styles.highlight}> Wash</Text>
        </Text>
        <Text style={styles.tagline}>Sua roupa limpa, onde você estiver.</Text>
      </View>

      {/* Base: Card de Ação */}
      <View style={styles.bottomCard}>
        <Text style={styles.cardTitle}>Entre ou crie uma conta</Text>
        
        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Entrar com Google</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  appName: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#0A1D47',
    marginBottom: 10,
  },
  highlight: {
    color: '#4CC9F0', // Cor de destaque no texto
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomCard: {
    backgroundColor: '#0A1D47',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 30,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  cardTitle: {
    color: '#4CC9F0',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 25,
  },
  googleButton: {
    backgroundColor: '#4CC9F0',
    flexDirection: 'row',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
});