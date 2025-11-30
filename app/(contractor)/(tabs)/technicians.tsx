import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AddTechnicianForm from '../(technicians)/AddTechnician';
import TechnicianDetails from '../(technicians)/TechnicianDetails';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';
import { TechnicianUser } from '../../../src/types';

interface TechnicianWithDetails extends TechnicianUser {
  id: string;
  email: string;
  name: string;
  phone_number?: string;
  cpf?: string;
  created_at?: string;
}

export default function ContractorTechniciansScreen() {
  const { user } = useAuth();
  const searchParams = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianWithDetails[]>([]);
  const [showAddTechnician, setShowAddTechnician] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Novo useEffect para verificar se deve abrir o formulário automaticamente
  useEffect(() => {
    if (searchParams.openAddForm === 'true') {
      setShowAddTechnician(true);
    }
  }, [searchParams.openAddForm]);

  const fetchTechnicians = async () => {
    try {
      if (!user?.id) return;

      // Buscar técnicos vinculados ao contractor através da tabela company_technicians
      // Primeiro, buscar os IDs dos técnicos vinculados
      const { data: links, error: linksError } = await supabase
        .from('company_technicians')
        .select('technician_id, created_at')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      if (!links || links.length === 0) {
        setTechnicians([]);
        return;
      }

      // Buscar os dados dos técnicos
      const technicianIds = links.map((link: any) => link.technician_id);
      const { data: technicians, error: techError } = await supabase
        .from('users')
        .select('id, email, full_name, phone_number, cpf, created_at')
        .in('id', technicianIds)
        .eq('role', 'technician');

      if (techError) throw techError;

      // Criar um mapa de created_at do vínculo
      const linkMap = new Map(links.map((link: any) => [link.technician_id, link.created_at]));

      // Mapear os dados para o formato esperado
      const mappedTechnicians: TechnicianWithDetails[] = (technicians || []).map((tech: any) => ({
        id: tech.id,
        email: tech.email || '',
        name: tech.full_name || '',
        role: 'technician' as const,
        companyId: user.id,
        phone_number: tech.phone_number,
        cpf: tech.cpf,
        createdAt: tech.created_at || new Date().toISOString(),
        created_at: linkMap.get(tech.id) || tech.created_at,
      }));

      setTechnicians(mappedTechnicians);
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setTechnicians([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTechnicians();
  };

  const toggleAddTechnician = () => {
    setShowAddTechnician(!showAddTechnician);
  };

  const handleDeleteTechnician = async (technicianId: string) => {
    Alert.alert(
      'Confirmar Remoção',
      'Tem certeza que deseja remover este técnico da sua empresa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) return;

              // Remover o vínculo da tabela company_technicians
              const { error } = await supabase
                .from('company_technicians')
                .delete()
                .eq('company_id', user.id)
                .eq('technician_id', technicianId);

              if (error) throw error;

              Alert.alert('Sucesso', 'Técnico removido da empresa com sucesso');
              fetchTechnicians();
            } catch (err) {
              console.error('Error removing technician:', err);
              Alert.alert('Erro', 'Não foi possível remover o técnico.');
            }
          },
        },
      ]
    );
  };

  // Filtrar técnicos baseado na busca
  const filteredTechnicians = technicians.filter((tech) =>
    tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tech.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTechnicianItem = ({ item }: { item: TechnicianWithDetails }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedTechnician(item)}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
            📧 {item.email}
          </Text>
          {item.phone_number && (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
              📱 {item.phone_number}
            </Text>
          )}
          {item.cpf && (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              🆔 CPF: {item.cpf}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <FontAwesome name="chevron-right" size={16} color={colors.textSecondary} />
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteTechnician(item.id);
            }}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: colors.danger + '20',
            }}
          >
            <FontAwesome name="trash" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showAddTechnician ? (
        <AddTechnicianForm
          onClose={toggleAddTechnician}
          onTechnicianAdded={fetchTechnicians}
        />
      ) : selectedTechnician ? (
        <TechnicianDetails
          technician={selectedTechnician}
          onClose={() => setSelectedTechnician(null)}
        />
      ) : (
        <>
          {/* Barra de busca */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.background,
                borderRadius: 8,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <FontAwesome name="search" size={16} color={colors.textSecondary} />
              <TextInput
                placeholder="Buscar técnico..."
                style={{
                  flex: 1,
                  padding: 12,
                  fontSize: 14,
                  color: colors.text,
                }}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* Botão de adicionar */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <TouchableOpacity
              onPress={toggleAddTechnician}
              style={{
                backgroundColor: colors.primary,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                + Novo Técnico
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lista de técnicos */}
          {filteredTechnicians.length > 0 ? (
            <FlatList
              data={filteredTechnicians}
              renderItem={renderTechnicianItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
              <FontAwesome name="users" size={48} color={colors.textSecondary} />
              <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.text }}>
                {searchQuery ? 'Nenhum técnico encontrado' : 'Nenhum técnico cadastrado'}
              </Text>
              <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                {searchQuery
                  ? 'Tente buscar com outros termos'
                  : 'Cadastre seu primeiro técnico para começar'}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

