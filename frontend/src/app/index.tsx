import { View, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithGoogle } from '../services/googleAuth';
import * as SecureStore from 'expo-secure-store';
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
      console.error('Erro detalhado:', error);
      Alert.alert("Erro", "Falha na autenticação", error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Entrar com Google" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});