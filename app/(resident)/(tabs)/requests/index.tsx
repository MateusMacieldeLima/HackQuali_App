import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { colors, styles } from '../../../../src/styles/authStyles';
import { supabase } from '../../../../src/supabase';
import { ServiceRequest } from '../../../../src/types';
import RequestDetailsResident from './RequestDetailsResident';
import NewRequestScreen from './new';

export default function RequestsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showNewRequest, setShowNewRequest] = useState(false);

  const fetchRequests = async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      console.log('🔍 Fetching requests for user:', user.id);
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching requests:', error);
        throw error;
      }

      console.log('✅ Requests fetched:', data?.length || 0);
      setRequests(data || []);
    } catch (err) {
      console.error('❌ Error fetching requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user?.id]);

  // Atualizar lista quando a tela receber foco (ex: ao voltar da criação)
  useFocusEffect(
    useCallback(() => {
      if (user?.id && !selectedRequest) {
        console.log('🔄 Screen focused: Refetching requests');
        fetchRequests();
      }
    }, [user?.id, selectedRequest])
  );

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

  const renderRequestItem = ({ item }: { item: ServiceRequest }) => (
    <TouchableOpacity
      onPress={() => setSelectedRequest(item)}
      style={[styles.card, { flex: 1, marginBottom: 12 }]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {item.title}
          </Text>
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
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={[styles.badgeText, { color: '#ffffff' }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
          {new Date((item as any).created_at || item.createdAt).toLocaleDateString('pt-BR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const toggleNewRequest = () => {
    setShowNewRequest(!showNewRequest);
  };

  return (
    <View style={styles.container}>
      {showNewRequest ? (
        <NewRequestScreen
          onClose={toggleNewRequest}
          onRequestCreated={() => {
            toggleNewRequest();
            fetchRequests();
          }}
        />
      ) : selectedRequest ? (
        <RequestDetailsResident
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      ) : (
        <>
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <TouchableOpacity
              onPress={toggleNewRequest}
              style={{
                backgroundColor: colors.primary,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.white, fontWeight: '600', fontSize: 14 }}>
                + Nova Solicitação
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : requests.length > 0 ? (
            <FlatList
              data={requests}
              renderItem={renderRequestItem}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
              <FontAwesome name="inbox" size={48} color={colors.textSecondary} />
              <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.text }}>
                Nenhuma solicitação
              </Text>
              <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
                Crie sua primeira solicitação de manutenção
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

