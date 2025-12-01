import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { styles } from '../../src/styles/authStyles';
import { supabase } from '../../src/supabase';

export default function LinkUnitScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [unitCode, setUnitCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLinkUnit = async () => {
    if (!unitCode.trim()) {
      Alert.alert('Erro', 'Por favor, insira o código da unidade');
      return;
    }

    try {
      setLoading(true);

      // Fetch unit by code
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('id, building_id, resident_id')
        .eq('unit_code', unitCode.toUpperCase())
        .single();

      if (unitError || !unit) {
        Alert.alert('Erro', 'Código de unidade inválido. Verifique e tente novamente.');
        return;
      }

      // Verificar se a unidade já está vinculada a outro residente
      if (unit.resident_id && unit.resident_id !== user?.id) {
        Alert.alert('Erro', 'Esta unidade já está vinculada a outro morador.');
        return;
      }

      // Atualizar a unidade com o ID do residente
      const { error: updateError } = await supabase
        .from('units')
        .update({
          resident_id: user?.id,
        })
        .eq('id', unit.id);

      if (updateError) throw updateError;

      Alert.alert('Sucesso', 'Unidade vinculada com sucesso!');
      router.replace('/(resident)');
    } catch (err) {
      console.error('Error linking unit:', err);
      Alert.alert('Erro', 'Falha ao vincular unidade. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow users to skip for now, but they should link later
    router.replace('/(resident)');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Vincular Unidade</Text>
        <Text style={styles.subtitle}>
          Para começar, você precisa vincular sua unidade residencial ao seu cadastro.
        </Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Código da Unidade</Text>
          <Text style={styles.description}>
            Você recebeu este código ao realizar a compra. Procure na documentação do seu imóvel.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: ABC123XYZ"
            value={unitCode}
            onChangeText={setUnitCode}
            autoCapitalize="characters"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLinkUnit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Vincular</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} disabled={loading}>
            <Text style={styles.link}>Fazer depois</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
