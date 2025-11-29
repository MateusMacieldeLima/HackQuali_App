import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [unit, setUnit] = useState<any>(null);
  const [building, setBuilding] = useState<any>(null);

  useEffect(() => {
    fetchUnitInfo();
  }, [user?.id]);

  const fetchUnitInfo = async () => {
    try {
      if (!user?.id) return;

      // Get user unit information
      const { data: userData } = await supabase
        .from('users')
        .select('unitId, buildingId')
        .eq('id', user.id)
        .single();

      if (userData?.unitId) {
        const { data: unitData } = await supabase
          .from('units')
          .select('*')
          .eq('id', userData.unitId)
          .single();

        setUnit(unitData);

        if (userData.buildingId) {
          const { data: buildingData } = await supabase
            .from('buildings')
            .select('*')
            .eq('id', userData.buildingId)
            .single();

          setBuilding(buildingData);
        }
      }
    } catch (err) {
      console.error('Error fetching unit info:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (err) {
      Alert.alert('Erro', 'Falha ao desconectar');
    }      
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <FontAwesome name="user" size={24} color="white" />
        </View>
        <Text style={styles.headerTitle}>{user?.name}</Text>
        <Text style={styles.headerSubtitle}>{user?.email}</Text>
      </View>

      {/* Personal Information */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.text }}>
          Informações Pessoais
        </Text>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <FontAwesome name="envelope" size={16} color={colors.primary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Email</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {user?.email}
              </Text>
            </View>
          </View>
          {user?.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome name="phone" size={16} color={colors.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Telefone</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                  {user.phone}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Unit Information */}
      {building && unit && (
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.text }}>
            Informações da Unidade
          </Text>
          <View style={styles.card}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Empreendimento</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {building.name}
              </Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Unidade</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {unit.unitNumber}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Endereço</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {building.address}, {building.city} - {building.state}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <TouchableOpacity
          style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}
        >
          <FontAwesome name="lock" size={20} color={colors.primary} />
          <Text style={{ marginLeft: 12, fontSize: 14, fontWeight: '600', color: colors.text }}>
            Alterar Senha
          </Text>
          <FontAwesome
            name="chevron-right"
            size={16}
            color={colors.textSecondary}
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}
        >
          <FontAwesome name="bell" size={20} color={colors.primary} />
          <Text style={{ marginLeft: 12, fontSize: 14, fontWeight: '600', color: colors.text }}>
            Notificações
          </Text>
          <FontAwesome
            name="chevron-right"
            size={16}
            color={colors.textSecondary}
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}
        >
          <FontAwesome name="question-circle" size={20} color={colors.primary} />
          <Text style={{ marginLeft: 12, fontSize: 14, fontWeight: '600', color: colors.text }}>
            Ajuda e Suporte
          </Text>
          <FontAwesome
            name="chevron-right"
            size={16}
            color={colors.textSecondary}
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={{ paddingHorizontal: 16, marginBottom: 40 }}>
        <TouchableOpacity
          style={{
            backgroundColor: colors.danger,
            padding: 14,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
              Desconectar
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
