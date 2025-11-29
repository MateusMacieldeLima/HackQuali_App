import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import AddBuildingForm from '../(buildings)/AddBuilding';
import BuildingDetails from '../(buildings)/BuildingDetails';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';
import { Building } from '../../../src/types';


export default function ContractorBuildingsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  const fetchBuildings = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuildings(data || []);
    } catch (err) {
      console.error('Error fetching buildings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBuildings();
  };

  const toggleAddBuilding = () => {
    setShowAddBuilding(!showAddBuilding); // Alterna entre mostrar/ocultar o formulário
  };

  const renderBuildingItem = (building: Building) => (
    <TouchableOpacity 
    key={building.id} 
    style={styles.card}
    onPress={() => setSelectedBuilding(building)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4, color: colors.text }}>
            {building.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
            {building.address}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {building.city}, {building.state}
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={16} color={colors.textSecondary} />
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
      {showAddBuilding ? (
        // Renderiza o formulário para adicionar prédio no lugar da lista
        <AddBuildingForm
          onClose={toggleAddBuilding}
          onBuildingAdded={fetchBuildings} // Atualiza a lista ao adicionar
        />
      ) : selectedBuilding ? (
        <BuildingDetails
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)} // Fecha os detalhes
        />
      ) : (
        <>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <TouchableOpacity
          onPress={toggleAddBuilding}
          style={{
            backgroundColor: colors.primary,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
            + Novo Empreendimento
          </Text>
        </TouchableOpacity>
      </View>

      {buildings.length > 0 ? (
        <FlatList
          data={buildings}
          renderItem={({ item }) => renderBuildingItem(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
          <FontAwesome name="building" size={48} color={colors.textSecondary} />
          <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.text }}>
            Nenhum empreendimento
          </Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
            Crie seu primeiro empreendimento
          </Text>
          
        </View>
         )}
        </>
      )}
    </View>
  );
}
