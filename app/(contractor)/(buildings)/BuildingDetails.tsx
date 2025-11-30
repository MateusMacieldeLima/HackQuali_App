import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';

interface BuildingDetailsProps {
  building: any; // Tipo real pode ser ajustado
  onClose: () => void;
  onBuildingDeleted?: () => void; // Callback para refetch após deletar
}

export default function BuildingDetails({ building, onClose, onBuildingDeleted }: BuildingDetailsProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const { data: serviceRequests, error: ticketsError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('building_id', building.id);

      const { data: maintenanceHistory, error: historyError } = await supabase
        .from('maintenance_history')
        .select('*, service_requests(title)') // Traz o título do ticket associado
        .eq('service_requests.building_id', building.id);

      if (ticketsError) throw ticketsError;
      if (historyError) throw historyError;

      setTickets(serviceRequests || []);
      setHistory(maintenanceHistory || []);
    } catch (err) {
      console.error('Erro ao buscar detalhes do prédio:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para deletar a construção
  const deleteBuilding = async () => {
    try {
      console.log('Iniciando exclusão da construção...');
      console.log('ID da construção:', building.id);
      setDeleting(true);

      // Deleta o prédio no Supabase
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', building.id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Construção deletada com sucesso!');
      onBuildingDeleted?.(); // Refaz o fetch da lista
      onClose(); // Fecha o modal de detalhes
    } catch (err) {
      console.error('Erro ao deletar a construção:', err);
    } finally {
      setDeleting(false);
    }
  };


  useEffect(() => {
    fetchDetails();
  }, [building.id]);

  if (loading || deleting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Botão de Voltar */}
      <TouchableOpacity onPress={onClose} style={{ marginBottom: 16 }}>
        <FontAwesome name="arrow-left" size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Botão de Excluir Construção */}
      

      {/* Nome e Endereço */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
        {building.name}
      </Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>{building.address}</Text>

      
      <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>{building.description}</Text>

      <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>{building.zip_code}</Text>


      {/* Tickets Abertos */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
        Tickets Abertos
      </Text>
      {tickets.length > 0 ? (
        tickets.map((ticket) => (
          <View key={ticket.id} style={styles.card}>
            <Text style={{ fontWeight: '600', color: colors.text }}>{ticket.title}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{ticket.description}</Text>
          </View>
        ))
      ) : (
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>Nenhum ticket aberto.</Text>
      )}

      {/* Histórico de Manutenção */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 16 }}>
        Histórico de Manutenção
      </Text>
      {history.length > 0 ? (
        history.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={{ fontWeight: '600', color: colors.text }}>
              {item.service_requests?.title}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {item.notes || 'Sem notas.'}
            </Text>
          </View>
        ))
      ) : (
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>Nenhum histórico encontrado.</Text>
      )}
      <TouchableOpacity
        onPress={deleteBuilding}
        style={{
          backgroundColor: 'red',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
          Excluir Construção
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}