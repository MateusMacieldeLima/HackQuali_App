import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { colors } from '../src/styles/authStyles';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [debugTaps, setDebugTaps] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (user) {
        console.log('User is authenticated:', user);
        console.log('User role:', user.role);
        console.log('User role type:', typeof user.role);
        // Se usuário está autenticado, redirecionar baseado no role
        // Normalizar role (aceitar variações com erro de digitação)
        const normalizedRole = user.role?.toLowerCase().trim();
        
        if (normalizedRole === 'resident') {
          console.log('Redirecting to resident home');
          router.replace('/(resident)/(tabs)/home');
        } else if (normalizedRole === 'contractor') {
          console.log('Redirecting to contractor dashboard');
          router.replace('/(contractor)/(tabs)/dashboard');
        } else if (normalizedRole === 'technician' || normalizedRole === 'tecnician') {
          console.log('Redirecting to technician tickets');
          router.replace('/(technician)/(tabs)/tickets');
        } else {
          console.log('Unknown role, redirecting to login. Role:', user.role);
          router.replace('/(auth)/login');
        }
      } else {
        // Sem autenticação, ir para login
        router.replace('/(auth)/login');
      }
    }
  }, [user, loading]);

  // Easter egg: tap 5 times to access debug
  const handlePress = () => {
    const newTaps = debugTaps + 1;
    setDebugTaps(newTaps);
    if (newTaps >= 5) {
      setShowDebug(true);
      setDebugTaps(0);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={1}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
        {showDebug && (
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity 
              onPress={() => router.push('/debug')}
              style={[styles.debugButton, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Acessar Debug</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
  debugButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
});