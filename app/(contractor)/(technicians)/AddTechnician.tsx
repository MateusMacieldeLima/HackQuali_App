import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';

interface AddTechnicianFormProps {
  onClose: () => void; // Callback para fechar o formulário
  onTechnicianAdded: () => void; // Callback para atualizar a lista após adicionar
}

interface TechnicianSearchResult {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  cpf?: string;
  is_linked?: boolean; // Indica se já está vinculado à empresa atual
}

export default function AddTechnicianForm({ onClose, onTechnicianAdded }: AddTechnicianFormProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TechnicianSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchTechnicians = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Erro', 'Por favor, informe o email ou CPF do técnico.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    setSearching(true);
    setSearchResults([]);

    try {
      // Buscar técnicos por email ou CPF
      const searchTerm = `%${searchQuery}%`;
      const { data: technicians, error: searchError } = await supabase
        .from('users')
        .select('id, email, full_name, phone_number, cpf')
        .eq('role', 'technician')
        .or(`email.ilike.${searchTerm},cpf.ilike.${searchTerm}`);

      if (searchError) throw searchError;

      if (!technicians || technicians.length === 0) {
        Alert.alert('Nenhum resultado', 'Nenhum técnico encontrado com os dados informados.');
        setSearching(false);
        return;
      }

      // Buscar quais técnicos já estão vinculados à empresa atual
      const technicianIds = technicians.map((t) => t.id);
      const { data: linkedTechnicians, error: linkError } = await supabase
        .from('company_technicians')
        .select('technician_id')
        .eq('company_id', user.id)
        .in('technician_id', technicianIds);

      if (linkError) throw linkError;

      const linkedIds = new Set((linkedTechnicians || []).map((lt: any) => lt.technician_id));

      // Mapear resultados com informação de vínculo
      const resultsWithLinkStatus: TechnicianSearchResult[] = technicians.map((tech) => ({
        id: tech.id,
        email: tech.email || '',
        full_name: tech.full_name || '',
        phone_number: tech.phone_number,
        cpf: tech.cpf,
        is_linked: linkedIds.has(tech.id),
      }));

      setSearchResults(resultsWithLinkStatus);
    } catch (err: any) {
      console.error('Erro ao buscar técnicos:', err);
      Alert.alert('Erro', 'Não foi possível buscar técnicos.');
    } finally {
      setSearching(false);
    }
  };

  const linkTechnician = async (technicianId: string) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    setLoading(true);

    try {
      // Verificar se o técnico já está vinculado à empresa atual
      const { data: existingLink, error: checkError } = await supabase
        .from('company_technicians')
        .select('id')
        .eq('company_id', user.id)
        .eq('technician_id', technicianId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 é o código de "nenhum resultado encontrado", que é esperado
        throw checkError;
      }

      if (existingLink) {
        Alert.alert('Aviso', 'Este técnico já está vinculado à sua empresa.');
        return;
      }

      // Verificar se o técnico existe e tem role technician
      const { data: techData, error: techError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', technicianId)
        .eq('role', 'technician')
        .single();

      if (techError || !techData) {
        Alert.alert('Erro', 'Técnico não encontrado ou inválido.');
        return;
      }

      // Inserir vínculo na tabela company_technicians
      const { error: insertError } = await supabase
        .from('company_technicians')
        .insert([
          {
            company_id: user.id,
            technician_id: technicianId,
          },
        ]);

      if (insertError) {
        // Se for erro de duplicata, o técnico já está vinculado
        if (insertError.code === '23505') {
          Alert.alert('Aviso', 'Este técnico já está vinculado à sua empresa.');
        } else {
          throw insertError;
        }
        return;
      }

      Alert.alert('Sucesso', 'Técnico vinculado à empresa com sucesso!');
      onTechnicianAdded(); // Atualiza a lista na tela principal
      onClose(); // Fecha o formulário
    } catch (err: any) {
      console.error('Erro ao vincular técnico:', err);
      Alert.alert('Erro', err.message || 'Não foi possível vincular o técnico.');
    } finally {
      setLoading(false);
    }
  };

  const renderSearchResult = ({ item }: { item: TechnicianSearchResult }) => {
    const isAlreadyLinked = item.is_linked === true;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            opacity: isAlreadyLinked ? 0.6 : 1,
            marginBottom: 12,
          },
        ]}
        onPress={() => !isAlreadyLinked && linkTechnician(item.id)}
        disabled={isAlreadyLinked || loading}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
              {item.full_name}
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
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                🆔 CPF: {item.cpf}
              </Text>
            )}
          </View>
          {isAlreadyLinked ? (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: colors.success + '20',
              }}
            >
              <Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>
                Já vinculado
              </Text>
            </View>
          ) : (
            <FontAwesome name="plus-circle" size={24} color={colors.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 16, color: colors.text }}>
        Adicionar Técnico
      </Text>

      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
        Busque um técnico já cadastrado por email ou CPF para vinculá-lo à sua empresa.
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background,
          borderRadius: 8,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
        }}
      >
        <FontAwesome name="search" size={16} color={colors.textSecondary} />
        <TextInput
          placeholder="Email ou CPF do técnico"
          style={{
            flex: 1,
            padding: 12,
            fontSize: 14,
            color: colors.text,
          }}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={searchTechnicians}
          disabled={searching || !searchQuery.trim()}
          style={{
            padding: 8,
            opacity: searching || !searchQuery.trim() ? 0.5 : 1,
          }}
        >
          <FontAwesome
            name={searching ? 'spinner' : 'search'}
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {searching && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Buscando...</Text>
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 12, color: colors.text }}>
            Resultados da busca:
          </Text>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <TouchableOpacity
        onPress={onClose}
        style={{ marginTop: 16, alignItems: 'center', paddingVertical: 12 }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

