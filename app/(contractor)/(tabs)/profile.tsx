import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, styles } from '../../../src/styles/authStyles';

export default function ContractorProfileScreen() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.push('/(auth)/login')
            
}, [signOut, router]);

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <FontAwesome name="building" size={24} color="white" />
        </View>
        <Text style={styles.headerTitle}>{user?.name}</Text>
        <Text style={styles.headerSubtitle}>{user?.email}</Text>
      </View>

      {/* Company Information */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.text }}>
          Informações da Empresa
        </Text>
        <View style={styles.card}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Responsável</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
              {user?.name}
            </Text>
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Email</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
              {user?.email}
            </Text>
          </View>
          {user?.phone && (
            <View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Telefone</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {user.phone}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Logout Button */}
      <View style={{ paddingHorizontal: 16, marginBottom: 40 }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: colors.danger,
            padding: 14,
            borderRadius: 8,
            alignItems: 'center',
            opacity: isLoggingOut || authLoading ? 0.6 : 1,
          }}
          disabled={false}
        >
          {isLoggingOut || authLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
              Desconectar
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
