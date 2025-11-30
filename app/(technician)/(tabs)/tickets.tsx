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
import TicketDetailsTechnician from '../tickets/TicketDetailsTechnician';

// Interface estendida para incluir dados do building
interface ServiceRequestWithBuilding extends ServiceRequest {
  buildings?: {
    id: string;
    name: string;
  };
  units?: {
    unit_number: string;
  };
  building_id?: string;
}

interface BuildingOption {
  id: string;
  name: string;
}

export default function TechnicianTicketsScreen() {
  const { user } = useAuth();
  const searchParams = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<ServiceRequestWithBuilding[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<ServiceRequest | null>(null);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);

  console.log('🎯 TechnicianTicketsScreen rendered, user:', user?.id, 'tickets count:', tickets.length);

  // Opções de filtro
  const filterOptions = [
    { key: 'all', label: 'Todos', icon: 'list' },
    { key: 'assigned', label: 'Atribuídos', icon: 'user' },
    { key: 'in_progress', label: 'Em Progresso', icon: 'clock-o' },
    { key: 'completed', label: 'Concluídos', icon: 'check-circle' }
  ];

  // useEffect para definir o filtro inicial baseado no parâmetro da rota
  useEffect(() => {
    if (searchParams.initialFilter) {
      setFilter(String(searchParams.initialFilter));
      setLoading(true);
    }
  }, [searchParams.initialFilter]);

  // Busca de tickets atribuídos ao técnico
  const fetchTickets = async () => {
    try {
      if (!user?.id) {
        console.log('⚠️ No user ID available');
        return;
      }

      console.log('🔍 Fetching tickets for technician:', user.id);

      // Primeiro, testar se há tickets no banco (debug)
      const { data: testData, error: testError } = await supabase
        .from('service_requests')
        .select('id, assigned_to, status')
        .limit(5);
      
      console.log('🧪 Test query (first 5 tickets):', testData);
      if (testError) console.error('🧪 Test query error:', testError);

      // Primeiro, buscar todos os tickets para obter a lista de buildings
      const { data: allTicketsData, error: allTicketsError } = await supabase
        .from('service_requests')
        .select(`
          *,
          buildings(id, name),
          units(unit_number)
        `)
        .eq('assigned_to', user.id);

      if (allTicketsError) {
        console.error('❌ Error fetching all tickets:', allTicketsError);
        throw allTicketsError;
      }

      console.log('📦 All tickets data:', allTicketsData?.length || 0, 'tickets found');
      if (allTicketsData && allTicketsData.length > 0) {
        console.log('📋 Sample ticket:', JSON.stringify(allTicketsData[0], null, 2));
      }

      // Buscar buildings únicos de TODOS os tickets (não apenas dos filtrados)
      const uniqueBuildings = new Map<string, BuildingOption>();
      const buildingIdsToFetch = new Set<string>();
      
      (allTicketsData || []).forEach((ticket: any) => {
        if (ticket.buildings && ticket.buildings.id) {
          uniqueBuildings.set(ticket.buildings.id, {
            id: ticket.buildings.id,
            name: ticket.buildings.name,
          });
        } else if (ticket.building_id) {
          // Se o building não foi carregado via relacionamento, adicionar à lista para buscar
          buildingIdsToFetch.add(ticket.building_id);
        }
      });

      // Se houver buildings que não foram carregados via relacionamento, buscar separadamente
      if (buildingIdsToFetch.size > 0) {
        console.log('🔍 Fetching buildings separately:', Array.from(buildingIdsToFetch));
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, name')
          .in('id', Array.from(buildingIdsToFetch));

        if (!buildingsError && buildingsData) {
          buildingsData.forEach((building: any) => {
            uniqueBuildings.set(building.id, {
              id: building.id,
              name: building.name,
            });
          });
        }
      }

      setBuildings(Array.from(uniqueBuildings.values()));
      console.log('🏢 Buildings found:', uniqueBuildings.size);

      // Agora buscar tickets com filtros aplicados
      let query = supabase
        .from('service_requests')
        .select(`
          *,
          buildings(id, name),
          units(unit_number)
        `)
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      // Aplicar filtro de status se não for 'all'
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Aplicar filtro de building se selecionado
      if (selectedBuildingId) {
        query = query.eq('building_id', selectedBuildingId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching filtered tickets:', error);
        throw error;
      }

      console.log('✅ Filtered tickets data:', data?.length || 0, 'tickets');

      // Se algum ticket não tem building carregado, buscar separadamente
      const ticketsNeedingBuildings = (data || []).filter((t: any) => !t.buildings && t.building_id);
      if (ticketsNeedingBuildings.length > 0) {
        const missingBuildingIds = [...new Set(ticketsNeedingBuildings.map((t: any) => t.building_id))];
        const { data: missingBuildings } = await supabase
          .from('buildings')
          .select('id, name')
          .in('id', missingBuildingIds);

        if (missingBuildings) {
          const buildingMap = new Map(missingBuildings.map((b: any) => [b.id, b]));
          (data || []).forEach((ticket: any) => {
            if (!ticket.buildings && ticket.building_id && buildingMap.has(ticket.building_id)) {
              ticket.buildings = buildingMap.get(ticket.building_id);
            }
          });
        }
      }

      // Mapear os dados do banco (snake_case) para o formato esperado (camelCase)
      const ticketsData: ServiceRequestWithBuilding[] = (data || []).map((ticket: any) => ({
        id: ticket.id,
        unitId: ticket.unit_id || ticket.unitId,
        residentId: ticket.resident_id || ticket.residentId,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        images: ticket.images,
        createdAt: ticket.created_at || ticket.createdAt,
        updatedAt: ticket.updated_at || ticket.updatedAt,
        completedAt: ticket.completed_at || ticket.completedAt,
        buildings: ticket.buildings,
        units: ticket.units,
        building_id: ticket.building_id,
      }));

      // Ordenar tickets: ticket atual em destaque no topo
      const sortedTickets = [...ticketsData].sort((a, b) => {
        if (currentTicketId) {
          if (a.id === currentTicketId) return -1;
          if (b.id === currentTicketId) return 1;
        }
        return 0;
      });

      console.log('📋 Final tickets count:', sortedTickets.length);
      setTickets(sortedTickets);
    } catch (err) {
      console.error('❌ Error fetching tickets:', err);
      setTickets([]);
      setBuildings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carrega tickets quando a tela monta ou quando o user muda
  useEffect(() => {
    console.log('🔄 useEffect [user?.id] triggered, user:', user?.id, 'loading:', loading);
    if (user?.id) {
      console.log('✅ User ID available, calling fetchTickets');
      setLoading(true);
      fetchTickets();
    } else {
      console.log('⚠️ No user ID, skipping fetchTickets');
    }
  }, [user?.id]);

  // Atualizar tickets ao trocar filtros
  useEffect(() => {
    console.log('🔄 useEffect [filter, selectedBuildingId] triggered, filter:', filter, 'building:', selectedBuildingId);
    if (user?.id && filter) {
      console.log('✅ Filter changed, calling fetchTickets');
      fetchTickets();
    } else {
      console.log('⚠️ Conditions not met for fetchTickets');
    }
  }, [filter, selectedBuildingId, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      assigned: 'Atribuída',
      in_progress: 'Em Progresso',
      completed: 'Concluída'
    };
    return labels[status] || status;
  };

  // Renderiza os botões de filtro de status
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
              size={14}
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

  // Renderiza os botões de filtro de construção
  const renderBuildingFilters = () => {
    if (buildings.length === 0) return null;

    return (
      <View style={filterStyles.buildingContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={filterStyles.scrollContainer}
        >
          <TouchableOpacity
            style={[
              filterStyles.buildingButton,
              selectedBuildingId === null && filterStyles.activeBuildingButton,
            ]}
            onPress={() => setSelectedBuildingId(null)}
          >
            <FontAwesome
              name="building"
              size={14}
              color={selectedBuildingId === null ? colors.white : colors.primary}
              style={filterStyles.filterIcon}
            />
            <Text
              style={[
                filterStyles.filterText,
                selectedBuildingId === null && filterStyles.activeFilterText,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>
          {buildings.map((building) => (
            <TouchableOpacity
              key={building.id}
              style={[
                filterStyles.buildingButton,
                selectedBuildingId === building.id && filterStyles.activeBuildingButton,
              ]}
              onPress={() => setSelectedBuildingId(building.id)}
            >
              <FontAwesome
                name="building"
                size={14}
                color={selectedBuildingId === building.id ? colors.white : colors.primary}
                style={filterStyles.filterIcon}
              />
              <Text
                style={[
                  filterStyles.filterText,
                  selectedBuildingId === building.id && filterStyles.activeFilterText,
                ]}
                numberOfLines={1}
              >
                {building.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Renderiza um ticket na lista
  const renderTicketItem = ({ item }: { item: ServiceRequestWithBuilding }) => {
    const statusColor = statusColors[item.status] || colors.textSecondary;
    const isCurrentTicket = currentTicketId === item.id;
    
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedTicket(item);
          setCurrentTicketId(item.id);
        }}
        style={[
          styles.card, 
          { 
            flex: 1, 
            marginBottom: 12,
            ...(isCurrentTicket && {
              borderWidth: 2,
              borderColor: colors.primary,
              backgroundColor: colors.primary + '08',
            }),
          }
        ]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                {item.title}
              </Text>
              {isCurrentTicket && (
                <View style={[styles.badge, { backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2 }]}>
                  <Text style={[styles.badgeText, { color: colors.white, fontSize: 10 }]}>
                    Atual
                  </Text>
                </View>
              )}
            </View>
            {/* Mostrar nome do building e unidade */}
            {item.buildings && (
              <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>
                🏢 {item.buildings.name}
                {item.units && ` - Unidade ${item.units.unit_number}`}
              </Text>
            )}
          </View>
          <FontAwesome name="chevron-right" size={16} color={colors.textSecondary} />
        </View>

        <Text
          style={{
            marginTop: 8,
            color: colors.textSecondary,
          }}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={[styles.badgeText, { color: colors.white }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {selectedTicket ? (
        <TicketDetailsTechnician
          ticket={selectedTicket}
          onClose={() => {
            setSelectedTicket(null);
            // Manter o ticket atual em destaque
            if (selectedTicket.id) {
              setCurrentTicketId(selectedTicket.id);
            }
          }}
          onStatusChange={() => {
            fetchTickets();
            // Manter o ticket atual em destaque após atualização
            if (selectedTicket.id) {
              setCurrentTicketId(selectedTicket.id);
            }
          }}
        />
      ) : (
        <>
          {/* Filtros de Status */}
          {renderFilterButtons()}
          
          {/* Filtros de Construção */}
          {renderBuildingFilters()}

          {loading ? (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : tickets.length === 0 ? (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
              <FontAwesome name="inbox" size={64} color={colors.textSecondary} />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 18,
                  color: colors.text,
                  textAlign: 'center',
                  fontWeight: '600',
                }}
              >
                Nenhum ticket encontrado
              </Text>
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {filter === 'all'
                  ? 'Você não possui tickets atribuídos'
                  : `Não há tickets com status "${getStatusLabel(filter)}"`}
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
  buildingContainer: {
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
  },
  buildingButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    maxWidth: 200,
  },
  activeBuildingButton: {
    backgroundColor: colors.primary,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  activeFilterText: {
    color: colors.white,
  },
};

