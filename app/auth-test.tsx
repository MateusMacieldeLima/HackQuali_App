import Constants from 'expo-constants';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { styles } from '../src/styles/authStyles';

export default function AuthTestScreen() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('test123456');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testConnection = async () => {
    setLoading(true);
    setResult('Testando conexão com Supabase...');

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setResult(`❌ Erro ao obter sessão:\n${sessionError.message}`);
        setLoading(false);
        return;
      }
      setResult('✅ Sessão obtida com sucesso\n\n');

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Erro de signin:', signInError);
        setResult(
          prev =>
            prev +
            `❌ Erro ao fazer login:\n` +
            `Status: ${signInError.status}\n` +
            `Mensagem: ${signInError.message}\n\n` +
            `💡 Dica: Se for "Email not confirmed":\n` +
            `   1. Desabilite email confirmation no Supabase\n` +
            `   2. OU confirme seu email e tente novamente\n` +
            `   3. OU use o botão "Reenviar Email"`
        );
        setLoading(false);
        return;
      }

      setResult(
        prev =>
          prev +
          `✅ Login bem-sucedido!\n` +
          `Usuário: ${signInData.user?.email}\n` +
          `ID: ${signInData.user?.id}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setResult(prev => prev + `\n❌ Erro: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignUp = async () => {
    setLoading(true);
    setResult('Testando criação de conta...');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'resident',
            name: email.split('@')[0],
          },
        },
      });

      if (error) {
        console.error('❌ Erro de signup:', error);
        setResult(
          `❌ Erro ao criar conta:\n` +
          `Status: ${error.status}\n` +
          `Mensagem: ${error.message}`
        );
        setLoading(false);
        return;
      }

      setResult(
        `✅ Conta criada!\n` +
        `Usuário: ${data.user?.email}\n` +
        `ID: ${data.user?.id}\n\n` +
        `Próximo passo:\n` +
        `Se email confirmation estiver ativado, verifique seu email.\n` +
        `Ou use o botão "Reenviar Email" abaixo.`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setResult(`❌ Erro: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationEmail = async () => {
    setLoading(true);
    setResult('Reenviando email de confirmação...');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        setResult(`❌ Erro ao reenviar:\n${error.message}`);
        setLoading(false);
        return;
      }

      setResult(
        `✅ Email de confirmação reenviado!\n\n` +
        `Verifique seu email: ${email}\n\n` +
        `Clique no link de confirmação e tente fazer login novamente.`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setResult(`❌ Erro: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const testConfig = () => {
    const extras = (Constants.expoConfig && Constants.expoConfig.extra) || {};
    const urlFromExtras = extras.EXPO_PUBLIC_SUPABASE_URL;
    const keyFromExtras = extras.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    setResult(
      `📦 CONFIGURAÇÃO DO SUPABASE:\n\n` +
      `De Constants.expoConfig.extra:\n` +
      `  URL: ${urlFromExtras ? '✅ ' + urlFromExtras : '❌ não encontrado'}\n` +
      `  Key: ${keyFromExtras ? '✅ configurada' : '❌ não encontrada'}\n\n` +
      `De process.env:\n` +
      `  URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅' : '❌'}\n` +
      `  Key: ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🧪 Teste Auth</Text>
        <Text style={styles.subtitle}>Diagnostic Tool</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="test@example.com"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            secureTextEntry
          />

          {loading ? (
            <ActivityIndicator size="large" color="#0066CC" style={{ marginVertical: 20 }} />
          ) : (
            <View style={{ gap: 10 }}>
              <TouchableOpacity style={styles.button} onPress={testConnection}>
                <Text style={styles.buttonText}>🔐 Testar Login</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={testSignUp}>
                <Text style={styles.buttonText}>📝 Testar Sign-up</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={resendConfirmationEmail}>
                <Text style={styles.buttonText}>📧 Reenviar Email</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={testConfig}>
                <Text style={styles.buttonText}>⚙️ Ver Config</Text>
              </TouchableOpacity>
            </View>
          )}

          {result && (
            <View
              style={{
                marginTop: 20,
                padding: 12,
                backgroundColor: '#f0f0f0',
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: '#333',
                  lineHeight: 18,
                }}
              >
                {result}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
