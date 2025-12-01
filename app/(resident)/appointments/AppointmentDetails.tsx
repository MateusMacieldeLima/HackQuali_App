import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';

interface AppointmentDetailsProps {
  appointment: {
    id: string;
    scheduled_start?: string;
    scheduledStart?: string;
    scheduledDate?: string;
    scheduled_end?: string;
    scheduledEnd?: string;
    notes?: string;
    schedule_name?: string;
    service_request_id?: string;
    serviceRequestId?: string;
    status?: string;
  };
  onClose: () => void;
}

export default function AppointmentDetails({
  appointment,
  onClose,
}: AppointmentDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [building, setBuilding] = useState<any>(null);
  const [unit, setUnit] = useState<any>(null);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);

      // Buscar dados completos do agendamento
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('scheduling')
        .select('*')
        .eq('id', appointment.id)
        .single();

      if (appointmentError) throw appointmentError;
      setAppointmentData(appointmentData);

      // Se houver service_request_id, buscar dados do ticket
      const serviceRequestId = appointmentData.service_request_id || appointment.serviceRequestId;
      if (serviceRequestId) {
        const { data: srData, error: srError } = await supabase
          .from('service_requests')
          .select('*, unit_id, building_id')
          .eq('id', serviceRequestId)
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
    fetchAppointmentDetails();
  }, [appointment.id]);

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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const appointmentName =
    appointmentData?.schedule_name ||
    (appointmentData?.notes?.match(/^Nome:\s*(.+)$/m)?.[1]?.trim()) ||
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
              {appointmentName}
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
              📅 {appointmentData?.scheduled_start || appointment.scheduledStart || appointment.scheduledDate 
                ? formatDate(appointmentData?.scheduled_start || appointment.scheduledStart || appointment.scheduledDate || '') 
                : '—'}
            </Text>
          </View>

          {(appointmentData?.scheduled_end || appointment.scheduledEnd) && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                Data e Hora de Término
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                📅 {formatDate(appointmentData?.scheduled_end || appointment.scheduledEnd || '')}
              </Text>
            </View>
          )}

          {appointmentData?.status && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                Status
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {appointmentData.status === 'confirmed' ? '✅ Confirmado' : '📋 Agendado'}
              </Text>
            </View>
          )}

          {appointmentData?.notes && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                Notas
              </Text>
              <Text style={{ fontSize: 14, color: colors.text }}>
                {String(appointmentData.notes).replace(/^Nome:\s*.*\n?/, '').trim() || 'Sem notas'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Informações do Ticket/Service Request */}
      {serviceRequest && (
        <View style={styles.card}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Informações da Solicitação
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
    </ScrollView>
  );
}

