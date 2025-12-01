import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { styles } from '../../src/styles/authStyles';
import { supabase } from '../../src/supabase';
import { UserRole } from '../../src/types';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('resident');
  const [unitCode, setUnitCode] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não correspondem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Se for resident, validar código da unidade
    if (role === 'resident' && !unitCode.trim()) {
      Alert.alert('Erro', 'Por favor, insira o código da unidade');
      return;
    }

    try {
      await signUp(email, password, role, name);
      
      // Se for resident, vincular unidade
      if (role === 'resident' && unitCode.trim()) {
        try {
          const upperCode = unitCode.toUpperCase();
          
          // Buscar unidade pelo código (tentar code primeiro, depois unit_code)
          let { data: unit, error: unitError } = await supabase
            .from('units')
            .select('id, building_id, resident_id')
            .eq('code', upperCode)
            .single();

          // Se não encontrou com 'code', tentar com 'unit_code'
          if (unitError || !unit) {
            const { data: unitData, error: unitDataError } = await supabase
              .from('units')
              .select('id, building_id, resident_id')
              .eq('unit_code', upperCode)
              .single();
            
            if (unitData) {
              unit = unitData;
              unitError = null;
            } else {
              unitError = unitDataError;
            }
          }

          if (unitError || !unit) {
            Alert.alert('Erro', 'Código de unidade inválido. Verifique e tente novamente.');
            return;
          }

          // Buscar o ID do usuário recém-criado
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            Alert.alert('Erro', 'Não foi possível obter informações do usuário');
            return;
          }

          // Verificar se a unidade já está vinculada a outro residente
          if (unit.resident_id) {
            Alert.alert('Erro', 'Esta unidade já está vinculada a outro morador.');
            return;
          }

          // Atualizar a unidade com o ID do residente
          const { error: updateError } = await supabase
            .from('units')
            .update({
              resident_id: session.user.id,
            })
            .eq('id', unit.id);

          if (updateError) {
            console.error('Erro ao vincular unidade:', updateError);
            Alert.alert('Aviso', 'Conta criada, mas não foi possível vincular a unidade. Você pode vincular depois.');
          } else {
            Alert.alert('Sucesso', 'Conta criada e unidade vinculada com sucesso!');
          }
        } catch (linkError) {
          console.error('Erro ao vincular unidade:', linkError);
          Alert.alert('Aviso', 'Conta criada, mas não foi possível vincular a unidade. Você pode vincular depois.');
        }
      }

      // Redirect based on role
      router.replace('/');
    } catch (err) {
      Alert.alert('Erro de Registro', error || 'Falha ao criar conta');
    }
  };

  const pickerStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    option: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#E0E0E0',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
    },
    optionSelected: {
      borderColor: '#ff9625',
      backgroundColor: '#cdeaffff',
    },
    optionText: {
      fontSize: 14,
      color: '#666666',
      fontWeight: '500',
    },
    optionTextSelected: {
      color: '#ff9625',
      fontWeight: '600',
    },
  });

  const localStyles = StyleSheet.create({
    titleOverride: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ff9625',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitleOverride: {
      fontSize: 14,
      color: '#ffffff',
      marginBottom: 24,
      textAlign: 'center',
    },
    buttonOverride: {
      backgroundColor: '#ff9625',
    },
    buttonTextOverride: {
      color: '#ffffff',
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
        <Text style={localStyles.titleOverride}>Criar Conta</Text>
        <Text style={localStyles.subtitleOverride}>HackQuali</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome completo"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

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

          <Text style={styles.label}>Tipo de Conta</Text>
          <View style={pickerStyles.container}>
            <TouchableOpacity
              style={[
                pickerStyles.option,
                role === 'resident' && pickerStyles.optionSelected,
              ]}
              onPress={() => setRole('resident')}
              disabled={loading}
            >
              <Text
                style={[
                  pickerStyles.optionText,
                  role === 'resident' && pickerStyles.optionTextSelected,
                ]}
              >
                Morador
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                pickerStyles.option,
                role === 'contractor' && pickerStyles.optionSelected,
              ]}
              onPress={() => setRole('contractor')}
              disabled={loading}
            >
              <Text
                style={[
                  pickerStyles.optionText,
                  role === 'contractor' && pickerStyles.optionTextSelected,
                ]}
              >
                Construtora
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                pickerStyles.option,
                role === 'technician' && pickerStyles.optionSelected,
              ]}
              onPress={() => setRole('technician')}
              disabled={loading}
            >
              <Text
                style={[
                  pickerStyles.optionText,
                  role === 'technician' && pickerStyles.optionTextSelected,
                ]}
              >
                Técnico
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Text style={styles.label}>Confirmar Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          {role === 'resident' && (
            <>
              <Text style={styles.label}>Código da Unidade</Text>
              <Text style={{ fontSize: 12, color: '#ffffff', marginBottom: 8 }}>
                Você recebeu este código ao realizar a compra. Procure na documentação do seu imóvel.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: ABC123XYZ"
                value={unitCode}
                onChangeText={setUnitCode}
                autoCapitalize="characters"
                editable={!loading}
              />
            </>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              localStyles.buttonOverride,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.buttonText, localStyles.buttonTextOverride]}>Criar Conta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.link}>
              Já tem conta? <Text style={styles.linkBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </ImageBackground>
  );
}
