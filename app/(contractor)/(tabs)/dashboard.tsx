import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';

export default function ContractorDashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    openRequests: 0,
    assignedRequests: 0,
    completedRequests: 0,
    buildings: 0,
    technicians: 0,
    totalCost: 0,
    avgNPS: 0,
  });

  const fetchDashboardStats = async () => {
    try {
      if (!user?.id) return;

      // Fetch contractor's buildings
      const { count: buildingsCount } = await supabase
        .from('buildings')
        .select('*', { count: 'exact', head: true })
        .eq('contractorId', user.id);

      // Fetch total service requests for contractor's buildings
      const { count: totalCount } = await supabase
        .from('service_requests')
        .select(
          `
          *,
          units(buildingId)
        `,
          { count: 'exact', head: true }
        )
        .in(
          'units.buildingId',
          (
            await supabase
              .from('buildings')
              .select('id')
              .eq('contractorId', user.id)
          ).data?.map((b: any) => b.id) || []
        );

      // Fetch open requests
      const { count: openCount } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      // Fetch assigned requests
      const { count: assignedCount } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['assigned', 'in_progress']);

      // Fetch completed requests
      const { count: completedCount } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Fetch technicians count
      const { count: techniciansCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'technician')
        .eq('companyId', user.id);

      setStats({
        totalRequests: totalCount || 0,
        openRequests: openCount || 0,
        assignedRequests: assignedCount || 0,
        completedRequests: completedCount || 0,
        buildings: buildingsCount || 0,
        technicians: techniciansCount || 0,
        totalCost: 0, // Will be calculated from maintenance costs
        avgNPS: 0, // Will be calculated from ratings
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bem-vindo, {user?.name.split(' ')[0]}!</Text>
        <Text style={styles.headerSubtitle}>Painel de controle</Text>
      </View>

      {/* KPI Cards */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <View style={{ marginBottom: 12 }}>
          <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between' }]}>
            <View>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                Total de Solicitações
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>
                {stats.totalRequests}
              </Text>
            </View>
            <FontAwesome name="tasks" size={32} color={colors.primary} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <View
                style={[
                styles.card,
                {
                  borderColor: colors.warning,
                  borderWidth: 1.5,
                },
              ]}>
              <FontAwesome name="clock-o" size={20} color={colors.warning} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 8, color: colors.text }}>
                {stats.openRequests}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                Abertas
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={[
              styles.card,
              {
                borderColor: colors.processing,
                borderWidth: 1.5,
              },
            ]}>
              <FontAwesome name="spinner" size={20} color={colors.processing} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 8, color: colors.text }}>
                {stats.assignedRequests}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                Em andamento
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={[
            styles.card,
            {
              borderColor: colors.success,
              borderWidth: 1.5,
            },
            ]}>
              <FontAwesome name="check-circle" size={20} color={colors.success} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 8, color: colors.text }}>
                {stats.completedRequests}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                Concluídas
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Resources */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.text }}>
          Recursos
        </Text>
        <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-around' }]}>
          <View style={{ alignItems: 'center' }}>
            <FontAwesome name="building" size={24} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 8, color: colors.text }}>
              {stats.buildings}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
              Empreendimentos
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <FontAwesome name="users" size={24} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 8, color: colors.text }}>
              {stats.technicians}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
              Técnicos
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.text }}>
          Ações Rápidas
        </Text>
        <TouchableOpacity style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
          <FontAwesome name="plus-circle" size={20} color={colors.primary} />
          <Text style={{ marginLeft: 12, fontSize: 14, fontWeight: '600', color: colors.text }}>
            Novo Empreendimento
          </Text>
          <FontAwesome
            name="chevron-right"
            size={16}
            color={colors.textSecondary}
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
          <FontAwesome name="tasks" size={20} color={colors.primary} />
          <Text style={{ marginLeft: 12, fontSize: 14, fontWeight: '600', color: colors.text }}>
            Ver Todos os Chamados
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
