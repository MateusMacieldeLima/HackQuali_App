import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, styles, statusColors } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';
import { ServiceRequest } from '../../../src/types';

export default function ContractorTicketsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<ServiceRequest[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const fetchTickets = async () => {
    try {
      if (!user?.id) return;

      let query = supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user?.id, filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      open: 'Aberta',
      assigned: 'Atribuída',
      in_progress: 'Em Progresso',
      completed: 'Concluída',
      closed: 'Fechada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  const filterButtons = [
    { label: 'Todos', value: 'all' },
    { label: 'Abertos', value: 'open' },
    { label: 'Em Progresso', value: 'in_progress' },
    { label: 'Concluídos', value: 'completed' },
  ];

  const localStyles = StyleSheet.create({
    filterCard: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.textSecondary,
      backgroundColor: 'transparent',
      minHeight: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterCardActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    filterLabelActive: {
      color: colors.background,
    },
    topFilters: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 6,
      backgroundColor: 'transparent',
    },
  });

  const renderTicketItem = (ticket: ServiceRequest) => {
    const statusColor = statusColors[ticket.status] || colors.textSecondary;

    return (
      <TouchableOpacity key={String(ticket.id)} activeOpacity={0.8} style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ width: 52, height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: statusColor }}>
          <FontAwesome name="inbox" size={22} color={colors.white} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{ticket.title}</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: colors.textSecondary }}>
            {ticket.description ? `${ticket.description.substring(0, 80)}${ticket.description.length > 80 ? '...' : ''}` : ''}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <View style={[styles.badge, { backgroundColor: statusColor }]}> 
              <Text style={[styles.badgeText, { color: colors.white }]}>{getStatusLabel(ticket.status)}</Text>
            </View>

            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botões de Filtro (fixos no topo) */}
      <View style={localStyles.topFilters} pointerEvents="box-none">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {filterButtons.map((btn) => (
            <TouchableOpacity
              key={btn.value}
              onPress={() => setFilter(btn.value)}
              activeOpacity={0.8}
              style={[
                localStyles.filterCard,
                filter === btn.value ? localStyles.filterCardActive : null,
              ]}
            >
              <Text style={[localStyles.filterLabel, filter === btn.value ? localStyles.filterLabelActive : null]}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de Chamados */}
      {tickets.length > 0 ? (
        <FlatList
          data={tickets}
          renderItem={({ item }) => renderTicketItem(item)}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
          <FontAwesome name="inbox" size={64} color={colors.textSecondary} />
          <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.text }}>
            Nenhum chamado
          </Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
            Não há chamados com esse filtro
          </Text>
        </View>
      )}
    </View>
  );
}