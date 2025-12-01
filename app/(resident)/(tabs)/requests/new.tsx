import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { colors, styles } from '../../../../src/styles/authStyles';
import { supabase } from '../../../../src/supabase';
import { ServiceRequestCategory, ServiceRequestPriority } from '../../../../src/types';

interface NewRequestScreenProps {
  onClose: () => void;
  onRequestCreated?: () => void;
}

export default function NewRequestScreen({ onClose, onRequestCreated }: NewRequestScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasUnratedTickets, setHasUnratedTickets] = useState(false);
  const [unratedCount, setUnratedCount] = useState(0);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ServiceRequestCategory>('other');
  const [priority, setPriority] = useState<ServiceRequestPriority>('normal');
  
  // Unit and building IDs (automatically loaded from resident)
  const [unitId, setUnitId] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);

  // Buscar automaticamente a unidade do residente
  const fetchResidentUnit = async () => {
    try {
      if (!user?.id) return;

      setLoading(true);
      console.log('🔍 Fetching resident unit for:', user.id);

      // Buscar a unidade do residente diretamente na tabela units
      const { data: unitsData, error: unitError } = await supabase
        .from('units')
        .select('id, building_id')
        .eq('resident_id', user.id)
        .limit(1);

      if (unitError) {
        console.error('❌ Error fetching unit:', unitError);
        throw unitError;
      }

      if (!unitsData || unitsData.length === 0) {
        Alert.alert(
          'Atenção',
          'Você não possui uma unidade vinculada. Entre em contato com o suporte.',
          [{ text: 'OK', onPress: onClose }]
        );
        return;
      }

      const unitData = unitsData[0];

      console.log('📦 Resident unit found:', {
        unitId: unitData.id,
        buildingId: unitData.building_id,
      });

      // Salvar apenas os IDs necessários para criar o ticket
      setUnitId(unitData.id);
      setBuildingId(unitData.building_id);

      // Verificar se há tickets concluídos sem avaliação (rating IS NULL)
      const { data: unratedTickets, error: unratedError } = await supabase
        .from('service_requests')
        .select('id')
        .eq('requester_id', user.id)
        .eq('status', 'completed')
        .is('rating', null);

      if (unratedError) {
        console.error('❌ Error fetching unrated tickets:', unratedError);
      } else {
        const count = unratedTickets?.length || 0;
        console.log('📋 Unrated completed tickets count:', count);
        setUnratedCount(count);
        setHasUnratedTickets(count > 0);

        if (count > 0) {
          console.warn('⚠️ Residente tem tickets não avaliados');
        }
      }

      console.log('✅ Unit and building IDs loaded');
    } catch (err) {
      console.error('❌ Error fetching resident unit:', err);
      Alert.alert('Erro', 'Não foi possível carregar suas informações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidentUnit();
  }, [user?.id]);

  const handleSubmit = async () => {
    console.log('🔘 Submit button pressed');
    console.log('📝 Form data:', { title, description, category, priority, unitId, buildingId });
    
    // Verificar se há tickets não avaliados
    if (hasUnratedTickets) {
      Alert.alert(
        'Avaliações Pendentes',
        `Você tem ${unratedCount} ticket(s) concluído(s) que precisa(m) ser avaliado(s) antes de criar novos tickets.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!title.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o título');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, preencha a descrição');
      return;
    }

    if (!unitId || !buildingId) {
      console.error('❌ Missing unitId or buildingId:', { unitId, buildingId });
      Alert.alert('Erro', 'Unidade não encontrada. Tente novamente.');
      return;
    }

    try {
      setSubmitting(true);
      console.log('📤 Creating request...');

      const { data, error } = await supabase
        .from('service_requests')
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            category: category,
            priority: priority,
            status: 'open',
            requester_id: user?.id,
            building_id: buildingId,
            unit_id: unitId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating request:', error);
        throw error;
      }

      console.log('✅ Request created successfully:', data);

      // Fechar o componente e atualizar a lista
      onRequestCreated?.();
      onClose();
      
      Alert.alert('Sucesso', 'Solicitação criada com sucesso!');
    } catch (err) {
      console.error('❌ Error creating request:', err);
      Alert.alert('Erro', `Não foi possível criar a solicitação: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions: { value: ServiceRequestCategory; label: string; icon: string }[] = [
    { value: 'electrical', label: 'Elétrico', icon: 'bolt' },
    { value: 'plumbing', label: 'Hidráulico', icon: 'tint' },
    { value: 'structural', label: 'Estrutural', icon: 'building' },
    { value: 'painting', label: 'Pintura', icon: 'paint-brush' },
    { value: 'hvac', label: 'Ar Condicionado', icon: 'snowflake-o' },
    { value: 'appliances', label: 'Eletrodomésticos', icon: 'plug' },
    { value: 'other', label: 'Outro', icon: 'ellipsis-h' },
  ];

  const priorityOptions: { value: ServiceRequestPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Baixa', color: colors.success },
    { value: 'normal', label: 'Normal', color: colors.secondary },
    { value: 'high', label: 'Alta', color: colors.warning },
    { value: 'urgent', label: 'Urgente', color: colors.danger },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>
          Carregando suas informações...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Header with Close Button */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Nova Solicitação</Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: colors.background,
          }}
        >
          <FontAwesome name="times" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Aviso de Tickets Não Avaliados */}
      {hasUnratedTickets && (
        <View
          style={{
            backgroundColor: colors.danger + '15',
            borderLeftWidth: 4,
            borderLeftColor: colors.danger,
            padding: 12,
            borderRadius: 6,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <FontAwesome name="exclamation-circle" size={18} color={colors.danger} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.danger,
                marginLeft: 8,
              }}
            >
              Avaliações Pendentes
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.text, marginBottom: 8, lineHeight: 18 }}>
            Você tem {unratedCount} ticket(s) concluído(s) que não foi(ram) avaliado(s).
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            ⚠️ Você não pode criar novas solicitações até que avalie todos os tickets concluídos.
          </Text>
        </View>
      )}

      {loading ? (
        <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>
            Carregando suas informações...
          </Text>
        </View>
      ) : hasUnratedTickets ? (
        <>
          {/* Mostrar formulário desabilitado */}
          <View style={{ opacity: 0.5 }}>
            {/* Title */}
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Vazamento no banheiro"
                editable={false}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Description */}
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>Descrição *</Text>
              <TextInput
                style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
                placeholder="Descreva o problema em detalhes..."
                editable={false}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* Submit Button - Desabilitado */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                opacity: 0.4,
                marginBottom: 32,
              },
            ]}
            disabled={true}
          >
            <Text style={styles.buttonText}>Criar Solicitação (Bloqueado)</Text>
          </TouchableOpacity>

          {/* Botão de Ação */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: colors.primary,
              padding: 14,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: '600', fontSize: 14 }}>
              Voltar para Avaliar Tickets
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Title */}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Vazamento no banheiro"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Descrição *</Text>
            <TextInput
              style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
              placeholder="Descreva o problema em detalhes..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Category */}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    {
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.white,
                      marginRight: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    },
                    category === option.value && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + '10',
                    },
                  ]}
                  onPress={() => setCategory(option.value)}
                >
                  <FontAwesome
                    name={option.icon as any}
                    size={16}
                    color={category === option.value ? colors.primary : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      {
                        fontSize: 12,
                        fontWeight: '500',
                        color: colors.text,
                      },
                      category === option.value && {
                        color: colors.primary,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Priority */}
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.label}>Prioridade</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 }}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    {
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: colors.border,
                      backgroundColor: colors.white,
                      flex: 1,
                      minWidth: '45%',
                      alignItems: 'center',
                    },
                    priority === option.value && {
                      borderColor: option.color,
                      backgroundColor: option.color + '20',
                    },
                  ]}
                  onPress={() => setPriority(option.value)}
                >
                  <Text
                    style={[
                      {
                        fontSize: 14,
                        fontWeight: '500',
                        color: colors.text,
                      },
                      priority === option.value && {
                        color: option.color,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                opacity: (submitting || !title.trim() || !description.trim() || !unitId || !buildingId) ? 0.5 : 1,
                marginBottom: 32,
              },
            ]}
            onPress={() => {
              console.log('🔘 Button onPress triggered');
              console.log('📊 Button state:', {
                submitting,
                hasTitle: !!title.trim(),
                hasDescription: !!description.trim(),
                hasUnitId: !!unitId,
                hasBuildingId: !!buildingId,
              });
              if (!submitting && title.trim() && description.trim() && unitId && buildingId) {
                handleSubmit();
              } else {
                console.warn('⚠️ Button press ignored - form not ready');
              }
            }}
            disabled={submitting || !title.trim() || !description.trim() || !unitId || !buildingId}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Criar Solicitação</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

