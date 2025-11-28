import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { colors, styles } from '../src/styles/authStyles';
import { supabase } from '../src/supabase';
import { BuildingAnalytics } from '../src/types';

export default function ContractorAnalyticsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<BuildingAnalytics[]>([]);

  const fetchAnalytics = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('building_analytics')
        .select('*')
        .order('updatedAt', { ascending: false });

      if (error) throw error;
      setAnalytics(data || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
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
        <Text style={styles.headerTitle}>Relatórios e Analytics</Text>
        <Text style={styles.headerSubtitle}>Métricas por empreendimento</Text>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        {analytics.length > 0 ? (
          analytics.map((stat) => (
            <View key={stat.buildingId} style={styles.card}>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 12, color: colors.text }}>
                Empreendimento ID: {stat.buildingId}
              </Text>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Taxa de conclusão
                </Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>
                  {stat.completedRequests} / {stat.totalRequests}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Tempo médio de resolução
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                  {stat.averageResolutionTime}h
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  NPS (Net Promoter Score)
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: stat.nps > 70 ? colors.success : colors.warning,
                  }}
                >
                  {stat.nps}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Custo total de manutenção
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                  R$ {stat.maintenanceCost.toFixed(2)}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Satisfação média (1-5)
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                    {stat.avgQualityScore.toFixed(1)}
                  </Text>
                  <FontAwesome
                    name="star"
                    size={14}
                    color={colors.warning}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </View>

              {stat.topDefects.length > 0 && (
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                    Principais defetos
                  </Text>
                  {stat.topDefects.slice(0, 3).map((defect, idx) => (
                    <Text
                      key={idx}
                      style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}
                    >
                      • {defect.category}: {defect.count}x
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <FontAwesome name="bar-chart" size={48} color={colors.textSecondary} />
            <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.text }}>
              Nenhum relatório disponível
            </Text>
            <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
              Os dados aparecerão conforme houver atividade
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
