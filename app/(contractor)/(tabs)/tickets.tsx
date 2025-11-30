import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, statusColors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';
import { ServiceRequest } from '../../../src/types';
import TicketDetails from '../tickets/TicketDetailsContractor';

// Interface estendida para incluir dados do building
interface ServiceRequestWithBuilding extends ServiceRequest {
  buildings?: {
    name: string;
    contractor_id: string;
  };
}

export default function ContractorTicketsScreen() {
  const { user } = useAuth();
  const searchParams = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<ServiceRequestWithBuilding[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<ServiceRequest | null>(null);

  // Opções de filtro
  const filterOptions = [
    { key: 'all', label: 'Todos', icon: 'list' },
    { key: 'open', label: 'Abertos', icon: 'circle-o' },
    { key: 'assigned', label: 'Atribuídos', icon: 'user' },
    { key: 'in_progress', label: 'Em Progresso', icon: 'clock-o' },
    { key: 'completed', label: 'Concluídos', icon: 'check-circle' },
    { key: 'closed', label: 'Fechados', icon: 'times-circle' },
    { key: 'cancelled', label: 'Cancelados', icon: 'ban' },
  ];

  // useEffect para definir o filtro inicial baseado no parâmetro da rota
  useEffect(() => {
    if (searchParams.initialFilter) {
      setFilter(String(searchParams.initialFilter));
      setLoading(true);
    }
  }, [searchParams.initialFilter]);

  // Busca de tickets no Supabase
  const fetchTickets = async () => {
    try {
      if (!user?.id) return;

      // Primeiro, buscar os IDs dos buildings onde o usuário é contractor
      const { data: userBuildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('id')
        .eq('contractor_id', user.id);

      if (buildingsError) throw buildingsError;

      // Se não há buildings para este contractor, retornar lista vazia
      if (!userBuildings || userBuildings.length === 0) {
        setTickets([]);
        return;
      }

      // Extrair os IDs dos buildings
      const buildingIds = userBuildings.map(building => building.id);

      // Buscar tickets dos buildings do contractor
      let query = supabase
        .from('service_requests')
        .select(`
          *,
          buildings!inner(name, contractor_id)
        `)
        .in('building_id', buildingIds)
        .order('created_at', { ascending: false });

      // Aplicar filtro de status se não for 'all'
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar novamente para garantir que apenas tickets dos buildings do contractor sejam exibidos
      const filteredTickets = data?.filter(ticket => 
        ticket.buildings && ticket.buildings.contractor_id === user.id
      ) || [];

      setTickets(filteredTickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carrega tickets quando a tela monta ou quando o user muda
  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchTickets();
    }
  }, [user?.id]);

  // Atualizar tickets ao trocar filtros
  useEffect(() => {
    if (user?.id && filter) {
      fetchTickets();
    }
  }, [filter, user?.id]);

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

  // Renderiza os botões de filtro
  const renderFilterButtons = () => (
    <View style={filterStyles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.scrollContainer}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              filterStyles.filterButton,
              filter === option.key && filterStyles.activeFilterButton,
            ]}
            onPress={() => setFilter(option.key)}
          >
            <FontAwesome
              name={option.icon as any}
              size={16}
              color={filter === option.key ? colors.white : colors.primary}
              style={filterStyles.filterIcon}
            />
            <Text
              style={[
                filterStyles.filterText,
                filter === option.key && filterStyles.activeFilterText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Renderiza um ticket na lista
  const renderTicketItem = ({ item }: { item: ServiceRequestWithBuilding }) => {
    const statusColor = statusColors[item.status] || colors.textSecondary;

    return (
      <TouchableOpacity
        onPress={() => setSelectedTicket(item)}
        style={[styles.card, { flex: 1, marginBottom: 12 }]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
              {item.title}
            </Text>
            {/* Mostrar nome do building */}
            {item.buildings && (
              <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>
                🏢 {item.buildings.name}
              </Text>
            )}
          </View>
          <FontAwesome name="chevron-right" size={16} color={colors.textSecondary} />
        </View>
        
        <Text style={{ 
          marginTop: 8, 
          color: colors.textSecondary
        }}>
          {item.description}
        </Text>
        
        <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={[styles.badgeText, { color: colors.white }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {selectedTicket ? (
        <TicketDetails
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={fetchTickets}
        />
      ) : (
        <>
          {/* Filtros */}
          {renderFilterButtons()}
          
          {loading ? (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : tickets.length === 0 ? (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
              <FontAwesome name="inbox" size={64} color={colors.textSecondary} />
              <Text style={{ 
                marginTop: 16, 
                fontSize: 18, 
                color: colors.text,
                textAlign: 'center',
                fontWeight: '600'
              }}>
                Nenhum chamado encontrado
              </Text>
              <Text style={{ 
                marginTop: 8, 
                fontSize: 14, 
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 20
              }}>
                {filter === 'all' 
                  ? 'Não há chamados para seus empreendimentos'
                  : `Não há chamados com status "${getStatusLabel(filter)}"`
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={tickets}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderTicketItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </View>
  );
}

// Estilos para os filtros
const filterStyles = {
  container: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContainer: {
    paddingRight: 16,
  },
  filterButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  activeFilterText: {
    color: colors.white,
  },
};