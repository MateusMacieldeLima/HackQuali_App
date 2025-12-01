import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
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
  assigned_to?: string;
  technician_name?: string;
  technician_email?: string;
}

interface Technician {
  id: string;
  full_name: string;
  email: string;
}

export default function TicketDetails({ ticket, onClose, onStatusChange }: TicketDetailsProps) {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ticketDetails, setTicketDetails] = useState<TicketWithDetails | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [showTechnicianSelector, setShowTechnicianSelector] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
    fetchTechnicians();
  }, [ticket.id]);

  const fetchTechnicians = async () => {
    try {
      if (!user?.id) return;

      setLoadingTechnicians(true);

      // Buscar técnicos vinculados ao contractor através da tabela company_technicians
      const { data: links, error: linksError } = await supabase
        .from('company_technicians')
        .select('technician_id')
        .eq('company_id', user.id);

      if (linksError) throw linksError;

      if (!links || links.length === 0) {
        setTechnicians([]);
        return;
      }

      // Buscar os dados dos técnicos
      const technicianIds = links.map((link: any) => link.technician_id);
      const { data: techniciansData, error: techError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', technicianIds)
        .eq('role', 'technician');

      if (techError) throw techError;

      setTechnicians((techniciansData || []).map((tech: any) => ({
        id: tech.id,
        full_name: tech.full_name || '',
        email: tech.email || '',
      })));
    } catch (err) {
      console.error('Erro ao buscar técnicos:', err);
      setTechnicians([]);
    } finally {
      setLoadingTechnicians(false);
    }
  };

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
        created_at: ticketData.created_at,
        building_name: buildingData.name,
        resident_name: userData.full_name,
        resident_email: userData.email,
        unit_number: unitData.unit_number,
        unit_floor: unitData.floor,
        unit_type: unitData.type,
        assigned_to: ticketData.assigned_to,
        technician_name: technicianName,
        technician_email: technicianEmail,
      });

    } catch (err) {
      console.error('Erro ao buscar detalhes do ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const assignTechnician = async (technicianId: string) => {
    try {
      setUpdating(true);

      const { error } = await supabase
        .from('service_requests')
        .update({ 
          assigned_to: technicianId,
          status: 'assigned',
          updated_at: new Date().toISOString() 
        })
        .eq('id', ticket.id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Técnico atribuído com sucesso!');
      onStatusChange(); // Atualiza a lista
      fetchTicketDetails(); // Atualiza os detalhes
      setShowTechnicianSelector(false);
    } catch (err) {
      console.error('Erro ao atribuir técnico:', err);
      Alert.alert('Erro', 'Não foi possível atribuir o técnico.');
    } finally {
      setUpdating(false);
    }
  };

  const cancelTicket = async () => {
    try {
      setUpdating(true);

      const { error } = await supabase
        .from('service_requests')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString() 
        })
        .eq('id', ticket.id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Ticket cancelado com sucesso!');
      onStatusChange(); // Atualiza a lista
      onClose(); // Fecha os detalhes
    } catch (err) {
      console.error('Erro ao cancelar ticket:', err);
      Alert.alert('Erro', 'Não foi possível cancelar o ticket.');
    } finally {
      setUpdating(false);
    }
  }

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

      {/* Técnico Atribuído */}
      {ticketDetails.technician_name && (
        <View style={{ 
          backgroundColor: colors.background, 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#4CAF50' 
        }}>
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

      {/* Atribuir Técnico - Apenas se não houver técnico atribuído e status for "open" */}
      {!ticketDetails.assigned_to && ticketDetails.status === 'open' && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: '700', marginBottom: 12, color: colors.text, fontSize: 16 }}>
            Atribuir Técnico
          </Text>
          
          {!showTechnicianSelector ? (
            <TouchableOpacity
              onPress={() => setShowTechnicianSelector(true)}
              style={{
                backgroundColor: colors.primary,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                Selecionar Técnico
              </Text>
            </TouchableOpacity>
          ) : (
            <View>
              {loadingTechnicians ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : technicians.length === 0 ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 16 }}>
                  Nenhum técnico disponível. Adicione técnicos na seção de Técnicos.
                </Text>
              ) : (
                <>
                  {technicians.map((technician) => (
                    <TouchableOpacity
                      key={technician.id}
                      onPress={() => assignTechnician(technician.id)}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        backgroundColor: colors.background,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: '#E0E0E0',
                      }}
                    >
                      <Text style={{ fontWeight: '600', color: colors.text }}>
                        {technician.full_name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {technician.email}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => setShowTechnicianSelector(false)}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      )}

      {/* Cancelar Ticket - Disponível a qualquer momento, exceto se já estiver cancelado */}
      {ticketDetails.status !== 'cancelled' && (
        <View style={{ marginTop: 16, marginBottom: 32 }}>
          <TouchableOpacity
            onPress={cancelTicket}
            disabled={updating}
            style={{
              backgroundColor: '#F44336',
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
                Cancelar Ticket
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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