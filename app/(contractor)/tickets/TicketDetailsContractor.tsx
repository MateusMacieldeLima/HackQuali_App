import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';
import { ServiceRequest } from '../../../src/types';

interface TicketDetailsProps {
  ticket: ServiceRequest;
  onClose: () => void;
  onStatusChange: () => void; // Chamada para atualizar os tickets após alteração de status
}

export default function TicketDetails({ ticket, onClose, onStatusChange }: TicketDetailsProps) {
  const [updating, setUpdating] = useState(false);

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

  if (updating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Botão "Voltar" */}
      <TouchableOpacity onPress={onClose} style={{ marginBottom: 16 }}>
        <FontAwesome name="arrow-left" size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Título e Descrição do Ticket */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
        {ticket.title}
      </Text>
      <Text style={{ color: colors.textSecondary, marginTop: 8, marginBottom: 16 }}>
        {ticket.description}
      </Text>

      {/* Exibe Status Atual */}
      <Text style={{ fontWeight: '600', marginBottom: 8, color: colors.text }}>
        Status Atual: {ticket.status}
      </Text>

      {/* Alteração de Status */}
      <Text style={{ fontWeight: '700', marginBottom: 8, color: colors.text }}>Alterar Status</Text>
      {['open', 'assigned', 'in_progress', 'completed', 'cancelled'].map((status) => (
        <TouchableOpacity
          key={status}
          onPress={() => changeStatus(status)}
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: ticket.status === status ? colors.primary : colors.background,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: ticket.status === status ? colors.background : colors.text }}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}