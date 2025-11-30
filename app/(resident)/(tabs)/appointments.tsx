import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View
} from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/supabase';
import { Appointment } from '../../../src/types';
import { colors, styles } from '../../../src/styles/authStyles';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('scheduling')
        .select(
          `
          *,
          service_requests(requester_id)
        `
        )
        .eq('service_requests.requester_id', user.id)
        .order('scheduled_start', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const formatDate = (date: string, time: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString('pt-BR')} às ${time}`;
  };

  const renderAppointmentItem = (appointment: Appointment) => (
    <View
      key={appointment.id}
      style={{
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB', // cinza claro
        backgroundColor: '#FFFFFF'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <FontAwesome name="calendar" size={16} color="#2563EB" />
        <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#111827' }}>
          {formatDate(appointment.scheduledDate, appointment.scheduledTime)}
        </Text>
      </View>

      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
        Duração: {appointment.duration} minutos
      </Text>

      {!!appointment.notes && (
        <Text style={{ fontSize: 12, color: '#6B7280' }}>
          Notas: {appointment.notes}
        </Text>
      )}

      <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: appointment.status === 'confirmed' ? '#16A34A' : '#6B7280'
          }}
        >
          Status: {appointment.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {appointments.length > 0 ? (
        <FlatList
          data={appointments}
          renderItem={({ item }) => renderAppointmentItem(item)}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
          <FontAwesome name="calendar-o" size={48} color="#6B7280" />
          <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: '#111827' }}>
            Nenhum agendamento
          </Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>
            Seus agendamentos aparecerão aqui
          </Text>
        </View>
      )}
    </View>
  );
}