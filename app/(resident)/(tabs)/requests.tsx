import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/supabase';
import { ServiceRequest } from '../../../src/types';

export default function RequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  const fetchRequests = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
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

  const getStatusColor = (status: string) => {
    const map: { [key: string]: string } = {
      open: '#3b82f6',        // azul
      assigned: '#0ea5e9',    // azul claro
      in_progress: '#f59e0b', // âmbar
      completed: '#10b981',   // verde
      closed: '#6b7280',      // cinza
      cancelled: '#ef4444',   // vermelho
    };
    return map[status] || '#9ca3af';
  };

  const renderRequestItem = (request: ServiceRequest) => (
    <TouchableOpacity
      key={String(request.id)}
      style={{
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
      }}
      onPress={() => router.push(`/(resident)/(tabs)/requests/${request.id}`)}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#111827' }}>
            {request.title}
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            {(request.description?.substring(0, 60) || 'Sem descrição')}{request.description && request.description.length > 60 ? '...' : ''}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: getStatusColor(request.status),
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            marginLeft: 8,
            alignSelf: 'flex-start',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#ffffff' }}>
            {getStatusLabel(request.status)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: '#6b7280' }}>
          {new Date(request.createdAt).toLocaleDateString()}
        </Text>
        <FontAwesome name="chevron-right" size={14} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#3b82f6',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => router.push('/(resident)/(tabs)/requests/new')}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
            + Nova Solicitação
          </Text>
        </TouchableOpacity>
      </View>

      {requests.length > 0 ? (
        <FlatList
          data={requests}
          renderItem={({ item }) => renderRequestItem(item)}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
          <FontAwesome name="inbox" size={48} color="#6b7280" />
          <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: '#111827' }}>
            Nenhuma solicitação
          </Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            Crie sua primeira solicitação de manutenção
          </Text>
        </View>
      )}
    </View>
  );
}