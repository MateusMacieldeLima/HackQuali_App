import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';
import { ServiceRequest } from '../../../src/types';

interface TicketDetailsProps {
  ticket: ServiceRequest;
  onClose: () => void;
  onStatusChange: () => void; // Chamada para atualizar os tickets após alteração de status
}

interface TicketWithDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  building_name: string;
  resident_name: string;
  resident_email: string;
  unit_number: string;
  unit_floor: string;
  unit_type: string;
}

export default function TicketDetails({ ticket, onClose, onStatusChange }: TicketDetailsProps) {
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ticketDetails, setTicketDetails] = useState<TicketWithDetails | null>(null);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticket.id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);

      // Primeiro, buscar os dados do ticket
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

      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticket.id);

      if (error) throw error;

      onStatusChange(); // Atualiza a lista ao alterar o status
      onClose(); // Fecha os detalhes após a alteração
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    } finally {
      setUpdating(false);
    }
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
        <Text style={{ color: colors.textSecondary }}>
          Erro ao carregar detalhes do ticket
        </Text>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Botão "Voltar" */}
      <TouchableOpacity onPress={onClose} style={{ marginBottom: 16 }}>
        <FontAwesome name="arrow-left" size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Informações da Construção */}
      <View style={{ 
        backgroundColor: colors.background, 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary 
      }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          🏢 Empreendimento
        </Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.primary }}>
          {ticketDetails.building_name}
        </Text>
      </View>

      {/* Informações do Residente */}
      <View style={{ 
        backgroundColor: colors.background, 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50' 
      }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          👤 Residente
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
          {ticketDetails.resident_name}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
          {ticketDetails.resident_email}
        </Text>
      </View>

      {/* Informações da Unidade */}
      <View style={{ 
        backgroundColor: colors.background, 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800' 
      }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          🏠 Unidade
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
          Unidade {ticketDetails.unit_number}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
          Andar: {ticketDetails.unit_floor} • Tipo: {ticketDetails.unit_type}
        </Text>
      </View>

      {/* Título e Descrição do Ticket */}
      <View style={{ 
        backgroundColor: colors.background, 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 16 
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          📋 {ticketDetails.title}
        </Text>
        <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
          {ticketDetails.description}
        </Text>
        <Text style={{ 
          fontSize: 12, 
          color: colors.textSecondary, 
          marginTop: 8,
          fontStyle: 'italic' 
        }}>
          Criado em: {new Date(ticketDetails.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>

      {/* Status Atual */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8, color: colors.text }}>
          Status Atual: 
        </Text>
        <View style={{
          backgroundColor: getStatusColor(ticketDetails.status),
          padding: 8,
          borderRadius: 6,
          alignSelf: 'flex-start'
        }}>
          <Text style={{ 
            color: 'white', 
            fontWeight: '600',
            textTransform: 'capitalize' 
          }}>
            {getStatusLabel(ticketDetails.status)}
          </Text>
        </View>
      </View>

      {/* Alteração de Status */}
      <Text style={{ fontWeight: '700', marginBottom: 12, color: colors.text, fontSize: 16 }}>
        Alterar Status
      </Text>
      {['open', 'assigned', 'in_progress', 'completed', 'cancelled'].map((status) => (
        <TouchableOpacity
          key={status}
          onPress={() => changeStatus(status)}
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: ticketDetails.status === status ? colors.primary : colors.background,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: ticketDetails.status === status ? colors.primary : '#E0E0E0',
          }}
        >
          <Text style={{ 
            color: ticketDetails.status === status ? 'white' : colors.text,
            fontWeight: ticketDetails.status === status ? '600' : '400'
          }}>
            {getStatusLabel(status)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// Função auxiliar para obter a cor do status
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'open': return '#2196F3';
    case 'assigned': return '#FF9800';
    case 'in_progress': return '#9C27B0';
    case 'completed': return '#4CAF50';
    case 'cancelled': return '#F44336';
    default: return '#757575';
  }
};

// Função auxiliar para obter o label do status em português
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'open': return 'Aberto';
    case 'assigned': return 'Atribuído';
    case 'in_progress': return 'Em Andamento';
    case 'completed': return 'Concluído';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
};