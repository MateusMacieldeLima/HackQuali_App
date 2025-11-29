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
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (key: string, value: string) => {
    setBuildingData({ ...buildingData, [key]: value });
  };

  const saveBuilding = async () => {
    if (!buildingData.name || !buildingData.address || !buildingData.city || !buildingData.state) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('buildings')
        .insert([{ ...buildingData, contractor_id: user?.id }]);

      if (error) throw error;

      Alert.alert('Sucesso', 'Empreendimento criado com sucesso!');
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