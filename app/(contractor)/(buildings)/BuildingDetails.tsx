import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';

interface BuildingDetailsProps {
  building: any; // Tipo real pode ser ajustado
  onClose: () => void;
  onBuildingDeleted?: () => void; // Callback para refetch após deletar
}

interface UnitWithTickets {
  id: string;
  unit_number: string;
  unit_code?: string;
  floor?: string;
  type?: string;
  resident_id?: string;
  resident_name?: string;
  resident_email?: string;
  tickets: any[];
}

export default function BuildingDetails({ building, onClose, onBuildingDeleted }: BuildingDetailsProps) {
  const [units, setUnits] = useState<UnitWithTickets[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [addingUnit, setAddingUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unit_number: '',
    floor: '',
    type: '',
    unit_code: '',
  });

  const fetchDetails = async () => {
    setLoading(true);
    try {
      // Buscar todas as units do building
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('id, unit_number, unit_code, floor, type, resident_id')
        .eq('building_id', building.id)
        .order('unit_number', { ascending: true });

      if (unitsError) throw unitsError;

      if (!unitsData || unitsData.length === 0) {
        setUnits([]);
        return;
      }

      // Buscar todos os tickets do building
      const { data: allTickets, error: ticketsError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('building_id', building.id);

      if (ticketsError) throw ticketsError;

      // Buscar dados dos residentes
      const residentIds = unitsData
        .map((u: any) => u.resident_id)
        .filter((id: string | null) => id !== null);
      
      let residentsMap = new Map();
      if (residentIds.length > 0) {
        const { data: residentsData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', residentIds);

        if (residentsData) {
          residentsData.forEach((resident: any) => {
            residentsMap.set(resident.id, {
              name: resident.full_name,
              email: resident.email,
            });
          });
        }
      }

      // Agrupar tickets por unit e criar estrutura de units com tickets
      const unitsWithTickets: UnitWithTickets[] = unitsData.map((unit: any) => {
        const unitTickets = (allTickets || []).filter(
          (ticket: any) => ticket.unit_id === unit.id
        );

        const resident = unit.resident_id ? residentsMap.get(unit.resident_id) : null;

        return {
          id: unit.id,
          unit_number: unit.unit_number,
          unit_code: unit.unit_code,
          floor: unit.floor,
          type: unit.type,
          resident_id: unit.resident_id,
          resident_name: resident?.name,
          resident_email: resident?.email,
          tickets: unitTickets,
        };
      });

      setUnits(unitsWithTickets);

      // Buscar histórico de manutenção
    } catch (err) {
      console.error('Erro ao buscar detalhes do prédio:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar código único para unidade no formato CP-004-CDEF
  const generateUnitCode = async (): Promise<string> => {
    try {
      // 1. Buscar o próximo número sequencial para este prédio
      const { data: existingUnits, error } = await supabase
        .from('units')
        .select('unit_code')
        .eq('building_id', building.id)
        .not('unit_code', 'is', null);

      if (error) {
        console.error('Erro ao buscar unidades existentes:', error);
      }

      // Extrair números sequenciais dos códigos existentes no formato CP-XXX-XXXX
      const existingNumbers: number[] = [];
      if (existingUnits) {
        existingUnits.forEach((unit: any) => {
          if (unit.unit_code) {
            // Extrair o número do formato CP-XXX-XXXX
            const match = unit.unit_code.match(/^CP-(\d{3})-[A-Z0-9]{4}$/);
            if (match) {
              existingNumbers.push(parseInt(match[1], 10));
            }
          }
        });
      }

      // Encontrar o próximo número disponível
      let nextNumber = 1;
      while (existingNumbers.includes(nextNumber)) {
        nextNumber++;
      }

      // 2. Gerar parte aleatória (4 caracteres alfanuméricos)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 4; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // 3. Formar o código final: CP-XXX-XXXX
      const sequentialPart = nextNumber.toString().padStart(3, '0');
      const unitCode = `CP-${sequentialPart}-${randomPart}`;

      console.log('🏷️ [UNIT_CODE] Generated unit code:', {
        buildingId: building.id,
        nextNumber,
        sequentialPart,
        randomPart,
        finalCode: unitCode
      });

      return unitCode;
    } catch (err) {
      console.error('Erro ao gerar código da unidade:', err);
      // Fallback: gerar código simples se houver erro
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let fallbackCode = 'CP-001-';
      for (let i = 0; i < 4; i++) {
        fallbackCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return fallbackCode;
    }
  };

  // Função para verificar se o código da unidade já existe
  const checkUnitCodeExists = async (code: string): Promise<boolean> => {
    try {
      console.log('🔍 [UNIT_CODE] Checking if code exists:', code);

      const { data, error } = await supabase
        .from('units')
        .select('id')
        .eq('unit_code', code)
        .limit(1);

      if (error) {
        console.error('❌ [UNIT_CODE] Error checking code:', error);
        return false;
      }

      const exists = data && data.length > 0;
      console.log('✅ [UNIT_CODE] Code check result:', { code, exists });
      
      return exists;
    } catch (err) {
      console.error('❌ [UNIT_CODE] Unexpected error checking code:', err);
      return false;
    }
  };

  // Função para gerar código único
  const generateUniqueUnitCode = async (): Promise<string> => {
    console.log('🚀 [UNIT_CODE] Starting unique code generation for building:', building.id);
    
    let code: string;
    let codeExists: boolean;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = await generateUnitCode();
      codeExists = await checkUnitCodeExists(code);
      attempts++;

      console.log('🔄 [UNIT_CODE] Generation attempt:', {
        attempt: attempts,
        generatedCode: code,
        codeExists,
        maxAttempts
      });

      if (attempts >= maxAttempts) {
        console.error('❌ [UNIT_CODE] Max attempts reached');
        throw new Error('Não foi possível gerar um código único após várias tentativas');
      }
    } while (codeExists);

    console.log('✅ [UNIT_CODE] Unique code generated successfully:', code);
    return code;
  };

  // Função para validar formato do código manual
  const validateUnitCodeFormat = (code: string): boolean => {
    // Formato esperado: CP-XXX-XXXX
    const regex = /^CP-\d{3}-[A-Z0-9]{4}$/;
    return regex.test(code);
  };

  // Função para adicionar unidade
  const handleAddUnit = async () => {
    console.log('📝 [ADD_UNIT] Starting unit addition process');
    
    if (!unitForm.unit_number.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o número da unidade');
      return;
    }

    setAddingUnit(true);
    try {
      // Gerar código único se não fornecido
      let unitCode = unitForm.unit_code.trim().toUpperCase();
      
      if (!unitCode) {
        console.log('🔧 [ADD_UNIT] No code provided, generating automatically');
        unitCode = await generateUniqueUnitCode();
      } else {
        console.log('🔧 [ADD_UNIT] Manual code provided:', unitCode);
        
        // Validar formato do código fornecido
        if (!validateUnitCodeFormat(unitCode)) {
          Alert.alert(
            'Erro', 
            'O código deve estar no formato CP-XXX-XXXX\n(Ex: CP-001-ABCD)'
          );
          setAddingUnit(false);
          return;
        }
        
        // Verificar se o código fornecido já existe
        const codeExists = await checkUnitCodeExists(unitCode);
        if (codeExists) {
          Alert.alert('Erro', 'Este código de unidade já está em uso. Tente outro.');
          setAddingUnit(false);
          return;
        }
      }

      console.log('💾 [ADD_UNIT] Inserting unit with data:', {
        building_id: building.id,
        unit_number: unitForm.unit_number.trim(),
        floor: unitForm.floor.trim() || null,
        type: unitForm.type.trim() || null,
        unit_code: unitCode
      });

      const { error } = await supabase
        .from('units')
        .insert([
          {
            building_id: building.id,
            unit_number: unitForm.unit_number.trim(),
            floor: unitForm.floor.trim() || null,
            type: unitForm.type.trim() || null,
            unit_code: unitCode
          },
        ]);

      if (error) {
        console.error('❌ [ADD_UNIT] Database error:', error);
        throw error;
      }

      console.log('✅ [ADD_UNIT] Unit created successfully with code:', unitCode);
      
      Alert.alert('Sucesso', `Unidade cadastrada com sucesso!\nCódigo: ${unitCode}`);
      setShowAddUnit(false);
      setUnitForm({ unit_number: '', floor: '', type: '', unit_code: '' });
      fetchDetails(); // Recarregar lista de unidades
    } catch (err) {
      console.error('❌ [ADD_UNIT] Error creating unit:', err);
      Alert.alert('Erro', 'Não foi possível cadastrar a unidade.');
    } finally {
      setAddingUnit(false);
    }
  };

  // Função para deletar unidade
  const deleteUnit = async (unitId: string) => {
    try {
      console.log('🔄 [DELETE_UNIT] Iniciando exclusão da unidade:', unitId);
      setDeletingUnitId(unitId);
      
      // Verificar se a unidade tem tickets associados
      const { data: tickets, error: ticketsError } = await supabase
        .from('service_requests')
        .select('id')
        .eq('unit_id', unitId)
        .limit(1);

      if (ticketsError) {
        console.error('❌ [DELETE_UNIT] Erro ao verificar tickets:', ticketsError);
        throw ticketsError;
      }

      if (tickets && tickets.length > 0) {
        console.log('⚠️ [DELETE_UNIT] Unidade possui tickets associados');
        Alert.alert(
          'Erro',
          'Não é possível excluir esta unidade pois ela possui tickets associados.'
        );
        setDeletingUnitId(null);
        return;
      }

      console.log('✅ [DELETE_UNIT] Nenhum ticket encontrado, prosseguindo com exclusão');

      // Deletar a unidade
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);

      if (error) {
        console.error('❌ [DELETE_UNIT] Erro ao deletar unidade:', error);
        throw error;
      }

      console.log('✅ [DELETE_UNIT] Unidade excluída com sucesso');
      Alert.alert('Sucesso', 'Unidade excluída com sucesso!');
      fetchDetails(); // Recarregar lista de unidades
    } catch (err) {
      console.error('❌ [DELETE_UNIT] Erro ao excluir unidade:', err);
      Alert.alert('Erro', 'Não foi possível excluir a unidade.');
    } finally {
      setDeletingUnitId(null);
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

      {/* Nome e Endereço */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
        {building.name}
      </Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>{building.address}</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>{building.description}</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>{building.zip_code}</Text>

      {/* Unidades */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
          Unidades
        </Text>
        <TouchableOpacity
          onPress={() => setShowAddUnit(true)}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <FontAwesome name="plus" size={14} color="white" style={{ marginRight: 4 }} />
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Adicionar</Text>
        </TouchableOpacity>
      </View>
      
      {units.length > 0 ? (
        units.map((unit) => (
          <View key={unit.id} style={[styles.card, { marginBottom: 16 }]}>
            {/* Informações da Unidade */}
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <FontAwesome name="home" size={20} color={colors.primary} />
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginLeft: 8 }}>
                    Unidade {unit.unit_number}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    console.log('👆 [DELETE_BUTTON] TouchableOpacity pressionado para unidade:', unit.id);
                    deleteUnit(unit.id);
                  }}
                  disabled={deletingUnitId === unit.id}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    backgroundColor: deletingUnitId === unit.id ? colors.textSecondary + '30' : '#ff4444' + '20',
                    marginLeft: 8,
                    minWidth: 32,
                    minHeight: 32,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {deletingUnitId === unit.id ? (
                    <ActivityIndicator size="small" color="#ff4444" />
                  ) : (
                    <FontAwesome name="trash" size={16} color="#ff4444" />
                  )}
                </TouchableOpacity>
              </View>
              
              {unit.unit_code && (
                <View style={{ 
                  backgroundColor: colors.primary + '20', 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  borderRadius: 4, 
                  alignSelf: 'flex-start',
                  marginTop: 4,
                  marginBottom: 8
                }}>
                  <Text style={{ 
                    fontSize: 12, 
                    fontWeight: '600',
                    color: colors.primary,
                    fontFamily: 'monospace'
                  }}>
                    {unit.unit_code}
                  </Text>
                </View>
              )}
              
              {unit.floor && (
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                  Andar: {unit.floor}
                </Text>
              )}
              {unit.type && (
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                  Tipo: {unit.type}
                </Text>
              )}
              
              {/* Informações do Residente */}
              {unit.resident_name && (
                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <FontAwesome name="user" size={16} color={colors.textSecondary} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginLeft: 6 }}>
                      {unit.resident_name}
                    </Text>
                  </View>
                  {unit.resident_email && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 22 }}>
                      {unit.resident_email}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Tickets da Unidade */}
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                Tickets ({unit.tickets.length})
              </Text>
              {unit.tickets.length > 0 ? (
                unit.tickets.map((ticket) => (
                  <View
                    key={ticket.id}
                    style={{
                      backgroundColor: colors.background,
                      padding: 12,
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>
                      {ticket.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                      {ticket.description}
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
                      <View
                        style={{
                          backgroundColor: getStatusColor(ticket.status),
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                          marginRight: 8,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '600', color: 'white' }}>
                          {getStatusLabel(ticket.status)}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' }}>
                  Nenhum ticket nesta unidade
                </Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>Nenhuma unidade encontrada.</Text>
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

      {/* Modal para adicionar unidade */}
      <Modal
        visible={showAddUnit}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddUnit(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              Adicionar Unidade
            </Text>

            <Text style={styles.label}>Número da Unidade *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 101, 202, A1"
              value={unitForm.unit_number}
              onChangeText={(text) => setUnitForm({ ...unitForm, unit_number: text })}
              editable={!addingUnit}
            />

            <Text style={styles.label}>Andar (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 1, 2, 3"
              value={unitForm.floor}
              onChangeText={(text) => setUnitForm({ ...unitForm, floor: text })}
              editable={!addingUnit}
            />

            <Text style={styles.label}>Tipo (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Apartamento, Loja, Sala"
              value={unitForm.type}
              onChangeText={(text) => setUnitForm({ ...unitForm, type: text })}
              editable={!addingUnit}
            />

            <Text style={styles.label}>Código da Unidade (opcional)</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
              Formato: CP-XXX-XXXX (Ex: CP-001-ABCD)
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
              Deixe em branco para gerar automaticamente
            </Text>
            <TextInput
              style={[styles.input, { fontFamily: 'monospace' }]}
              placeholder="CP-001-ABCD"
              value={unitForm.unit_code}
              onChangeText={(text) => {
                // Permitir apenas o formato correto
                const upperText = text.toUpperCase();
                setUnitForm({ ...unitForm, unit_code: upperText });
              }}
              autoCapitalize="characters"
              editable={!addingUnit}
              maxLength={11} // CP-XXX-XXXX = 11 caracteres
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddUnit(false);
                  setUnitForm({ unit_number: '', floor: '', type: '', unit_code: '' });
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  backgroundColor: colors.textSecondary,
                }}
                disabled={addingUnit}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddUnit}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  backgroundColor: colors.primary,
                  opacity: addingUnit ? 0.6 : 1,
                }}
                disabled={addingUnit}
              >
                {addingUnit ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '600' }}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    case 'closed': return '#6b7280';
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
    case 'closed': return 'Fechado';
    default: return status;
  }
};