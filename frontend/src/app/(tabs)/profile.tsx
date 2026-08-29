import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { userService } from '../../services/UserService';
import { authService } from '../../services/AuthService';
import { User } from '../../types/auth';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await SecureStore.getItemAsync('user_data');
      if (userData) {
        const parsedUser = JSON.parse(userData) as User;
        setUser(parsedUser);
        setName(parsedUser.name || '');
        setPhone(parsedUser.phone || '');
        setAddress(parsedUser.address || '');
      }
    };
    loadUser();
  }, []);

  // Monitora mudanças para ativar o botão de salvar
  useEffect(() => {
    if (!user) return;
    const changed = name !== user.name || phone !== (user.phone || '') || address !== (user.address || '');
    setHasChanges(changed);
  }, [name, phone, address, user]);

  const handleUpdateProfile = async (dataOverride = {}) => {
    setLoading(true);
    try {
      const payload = { name, phone, address, ...dataOverride };
      const updatedUser = await userService.updateProfile(payload);
      
      setUser(updatedUser);
      await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
      setHasChanges(false);
      
      if (dataOverride.hasOwnProperty('isProvider')) {
        Alert.alert("Parabéns!", "Agora você é um provedor oficial da plataforma.");
      } else {
        Alert.alert("Sucesso", "Dados atualizados!");
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      Alert.alert("Erro", "Não foi possível sincronizar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeProvider = () => {
    Alert.alert(
      "Seja um Provedor", 
      "Ao confirmar, você poderá cadastrar suas máquinas e oferecer serviços no Salobrinho. Continuar?",
      [
        { text: "Agora não", style: "cancel" },
        { text: "Sim, quero ser provedor", onPress: () => handleUpdateProfile({ isProvider: true }) }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Sair", 
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          await GoogleSignin.signOut();
          router.replace('/');
        }
      }
    ]);
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={100} color="#E2E8F0" />
            )}
            <TouchableOpacity style={styles.editPhotoBadge}>
              <MaterialCommunityIcons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.roleText}>{user?.isProvider ? 'PERFIL PROVEDOR' : 'PERFIL CLIENTE'}</Text>
        </View>

        {/* Formulário de Edição */}
        <View style={styles.form}>
          <Text style={styles.inputLabel}>Nome</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.inputLabel}>Telefone</Text>
          <TextInput 
            style={styles.input} 
            value={phone} 
            onChangeText={setPhone} 
            placeholder="Ex: 73 99999-9999"
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>Endereço</Text>
          <TextInput 
            style={[styles.input, { height: 70 }]} 
            value={address} 
            onChangeText={setAddress} 
            placeholder="Sua rua, número e ponto de referência"
            multiline
          />

          {hasChanges && (
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => handleUpdateProfile()}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        {/* Ações de Provedor */}
        {user?.isProvider ? (
          <TouchableOpacity 
            style={styles.manageButton} 
            onPress={() => router.push('/machines/manage')}
          >
            <MaterialCommunityIcons name="cog-outline" size={24} color="white" />
            <Text style={styles.manageButtonText}>Gerenciar Minhas Máquinas</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.providerBanner} 
            activeOpacity={0.9}
            onPress={handleBecomeProvider}
            disabled={loading}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.providerTitle}>Ganhe dinheiro com sua máquina!</Text>
              <Text style={styles.providerSub}>Cadastre sua máquina e seja um provedor.</Text>
            </View>
            <MaterialCommunityIcons name="arrow-right-circle" size={32} color="white" />
          </TouchableOpacity>
        )}

        {/* Botão de Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginVertical: 25 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#4CC9F0' },
  editPhotoBadge: { 
    position: 'absolute', bottom: 0, right: 0, 
    backgroundColor: '#0A1D47', padding: 8, borderRadius: 20,
    borderWidth: 2, borderColor: 'white'
  },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#0A1D47', marginTop: 15 },
  roleText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginTop: 4, letterSpacing: 1 },

  form: { marginTop: 10 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#0A1D47', marginBottom: 6, marginLeft: 4 },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  saveButton: { backgroundColor: '#10b981', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },

  manageButton: {
    backgroundColor: '#0A1D47',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  manageButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },

  providerBanner: {
    backgroundColor: '#0A1D47', 
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  providerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  providerSub: { color: '#94a3b8', fontSize: 13, marginTop: 4 },

  logoutButton: { 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    marginTop: 40, paddingBottom: 20
  },
  logoutText: { color: '#EF4444', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});