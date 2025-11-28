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

  const renderTicketItem = (ticket: ServiceRequest) => (
    <TouchableOpacity key={String(ticket.id)}>
      <View>
        <View>
          <Text>
            {ticket.title}
          </Text>
          <Text>
            {ticket.description ? `${ticket.description.substring(0, 60)}...` : ''}
          </Text>
        </View>

        <View>
          <Text>
            {getStatusLabel(ticket.status)}
          </Text>
        </View>
      </View>

      <View>
        <Text>
          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View>
      {/* Botões de Filtro */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filterButtons.map((btn) => (
          <TouchableOpacity key={btn.value} onPress={() => setFilter(btn.value)}>
            <Text>
              {btn.label} {filter === btn.value ? '(selecionado)' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Chamados */}
      {tickets.length > 0 ? (
        <FlatList
          data={tickets}
          renderItem={({ item }) => renderTicketItem(item)}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View>
          <Text>Nenhum chamado</Text>
          <Text>Não há chamados com esse filtro</Text>
        </View>
      )}
    </View>
  );
}