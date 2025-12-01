import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';
import ScheduleDetails from '../scheduling/ScheduleDetails';

export default function TechnicianSchedulingList() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      console.log('[TechnicianSchedulingList] fetchSchedules() - starting, user.id=', user.id);

      const { data, error } = await supabase
        .from('scheduling')
        .select('*, service_requests!inner(title, unit_id, building_id)')
        .eq('technician_id', user.id)
        .order('scheduled_start', { ascending: true });

      console.log('[TechnicianSchedulingList] fetchSchedules() - result', { dataLength: data?.length, error });
      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('[TechnicianSchedulingList] Error fetching schedules:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    fetchSchedules();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules();
  };

  const renderItem = ({ item }: { item: any }) => {
    const notesStr = String(item.notes || '');
    const scheduleName = (item.schedule_name && String(item.schedule_name).trim()) || null;
    const legacyMatch = !scheduleName ? notesStr.match(/^Nome:\s*(.+)$/m) : null;
    const finalName = scheduleName || (legacyMatch ? legacyMatch[1].trim() : null);
    const title = finalName || item.service_requests?.title || 'Intervenção agendada';

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, { marginBottom: 12 }]}
        onPress={() => setSelectedSchedule(item)}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{title}</Text>
            <Text style={{ marginTop: 6, color: colors.textSecondary }}>
              {item.scheduled_start ? new Date(item.scheduled_start).toLocaleDateString('pt-BR') : '—'}
            </Text>
            {!!item.notes && (
              <Text style={{ marginTop: 8, color: colors.textSecondary }}>
                Notas: {String(item.notes).replace(/^Nome:\s*.*\n?/, '').trim()}
              </Text>
            )}
          </View>
          <FontAwesome name="chevron-right" size={16} color={colors.textSecondary} />
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
      {selectedSchedule ? (
        <ScheduleDetails
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onScheduleDeleted={() => {
            fetchSchedules();
            setSelectedSchedule(null);
          }}
        />
      ) : (
        <>
          <TouchableOpacity
            onPress={() => {
              console.log('[TechnicianSchedulingList] New button pressed');
              router.push('/(technician)/scheduling/new');
            }}
            style={[styles.button, { margin: 16 }]}
          >
            <Text style={{ color: colors.white, fontWeight: '700' }}>Novo Agendamento</Text>
          </TouchableOpacity>

          {schedules.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <FontAwesome name="calendar-o" size={56} color={colors.textSecondary} />
              <Text style={{ marginTop: 16, color: colors.text }}>Nenhum agendamento encontrado.</Text>
            </View>
          ) : (
            <FlatList
              data={schedules}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={{ padding: 16 }}
            />
          )}
        </>
      )}
    </View>
  );
}