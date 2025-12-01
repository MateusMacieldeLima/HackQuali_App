import { FontAwesome } from '@expo/vector-icons';
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
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';
import { Appointment } from '../../../src/types';
import AppointmentDetails from '../appointments/AppointmentDetails';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const ap = item as any;
    const notesStr = String(ap.notes || '');
    const legacyMatch = notesStr.match(/^Nome:\s*(.+)$/m);
    const scheduleName = (ap.schedule_name && String(ap.schedule_name).trim()) || (legacyMatch ? legacyMatch[1].trim() : null) || ap.service_requests?.title || 'Intervenção agendada';

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, { marginBottom: 12 }]}
        onPress={() => setSelectedAppointment(item)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{scheduleName}</Text>
            <Text style={{ marginTop: 6, color: colors.textSecondary }}>
              {formatDateOnly(ap.scheduled_start || ap.scheduledStart || ap.scheduledDate || '')}
            </Text>
            {!!ap.notes && (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                Notas: {String(ap.notes).replace(/^Nome:\s*.*\n?/, '').trim()}
              </Text>
            )}
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: ap.status === 'confirmed' ? colors.success : colors.textSecondary
                }}
              >
                Status: {ap.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
              </Text>
            </View>
          </View>
          <FontAwesome name="chevron-right" size={16} color={colors.textSecondary} style={{ marginLeft: 12 }} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedAppointment ? (
        <AppointmentDetails
          appointment={selectedAppointment as any}
          onClose={() => setSelectedAppointment(null)}
        />
      ) : (
        <>
          {appointments.length > 0 ? (
            <FlatList
              data={appointments}
              renderItem={renderAppointmentItem}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
              <FontAwesome name="calendar-o" size={48} color={colors.textSecondary} />
              <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.text }}>
                Nenhum agendamento
              </Text>
              <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
                Seus agendamentos aparecerão aqui
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}