import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors, statusColors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';
import { ServiceRequest } from '../../../src/types';

interface TicketDetailsProps {
  ticket: ServiceRequest;
  onClose: () => void;
  onStatusChange: () => void;
}

interface TicketWithDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  created_at: string;
  building_name: string;
  resident_name: string;
  resident_email: string;
  unit_number: string;
  unit_floor: string;
  unit_type: string;
}

export default function TicketDetailsTechnician({ ticket, onClose, onStatusChange }: TicketDetailsProps) {
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ticketDetails, setTicketDetails] = useState<TicketWithDetails | null>(null);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticket.id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);

      // Buscar dados do ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', ticket.id)
        .single();

      if (ticketError) throw ticketError;

      // Buscar dados do building
      const { data: buildingData, error: buildingError } = await supabase
        .from('buildings')
        .select('name')
        .eq('id', ticketData.building_id)
        .single();

      if (buildingError) throw buildingError;

      // Buscar dados da unit
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('unit_number, floor, type, resident_id')
        .eq('id', ticketData.unit_id)
        .single();

      if (unitError) throw unitError;

      // Buscar dados do user (residente)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', unitData.resident_id)
        .single();

      if (userError) throw userError;

      setTicketDetails({
        id: ticketData.id,
        title: ticketData.title,
        description: ticketData.description,
        status: ticketData.status,
        priority: ticketData.priority,
        category: ticketData.category,
        created_at: ticketData.created_at,
        building_name: buildingData.name,
        resident_name: userData.full_name,
        resident_email: userData.email,
        unit_number: unitData.unit_number,
        unit_floor: unitData.floor,
        unit_type: unitData.type,
      });
    } catch (err) {
      console.error('Erro ao buscar detalhes do ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (newStatus: string) => {
    try {
      setUpdating(true);

      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };

      // Se mudando para in_progress, registrar started_at
      if (newStatus === 'in_progress' && ticketDetails?.status !== 'in_progress') {
        updateData.started_at = new Date().toISOString();
      }

      // Se mudando para completed, registrar completed_at
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', ticket.id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Status do ticket atualizado com sucesso!');
      onStatusChange();
      onClose();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      Alert.alert('Erro', 'Não foi possível atualizar o status do ticket.');
    } finally {
      setUpdating(false);
    }
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

  const getPriorityLabel = (priority: string) => {
    const labels: { [key: string]: string } = {
      low: 'Baixa',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return labels[priority] || priority;
  };

  if (loading || updating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!ticketDetails) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ color: colors.textSecondary }}>Erro ao carregar detalhes do ticket</Text>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = statusColors[ticketDetails.status] || colors.textSecondary;
  const canUpdateStatus = ['assigned', 'in_progress'].includes(ticketDetails.status);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Botão "Voltar" */}
      <TouchableOpacity onPress={onClose} style={{ marginBottom: 16 }}>
        <FontAwesome name="arrow-left" size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Título e Status */}
      <View style={styles.card}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          {ticketDetails.title}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={[styles.badgeText, { color: colors.white }]}>
              {getStatusLabel(ticketDetails.status)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.textSecondary + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {getPriorityLabel(ticketDetails.priority)}
            </Text>
          </View>
        </View>
      </View>

      {/* Descrição */}
      <View style={styles.card}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
          Descrição
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
          {ticketDetails.description}
        </Text>
      </View>

      {/* Informações do Local */}
      <View style={styles.card}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
          Localização
        </Text>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Empreendimento</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
            🏢 {ticketDetails.building_name}
          </Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Unidade</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
            {ticketDetails.unit_number} - {ticketDetails.unit_type}
          </Text>
        </View>
        {ticketDetails.unit_floor && (
          <View>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Andar</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
              {ticketDetails.unit_floor}
            </Text>
          </View>
        )}
      </View>

      {/* Informações do Solicitante */}
      <View style={styles.card}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
          Solicitante
        </Text>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Nome</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
            {ticketDetails.resident_name}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Email</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
            {ticketDetails.resident_email}
          </Text>
        </View>
      </View>

      {/* Ações - Apenas para tickets atribuídos ou em progresso */}
      {canUpdateStatus && (
        <View style={{ marginTop: 16 }}>
          {ticketDetails.status === 'assigned' && (
            <TouchableOpacity
              onPress={() => changeStatus('in_progress')}
              disabled={updating}
              style={{
                backgroundColor: colors.primary,
                padding: 14,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 12,
                opacity: updating ? 0.6 : 1,
              }}
            >
              {updating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                  Iniciar Trabalho
                </Text>
              )}
            </TouchableOpacity>
          )}

          {ticketDetails.status === 'in_progress' && (
            <TouchableOpacity
              onPress={() => changeStatus('completed')}
              disabled={updating}
              style={{
                backgroundColor: colors.success,
                padding: 14,
                borderRadius: 8,
                alignItems: 'center',
                opacity: updating ? 0.6 : 1,
              }}
            >
              {updating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                  Marcar como Concluído
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Data de Criação */}
      <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
          Criado em: {new Date(ticketDetails.created_at).toLocaleString('pt-BR')}
        </Text>
      </View>
    </ScrollView>
  );
}

