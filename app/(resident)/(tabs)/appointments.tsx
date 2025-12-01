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
      // Preferred approach: single query joining service_requests and filtering by requester_id
      try {
        const { data, error } = await supabase
          .from('scheduling')
          .select('*, service_requests(requester_id)')
          .eq('service_requests.requester_id', user.id)
          .order('scheduled_start', { ascending: true });

        if (error) throw error;
        setAppointments(data || []);
        return;
      } catch (joinErr) {
        console.warn('[Appointments] join query failed, falling back to service_requests lookup:', joinErr);
      }

      // Fallback: fetch service_requests for user and extract related scheduling
      const { data: srs, error: srsError } = await supabase
        .from('service_requests')
        .select('id, scheduling(*)')
        .eq('requester_id', user.id);

      if (srsError) throw srsError;

      const fromSRs: any[] = (srs || []).map((sr: any) => sr.scheduling).flat().filter(Boolean);
      // Sort by scheduled_start
      fromSRs.sort((x: any, y: any) => {
        const a = x?.scheduled_start || x?.scheduledStart || '';
        const b = y?.scheduled_start || y?.scheduledStart || '';
        return (a || '').localeCompare(b || '');
      });

      setAppointments(fromSRs || []);
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

  const formatDateOnly = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return iso || '';
    }
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
      {
        (() => {
          const ap = appointment as any;
          const notesStr = String(ap.notes || '');
          const legacyMatch = notesStr.match(/^Nome:\s*(.+)$/m);
          const scheduleName = (ap.schedule_name && String(ap.schedule_name).trim()) || (legacyMatch ? legacyMatch[1].trim() : null) || ap.service_requests?.title || 'Intervenção agendada';

          return (
            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{scheduleName}</Text>
                <FontAwesome name="calendar" size={16} color="#2563EB" />
              </View>
              <Text style={{ marginTop: 6, color: '#6B7280' }}>{formatDateOnly(ap.scheduled_start || ap.scheduledStart || ap.scheduledDate || '')}</Text>
            </View>
          );
        })()
      }

      {/* duração removida - apenas data é exibida conforme novo esquema */}

      {!!appointment.notes && (
        <Text style={{ fontSize: 12, color: '#6B7280' }}>
          Notas: {String(appointment.notes).replace(/^Nome:\s*.*\n?/, '').trim()}
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