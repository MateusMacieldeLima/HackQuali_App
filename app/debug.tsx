import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { styles } from '../src/styles/authStyles';

export default function DebugScreen() {
  const [status, setStatus] = useState<string>('Testando...');
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<string>('');
  const [logsTab, setLogsTab] = useState<'info' | 'logs'>('info');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setLoading(true);
      setStatus('Coletando informações...');
      
      let detailsText = '';
      
      // ============ DEVICE & PLATFORM INFO ============
      detailsText += '📱 DISPOSITIVO E PLATAFORMA\n';
      detailsText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      detailsText += `Plataforma: ${Platform.OS.toUpperCase()}\n`;
      detailsText += `Sistema Operacional: ${Platform.Version}\n`;
      detailsText += `App Version: ${Constants.expoConfig?.version || 'N/A'}\n`;
      
      if (Platform.OS === 'web') {
        detailsText += `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'N/A'}...\n`;
      }
      detailsText += `\n`;

      // ============ CONFIGURATION CHECK ============
      detailsText += '⚙️ CONFIGURAÇÃO\n';
      detailsText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      
      const extras = Constants.expoConfig?.extra || {};
      const urlFromExtras = extras.EXPO_PUBLIC_SUPABASE_URL;
      const keyFromExtras = extras.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      detailsText += `📦 Constants.expoConfig.extra:\n`;
      detailsText += `  URL: ${urlFromExtras ? '✅' : '❌'}\n`;
      if (urlFromExtras) detailsText += `       ${urlFromExtras}\n`;
      detailsText += `  Key: ${keyFromExtras ? '✅ configurada' : '❌ não encontrada'}\n`;
      
      const urlFromEnv = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const keyFromEnv = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      detailsText += `🌍 process.env:\n`;
      detailsText += `  URL: ${urlFromEnv ? '✅' : '❌'}\n`;
      if (urlFromEnv) detailsText += `       ${urlFromEnv}\n`;
      detailsText += `  Key: ${keyFromEnv ? '✅ configurada' : '❌ não encontrada'}\n`;
      detailsText += `\n`;

      // ============ SUPABASE CONNECTION TEST ============
      detailsText += '🔗 CONEXÃO SUPABASE\n';
      detailsText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          detailsText += `Status: ❌ ERRO\n`;
          detailsText += `Mensagem: ${error.message}\n`;
          setStatus('❌ Erro na conexão');
        } else {
          detailsText += `Status: ✅ CONECTADO\n`;
          detailsText += `Sessão: ${data.session ? 'Ativa' : 'Inativa'}\n`;
          if (data.session?.user) {
            detailsText += `Usuário: ${data.session.user.email}\n`;
            detailsText += `ID: ${data.session.user.id}\n`;
          }
          setStatus('✅ Tudo funcionando!');
        }
      } catch (connectionErr) {
        const msg = connectionErr instanceof Error ? connectionErr.message : 'Erro desconhecido';
        detailsText += `Status: ❌ FALHA NA CONEXÃO\n`;
        detailsText += `Erro: ${msg}\n`;
        setStatus('❌ Erro ao conectar');
      }
      detailsText += `\n`;

      // ============ NETWORK STATUS ============
      if (Platform.OS === 'web') {
        detailsText += `📡 REDE (WEB)\n`;
        detailsText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        detailsText += `Online: ${typeof navigator !== 'undefined' && navigator.onLine ? '✅' : '❌'}\n`;
        detailsText += `\n`;
      }

      setDetails(detailsText);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setStatus('❌ Erro ao testar');
      setDetails(`Erro: ${message}`);
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(details);
      Alert.alert('Copiado', 'Informações de debug copiadas para a área de transferência');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🐛 Debug</Text>
        <Text style={styles.subtitle}>Teste de Configuração</Text>

        <View style={styles.formContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#0066CC" />
          ) : (
            <>
              <Text style={[styles.label, { fontSize: 16, marginBottom: 15, color: status.includes('✅') ? '#28a745' : '#dc3545' }]}>
                {status}
              </Text>
              <Text style={debugStyles.details}>{details}</Text>
              
              <View style={debugStyles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, { flex: 1, marginRight: 8 }]}
                  onPress={testConnection}
                >
                  <Text style={styles.buttonText}>🔄 Testar Novamente</Text>
                </TouchableOpacity>
                
                {Platform.OS === 'web' && (
                  <TouchableOpacity
                    style={[styles.button, { flex: 1 }]}
                    onPress={copyToClipboard}
                  >
                    <Text style={styles.buttonText}>📋 Copiar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={debugStyles.infoBox}>
                <Text style={debugStyles.infoText}>
                  💡 Dica: Esta página mostra informações de configuração e diagnóstico. Use para verificar se todas as variáveis de ambiente estão carregadas corretamente.
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const debugStyles = StyleSheet.create({
  details: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier New',
    fontSize: 11,
    color: '#333',
    lineHeight: 18,
    marginVertical: 12,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  infoBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#e7f3ff',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  infoText: {
    fontSize: 12,
    color: '#0066CC',
    lineHeight: 16,
  },
});
