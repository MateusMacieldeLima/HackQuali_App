// Usar campos de texto para data/hora para evitar dependência externa
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';

export default function NewSchedule() {
  const router = useRouter();
  const { user } = useAuth();

  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [dateStr, setDateStr] = useState(''); // formato YYYY-MM-DD
  const [timeStr, setTimeStr] = useState(''); // formato HH:MM (mantido no estado mas não usado)
  const [notes, setNotes] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) fetchTickets();
  }, [user?.id]);

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      // Buscar tickets do technician/empresa — simplificação: tickets atribuídos ou abertos
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .in('status', ['open', 'assigned'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets for scheduling:', err);
      Alert.alert('Erro', 'Não foi possível carregar os chamados.');
    } finally {
      setLoadingTickets(false);
    }
  };

  const submit = async () => {
    // selectedTicket is optional (anexar chamado)
    if (!dateStr) return Alert.alert('Validação', 'Informe a data (YYYY-MM-DD).');

    try {
      setSubmitting(true);

      // Espera dateStr no formato YYYY-MM-DD e timeStr no formato HH:MM
      const scheduledDate = dateStr;
      const scheduledTime = timeStr;

      // If a ticket is attached, default the resident to the ticket requester.
      const residentId = selectedTicket?.requester_id || null;

      // Compose ISO datetime for scheduled_start using date only (time set to 00:00)
      let scheduledStart: string | null = null;
      try {
        const dt = new Date(scheduledDate);
        dt.setHours(0, 0, 0, 0);
        scheduledStart = dt.toISOString();
      } catch (e) {
        scheduledStart = null;
      }

      const payload: any = {
        service_request_id: selectedTicket?.id || null,
        technician_id: user?.id,
        resident_id: residentId,
        // Only send scheduled_start (date only). Do not send time or duration.
        scheduled_start: scheduledStart,
        // scheduled_end is required by DB (NOT NULL) — default to same date (end == start)
        scheduled_end: scheduledStart,
        // send schedule_name separately and keep notes only as user-entered notes
        schedule_name: scheduleName || null,
        notes: notes || null,
        status: 'scheduled',
        created_at: new Date().toISOString(),
      };

      // Before inserting, fetch actual columns of the scheduling table
      // and filter the payload to avoid inserting non-existent columns
      console.log('[NewSchedule] fetching scheduling table columns to filter payload');
      const { data: colsData, error: colsError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'scheduling');

      if (colsError) {
        console.warn('[NewSchedule] could not fetch table columns, proceeding with full payload', colsError);
      }

      let availableCols = Array.isArray(colsData) ? colsData.map((c: any) => String(c.column_name)) : [];
      console.log('[NewSchedule] availableCols=', availableCols);

      // If we couldn't read the schema (RLS or other), avoid inserting unknown columns
      // by falling back to a conservative whitelist of columns we know should exist.
      const fallbackWhitelist = [
        'service_request_id',
        'technician_id',
        'scheduled_start',
        'scheduled_end',
        'notes',
        'status',
        'created_at'
      ];

      if (!availableCols || availableCols.length === 0) {
        console.warn('[NewSchedule] availableCols empty or not fetched — using fallback whitelist to avoid schema errors');
        availableCols = fallbackWhitelist;
      }

      const filteredPayload: any = Object.fromEntries(
        Object.entries(payload).filter(([k]) => availableCols.includes(k))
      );

      console.log('[NewSchedule] inserting filtered payload', filteredPayload);
      const { data, error } = await supabase.from('scheduling').insert([filteredPayload]).select('*').single();
      console.log('[NewSchedule] insert result', { data, error });
      if (error) throw error;

      Alert.alert('Sucesso', 'Agendamento criado com sucesso.');
      // Redireciona para a lista de agendamentos do technician para mostrar o novo registro
      router.replace('/(technician)/scheduling');
    } catch (err) {
      console.error('Error creating schedule:', err);
      Alert.alert('Erro', 'Não foi possível criar o agendamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.white }} contentContainerStyle={{ padding: 16 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
        <FontAwesome name="arrow-left" size={20} color={colors.primary} />
      </TouchableOpacity>

      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Novo Agendamento</Text>

      <Text style={{ marginTop: 8, color: colors.textSecondary }}>Nome do agendamento</Text>
      <TextInput
        value={scheduleName}
        onChangeText={setScheduleName}
        placeholder="Ex: Manutenção elétrica - Unidade 101"
        style={[styles.input, { backgroundColor: colors.white }]}
      />

      <Text style={{ marginTop: 8, color: colors.textSecondary }}>Anexar Chamado (opcional)</Text>
      {loadingTickets ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        tickets.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setSelectedTicket(t)}
            style={[styles.card, { marginTop: 8, backgroundColor: selectedTicket?.id === t.id ? colors.primary : colors.white }]}
          >
            <Text style={{ fontWeight: '600', color: selectedTicket?.id === t.id ? colors.white : colors.text }}>{t.title}</Text>
            <Text style={{ color: selectedTicket?.id === t.id ? colors.white : colors.textSecondary }}>{t.description}</Text>
          </TouchableOpacity>
        ))
      )}

      <Text style={{ marginTop: 12, color: colors.textSecondary }}>Data (YYYY-MM-DD)</Text>
      <TextInput
        value={dateStr}
        onChangeText={setDateStr}
        placeholder="2025-12-31"
        style={[styles.input, { backgroundColor: colors.white }]}
      />

      {/* Hora e duração removidos: apenas a data é usada (scheduled_start) */}

      <Text style={{ marginTop: 12, color: colors.textSecondary }}>Notas</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Observações para o residente"
        multiline
        style={[styles.input, { minHeight: 80, textAlignVertical: 'top', backgroundColor: colors.white }]}
      />

      <TouchableOpacity onPress={submit} disabled={submitting} style={[styles.button, { marginTop: 12 }]}>
        {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={{ color: colors.white, fontWeight: '700' }}>Criar Agendamento</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}