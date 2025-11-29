import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { styles } from '../../src/styles/authStyles';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tapCount, setTapCount] = useState(0);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      await login(email, password);
      router.push('/');
      // Navigation will be handled by AuthContext
    } catch (err) {
      Alert.alert('Erro de Login', error || 'Falha ao realizar login');
    }
  };

  const handleTestTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    if (newCount >= 5) {
      setTapCount(0);
      router.push('/auth-test');
    }
  };
  const localStyles = StyleSheet.create({
    titleOverride: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ff9625ff',
      marginBottom: 8,
      textAlign: 'center',
    },

    subtiltleOverride: {
    fontSize: 14,
    color: "#ffffffff",
    marginBottom: 24,
    textAlign: 'center',
  },
    buttonOverride: {
      backgroundColor: '#ff9625ff',
    },
    buttonTextOverride: {
      color: '#ffffffff',
    },
  });

  return (
    <ImageBackground
      source={require('../../assets/images/login.avif')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.content}>
        <TouchableOpacity onPress={handleTestTap}>
          <Text style={localStyles.titleOverride}>HackQuali</Text>
        </TouchableOpacity>
        <Text style={localStyles.subtiltleOverride}>Assistência Técnica Pós-Obra</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.button,
              localStyles.buttonOverride,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.buttonText, localStyles.buttonTextOverride]}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.link}>
              Não tem conta? <Text style={styles.linkBold}>Criar conta</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </ImageBackground>
  );
}
