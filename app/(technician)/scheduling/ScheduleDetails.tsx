import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';

interface ScheduleDetailsProps {
  schedule: {
    id: string;
    scheduled_start: string;
    scheduled_end?: string;
    notes?: string;
    schedule_name?: string;
    service_request_id?: string;
    technician_id?: string;
    status?: string;
  };
  onClose: () => void;
  onScheduleDeleted?: () => void;
}

export default function ScheduleDetails({
  schedule,
  onClose,
  onScheduleDeleted,
}: ScheduleDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [building, setBuilding] = useState<any>(null);
  const [unit, setUnit] = useState<any>(null);

  const fetchScheduleDetails = async () => {
    try {
      setLoading(true);

      // Buscar dados completos do agendamento
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('scheduling')
        .select('*')
        .eq('id', schedule.id)
        .single();

      if (scheduleError) throw scheduleError;
      setScheduleData(scheduleData);

      // Se houver service_request_id, buscar dados do ticket
      if (scheduleData.service_request_id) {
        const { data: srData, error: srError } = await supabase
          .from('service_requests')
          .select('*, unit_id, building_id')
          .eq('id', scheduleData.service_request_id)
          .single();

        if (!srError && srData) {
          setServiceRequest(srData);

          // Buscar dados da unidade
          if (srData.unit_id) {
            const { data: unitData } = await supabase
              .from('units')
              .select('id, unit_number, building_id')
              .eq('id', srData.unit_id)
              .single();

            if (unitData) {
              setUnit(unitData);

              // Buscar dados do building
              if (unitData.building_id) {
                const { data: buildingData } = await supabase
                  .from('buildings')
                  .select('id, name, address')
                  .eq('id', unitData.building_id)
                  .single();

                if (buildingData) {
                  setBuilding(buildingData);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes do agendamento:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleDetails();
  }, [schedule.id]);

  const deleteSchedule = async () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este agendamento?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const { error } = await supabase
                .from('scheduling')
                .delete()
                .eq('id', schedule.id);

              if (error) throw error;

              Alert.alert('Sucesso', 'Agendamento removido com sucesso!');
              onScheduleDeleted?.();
              onClose();
            } catch (err) {
              console.error('Erro ao excluir agendamento:', err);
              Alert.alert('Erro', 'Não foi possível excluir o agendamento.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading || deleting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const scheduleName =
    scheduleData?.schedule_name ||
    (scheduleData?.notes?.match(/^Nome:\s*(.+)$/m)?.[1]?.trim()) ||
    serviceRequest?.title ||
    'Intervenção agendada';

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Botão de Voltar */}
      <TouchableOpacity onPress={onClose} style={{ marginBottom: 16 }}>
        <FontAwesome name="arrow-left" size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Informações do Agendamento */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <FontAwesome name="calendar" size={24} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
              {scheduleName}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Agendamento
            </Text>
          </View>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
              Data e Hora de Início
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
              📅 {scheduleData?.scheduled_start ? formatDate(scheduleData.scheduled_start) : '—'}
            </Text>
          </View>

          {scheduleData?.scheduled_end && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                Data e Hora de Término
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                📅 {formatDate(scheduleData.scheduled_end)}
              </Text>
            </View>
          )}

          {scheduleData?.status && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                Status
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {scheduleData.status === 'confirmed' ? '✅ Confirmado' : '📋 Agendado'}
              </Text>
            </View>
          )}

          {scheduleData?.notes && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                Notas
              </Text>
              <Text style={{ fontSize: 14, color: colors.text }}>
                {String(scheduleData.notes).replace(/^Nome:\s*.*\n?/, '').trim() || 'Sem notas'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Informações do Ticket/Service Request */}
      {serviceRequest && (
        <View style={styles.card}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Informações do Ticket
          </Text>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                Título
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {serviceRequest.title}
              </Text>
            </View>
            {serviceRequest.description && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                  Descrição
                </Text>
                <Text style={{ fontSize: 14, color: colors.text }}>
                  {serviceRequest.description}
                </Text>
              </View>
            )}
            {serviceRequest.status && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                  Status
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                  {serviceRequest.status}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Informações do Local */}
      {building && (
        <View style={styles.card}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Local
          </Text>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                Empreendimento
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                🏢 {building.name}
              </Text>
              {building.address && (
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  {building.address}
                </Text>
              )}
            </View>
            {unit && (
              <View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                  Unidade
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                  🏠 Unidade {unit.unit_number}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Botão de Excluir */}
      <TouchableOpacity
        onPress={deleteSchedule}
        style={{
          backgroundColor: colors.danger,
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
          Excluir Agendamento
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

