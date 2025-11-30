import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';

export default function ResidentHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    openRequests: 0,
    completedRequests: 0,
    pendingRatings: 0,
  });

  const fetchStats = async () => {
    try {
      if (!user?.id) return;

      // Fetch open requests
      const { count: openCount } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('residentId', user.id)
        .eq('status', 'open');

      // Fetch completed requests
      const { count: completedCount } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('residentId', user.id)
        .eq('status', 'completed');

      // Fetch pending ratings
      const { count: pendingCount } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('residentId', user.id)
        .eq('status', 'completed')
        .not('id', 'in', '(select serviceRequestId from service_ratings)');

      setStats({
        openRequests: openCount || 0,
        completedRequests: completedCount || 0,
        pendingRatings: pendingCount || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bem-vindo, {user?.name.split(' ')[0]}!</Text>
        <Text style={styles.headerSubtitle}>
          Gerencie suas solicitações de manutenção
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <View style={[styles.card, { borderWidth: 1, borderColor: colors.warning }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <FontAwesome name="exclamation-circle" size={20} color={colors.warning} />
            <Text style={{ marginLeft: 12, fontSize: 14, color: colors.textSecondary }}>
              Solicitações Abertas
            </Text>
          </View>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text }}>
            {stats.openRequests}
          </Text>
        </View>
        
        <View style={[
            styles.card,
            {
              borderColor: colors.processing,
              borderWidth: 1.5,
            },
          ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <FontAwesome name="spinner" size={20} color={colors.processing} />
            <Text style={{ marginLeft: 12, fontSize: 14, color: colors.textSecondary }}>
              Solicitações Pendentes
            </Text>
          </View>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text }}>
            {stats.pendingRatings}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              borderColor: colors.success,
              borderWidth: 1.5,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <FontAwesome name="check-circle" size={20} color={colors.success} />
            <Text style={{ marginLeft: 12, fontSize: 14, color: colors.textSecondary }}>
              Solicitações Concluídas
            </Text>
          </View>

          <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text }}>
            {stats.completedRequests}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.text }}>
          Ações Rápidas
        </Text>

        <TouchableOpacity
          style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => router.push('/(resident)/(tabs)/requests/new')}
        >
          <FontAwesome name="plus-circle" size={24} color={colors.primary} />
          <Text style={{ marginLeft: 12, fontSize: 14, fontWeight: '600', color: colors.text }}>
            Nova Solicitação
          </Text>
          <FontAwesome
            name="chevron-right"
            size={16}
            color={colors.textSecondary}
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => router.push('/(resident)/(tabs)/requests')}
        >
          <FontAwesome name="list" size={24} color={colors.primary} />
          <Text style={{ marginLeft: 12, fontSize: 14, fontWeight: '600', color: colors.text }}>
            Ver Solicitações
          </Text>
          <FontAwesome
            name="chevron-right"
            size={16}
            color={colors.textSecondary}
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
