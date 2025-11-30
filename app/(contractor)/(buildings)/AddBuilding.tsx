import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';

interface AddBuildingFormProps {
  onClose: () => void; // Callback para fechar o formulário
  onBuildingAdded: () => void; // Callback para atualizar a lista após adicionar
}

export default function AddBuildingForm({ onClose, onBuildingAdded }: AddBuildingFormProps) {
  const { user } = useAuth();
  const [buildingData, setBuildingData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (key: string, value: string) => {
    setBuildingData({ ...buildingData, [key]: value });
  };

  // Função para gerar código aleatório de 8 dígitos
  const generateRandomCode = (): string => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  // Função para verificar se o código já existe na database
  const checkCodeExists = async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('zip_code')
        .eq('zip_code', code)
        .limit(1);

      if (error) {
        console.error('Erro ao verificar código:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (err) {
      console.error('Erro ao verificar código:', err);
      return false;
    }
  };

  // Função para gerar um código único
  const generateUniqueCode = async (): Promise<string> => {
    let code: string;
    let codeExists: boolean;
    let attempts = 0;
    const maxAttempts = 10; // Limite de tentativas para evitar loop infinito

    do {
      code = generateRandomCode();
      codeExists = await checkCodeExists(code);
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error('Não foi possível gerar um código único após várias tentativas');
      }
    } while (codeExists);

    return code;
  };

  const saveBuilding = async () => {
    if (!buildingData.name || !buildingData.address || !buildingData.city || !buildingData.state) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      // Gera um código único de 8 dígitos
      const zipCode = await generateUniqueCode();

      const { error } = await supabase
        .from('buildings')
        .insert([{ 
          ...buildingData, 
          contractor_id: user?.id,
          zip_code: zipCode // Adiciona o código gerado único
        }]);

      if (error) throw error;

      Alert.alert('Sucesso', `Empreendimento criado com sucesso!\nCódigo: ${zipCode}`);
      onBuildingAdded(); // Atualiza a lista na tela principal
      onClose(); // Fecha o formulário
    } catch (err) {
      console.error('Erro ao salvar empreendimento:', err);
      Alert.alert('Erro', 'Não foi possível criar o empreendimento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 16, color: colors.text }}>
        Adicionar Empreendimento
      </Text>

      <TextInput
        placeholder="Nome"
        style={styles.input}
        value={buildingData.name}
        onChangeText={(value) => handleInputChange('name', value)}
      />
      <TextInput
        placeholder="Endereço"
        style={styles.input}
        value={buildingData.address}
        onChangeText={(value) => handleInputChange('address', value)}
      />
      <TextInput
        placeholder="Cidade"
        style={styles.input}
        value={buildingData.city}
        onChangeText={(value) => handleInputChange('city', value)}
      />
      <TextInput
        placeholder="Estado"
        style={styles.input}
        value={buildingData.state}
        onChangeText={(value) => handleInputChange('state', value)}
      />

      <TextInput
        placeholder="Descrição (opcional)"
        style={styles.input}
        value={buildingData.description}
        onChangeText={(value) => handleInputChange('description', value)}
      />

      <TouchableOpacity
        onPress={saveBuilding}
        disabled={loading}
        style={{
          backgroundColor: colors.primary,
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 24,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onClose}
        style={{ marginTop: 16, alignItems: 'center' }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}