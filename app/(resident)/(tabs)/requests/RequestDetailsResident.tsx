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
import { useAuth } from '../../../../src/contexts/AuthContext';
import { colors, statusColors, styles } from '../../../../src/styles/authStyles';
import { supabase } from '../../../../src/supabase';
import { ServiceRequest } from '../../../../src/types';

interface RequestDetailsProps {
  request: ServiceRequest;
  onClose: () => void;
}

interface TicketDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  building_id: string;
  unit_id: string;
  building_name: string;
  building_address?: string;
  building_description?: string;
  building_zip_code?: string;
  unit_number: string;
  unit_floor?: string;
  unit_type?: string;
  assigned_to?: string;
  technician_name?: string;
  technician_email?: string;
  rating?: number | null;
}

export default function RequestDetailsResident({ request, onClose }: RequestDetailsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [savingRating, setSavingRating] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      if (!request.id || !user?.id) return;

      setLoading(true);

      // Buscar dados do ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', request.id)
        .eq('requester_id', user.id) // Garantir que é do residente
        .single();

      if (ticketError) throw ticketError;

      if (!ticketData) {
        Alert.alert('Erro', 'Ticket não encontrado');
        onClose();
        return;
      }

      // Buscar dados do building com informações completas
      const { data: buildingData, error: buildingError } = await supabase
        .from('buildings')
        .select('id, name, address, description, zip_code')
        .eq('id', ticketData.building_id)
        .single();

      if (buildingError) throw buildingError;

      // Buscar dados da unit
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('unit_number, floor, type')
        .eq('id', ticketData.unit_id)
        .single();

      if (unitError) throw unitError;

      // Buscar dados do técnico se houver
      let technicianName = undefined;
      let technicianEmail = undefined;
      if (ticketData.assigned_to) {
        const { data: technicianData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', ticketData.assigned_to)
          .single();

        if (technicianData) {
          technicianName = technicianData.full_name;
          technicianEmail = technicianData.email;
        }
      }

      setTicketDetails({
        id: ticketData.id,
        title: ticketData.title,
        description: ticketData.description,
        status: ticketData.status,
        priority: ticketData.priority,
        category: ticketData.category,
        created_at: ticketData.created_at,
        updated_at: ticketData.updated_at,
        completed_at: ticketData.completed_at,
        building_id: ticketData.building_id,
        unit_id: ticketData.unit_id,
        building_name: buildingData.name,
        building_address: buildingData.address,
        building_description: buildingData.description,
        building_zip_code: buildingData.zip_code,
        unit_number: unitData.unit_number,
        unit_floor: unitData.floor,
        unit_type: unitData.type,
        assigned_to: ticketData.assigned_to,
        technician_name: technicianName,
        technician_email: technicianEmail,
        rating: ticketData.rating,
      });
      setSelectedRating(ticketData.rating);
    } catch (err) {
      console.error('❌ Error fetching ticket details:', err);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [request.id]);

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

  const getCategoryLabel = (category?: string) => {
    if (!category) return 'Não especificada';
    const labels: { [key: string]: string } = {
      electrical: 'Elétrico',
      plumbing: 'Hidráulico',
      structural: 'Estrutural',
      painting: 'Pintura',
      hvac: 'Ar Condicionado',
      appliances: 'Eletrodomésticos',
      other: 'Outro',
    };
    return labels[category] || category;
  };

  const saveRating = async (rating: number) => {
    if (!ticketDetails) return;
    
    try {
      setSavingRating(true);
      
      const { error } = await supabase
        .from('service_requests')
        .update({ 
          rating: rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketDetails.id);

      if (error) throw error;

      setSelectedRating(rating);
      setTicketDetails(prev => prev ? { ...prev, rating } : null);
      Alert.alert('Sucesso', 'Avaliação registrada com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar avaliação:', err);
      Alert.alert('Erro', 'Não foi possível salvar a avaliação');
    } finally {
      setSavingRating(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!ticketDetails) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
          Erro ao carregar detalhes do ticket
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: '600' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = statusColors[ticketDetails.status] || colors.textSecondary;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Botão de Voltar */}
      <TouchableOpacity onPress={onClose} style={{ marginBottom: 16 }}>
        <FontAwesome name="arrow-left" size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Informações do Empreendimento */}
      <View
        style={{
          backgroundColor: colors.background,
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          🏢 Empreendimento
        </Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 4 }}>
          {ticketDetails.building_name}
        </Text>
        {ticketDetails.building_address && (
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            📍 {ticketDetails.building_address}
          </Text>
        )}
        {ticketDetails.building_description && (
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            {ticketDetails.building_description}
          </Text>
        )}
        {ticketDetails.building_zip_code && (
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            CEP: {ticketDetails.building_zip_code}
          </Text>
        )}
      </View>

      {/* Informações da Unidade */}
      <View
        style={{
          backgroundColor: colors.background,
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#FF9800',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          🏠 Unidade
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
          Unidade {ticketDetails.unit_number}
        </Text>
        {ticketDetails.unit_floor && (
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            Andar: {ticketDetails.unit_floor}
          </Text>
        )}
        {ticketDetails.unit_type && (
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            Tipo: {ticketDetails.unit_type}
          </Text>
        )}
      </View>

      {/* Título e Descrição do Ticket */}
      <View style={styles.card}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          {ticketDetails.title}
        </Text>
        <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
          {ticketDetails.description}
        </Text>

        {/* Status e Prioridade */}
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
          {ticketDetails.category && (
            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {getCategoryLabel(ticketDetails.category)}
              </Text>
            </View>
          )}
        </View>

        {/* Datas */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            Criado em: {new Date(ticketDetails.created_at).toLocaleString('pt-BR')}
          </Text>
          {ticketDetails.updated_at && (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              Atualizado em: {new Date(ticketDetails.updated_at).toLocaleString('pt-BR')}
            </Text>
          )}
          {ticketDetails.completed_at && (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              Concluído em: {new Date(ticketDetails.completed_at).toLocaleString('pt-BR')}
            </Text>
          )}
        </View>
      </View>

      {/* Informações do Técnico (se atribuído) */}
      {ticketDetails.technician_name && (
        <View
          style={{
            backgroundColor: colors.background,
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#4CAF50',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            🔧 Técnico Responsável
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
            {ticketDetails.technician_name}
          </Text>
          {ticketDetails.technician_email && (
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
              {ticketDetails.technician_email}
            </Text>
          )}
        </View>
      )}

      {/* Avaliação do Ticket (somente para concluídos e para residente) */}
      {ticketDetails.status === 'completed' && (
        <View
          style={{
            backgroundColor: colors.warning + '15',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: colors.warning,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            ⭐ Avaliar Serviço
          </Text>
          
          {ticketDetails.rating ? (
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesome
                    key={star}
                    name={star <= ticketDetails.rating! ? 'star' : 'star-o'}
                    size={24}
                    color={star <= ticketDetails.rating! ? colors.warning : colors.textSecondary}
                  />
                ))}
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                Você avaliou: {ticketDetails.rating} {ticketDetails.rating === 1 ? 'estrela' : 'estrelas'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginBottom: 12 }}>
                Gostaria de mudar sua avaliação?
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
              Por favor, avalie este serviço para nos ajudar a melhorar!
            </Text>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => saveRating(star)}
                disabled={savingRating}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: selectedRating === star ? colors.warning + '30' : 'transparent',
                  opacity: savingRating ? 0.5 : 1,
                }}
              >
                {savingRating && selectedRating === star ? (
                  <ActivityIndicator size="small" color={colors.warning} />
                ) : (
                  <FontAwesome
                    name="star"
                    size={32}
                    color={star <= (selectedRating || 0) ? colors.warning : colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

