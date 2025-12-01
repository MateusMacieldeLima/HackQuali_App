import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, statusColors, styles } from '../../../src/styles/authStyles';
import { supabase } from '../../../src/supabase';

interface TechnicianDetailsProps {
  technician: {
    id: string;
    name: string;
    email: string;
    phone_number?: string;
    cpf?: string;
  };
  onClose: () => void;
}

interface ServiceRequestWithDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  created_at: string;
  completed_at?: string;
  building_name: string;
  unit_number: string;
}

export default function TechnicianDetails({
  technician,
  onClose,
}: TechnicianDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [activeTasks, setActiveTasks] = useState<ServiceRequestWithDetails[]>([]);
  const [completedTasks, setCompletedTasks] = useState<ServiceRequestWithDetails[]>([]);

  const fetchTechnicianDetails = async () => {
    try {
      setLoading(true);

      // Buscar tarefas ativas (assigned ou in_progress)
      const { data: activeData, error: activeError } = await supabase
        .from('service_requests')
        .select('id, title, description, status, priority, category, created_at, completed_at, building_id, unit_id')
        .eq('assigned_to', technician.id)
        .in('status', ['assigned', 'in_progress'])
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      // Buscar tarefas concluídas (completed ou closed)
      const { data: completedData, error: completedError } = await supabase
        .from('service_requests')
        .select('id, title, description, status, priority, category, created_at, completed_at, building_id, unit_id')
        .eq('assigned_to', technician.id)
        .in('status', ['completed', 'closed'])
        .order('completed_at', { ascending: false })
        .limit(50); // Limitar a 50 tarefas concluídas mais recentes

      if (completedError) throw completedError;

      // Buscar dados dos buildings e units para as tarefas ativas
      const activeBuildingIds = [...new Set((activeData || []).map((t: any) => t.building_id))];
      const activeUnitIds = [...new Set((activeData || []).map((t: any) => t.unit_id))];

      const { data: activeBuildings } = await supabase
        .from('buildings')
        .select('id, name')
        .in('id', activeBuildingIds);

      const { data: activeUnits } = await supabase
        .from('units')
        .select('id, unit_number')
        .in('id', activeUnitIds);

      // Buscar dados dos buildings e units para as tarefas concluídas
      const completedBuildingIds = [...new Set((completedData || []).map((t: any) => t.building_id))];
      const completedUnitIds = [...new Set((completedData || []).map((t: any) => t.unit_id))];

      const { data: completedBuildings } = await supabase
        .from('buildings')
        .select('id, name')
        .in('id', completedBuildingIds);

      const { data: completedUnits } = await supabase
        .from('units')
        .select('id, unit_number')
        .in('id', completedUnitIds);

      // Criar mapas para lookup rápido
      const buildingMap = new Map<string, string>();
      (activeBuildings || []).forEach((b: any) => buildingMap.set(b.id, b.name));
      (completedBuildings || []).forEach((b: any) => buildingMap.set(b.id, b.name));
      
      const unitMap = new Map<string, string>();
      (activeUnits || []).forEach((u: any) => unitMap.set(u.id, u.unit_number));
      (completedUnits || []).forEach((u: any) => unitMap.set(u.id, u.unit_number));

      // Mapear tarefas ativas
      const mappedActiveTasks: ServiceRequestWithDetails[] = (activeData || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        created_at: task.created_at,
        completed_at: task.completed_at,
        building_name: (buildingMap.get(task.building_id) as string) || 'N/A',
        unit_number: (unitMap.get(task.unit_id) as string) || 'N/A',
      }));

      // Mapear tarefas concluídas
      const mappedCompletedTasks: ServiceRequestWithDetails[] = (completedData || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        created_at: task.created_at,
        completed_at: task.completed_at,
        building_name: (buildingMap.get(task.building_id) as string) || 'N/A',
        unit_number: (unitMap.get(task.unit_id) as string) || 'N/A',
      }));

      setActiveTasks(mappedActiveTasks);
      setCompletedTasks(mappedCompletedTasks);
    } catch (err) {
      console.error('Erro ao buscar detalhes do técnico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicianDetails();
  }, [technician.id]);

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      open: 'Aberta',
      assigned: 'Atribuída',
      in_progress: 'Em Progresso',
      completed: 'Concluída',
      closed: 'Fechada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: { [key: string]: string } = {
      low: 'Baixa',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return labels[priority] || priority;
  };

  const renderTaskItem = ({ item }: { item: ServiceRequestWithDetails }) => {
    const statusColor = statusColors[item.status] || colors.textSecondary;

    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
              {item.title}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
              {item.description}
            </Text>
            <Text style={{ fontSize: 11, color: colors.primary, marginBottom: 2 }}>
              🏢 {item.building_name} - Unidade {item.unit_number}
            </Text>
            {item.category && (
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
                📁 {item.category}
              </Text>
            )}
          </View>
        </View>

        <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={[styles.badgeText, { color: colors.white }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.textSecondary + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {getPriorityLabel(item.priority)}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
            {item.completed_at
              ? `Concluída: ${new Date(item.completed_at).toLocaleDateString('pt-BR')}`
              : `Criada: ${new Date(item.created_at).toLocaleDateString('pt-BR')}`}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Botão de Voltar */}
        <TouchableOpacity onPress={onClose} style={{ marginBottom: 16 }}>
          <FontAwesome name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Informações do Técnico */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}
            >
              <FontAwesome name="user" size={24} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                {technician.name}
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                Técnico
              </Text>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                Email
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                📧 {technician.email}
              </Text>
            </View>

            {technician.phone_number && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                  Telefone
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                  📱 {technician.phone_number}
                </Text>
              </View>
            )}

            {technician.cpf && (
              <View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                  CPF
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                  🆔 {technician.cpf}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Estatísticas */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary }}>
              {activeTasks.length}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              Tarefas Ativas
            </Text>
          </View>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.success }}>
              {completedTasks.length}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              Tarefas Concluídas
            </Text>
          </View>
        </View>

        {/* Tarefas Ativas */}
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
          Tarefas Ativas
        </Text>
        {activeTasks.length > 0 ? (
          <>
            {activeTasks.map((item) => (
              <View key={item.id} style={{ marginBottom: 12 }}>
                {renderTaskItem({ item })}
              </View>
            ))}
          </>
        ) : (
          <View style={[styles.card, { padding: 24, alignItems: 'center' }]}>
            <FontAwesome name="check-circle" size={32} color={colors.textSecondary} />
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
              Nenhuma tarefa ativa no momento
            </Text>
          </View>
        )}

        {/* Tarefas Concluídas */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          Tarefas Concluídas
        </Text>
        {completedTasks.length > 0 ? (
          <>
            {completedTasks.map((item) => (
              <View key={item.id} style={{ marginBottom: 12 }}>
                {renderTaskItem({ item })}
              </View>
            ))}
          </>
        ) : (
          <View style={[styles.card, { padding: 24, alignItems: 'center' }]}>
            <FontAwesome name="history" size={32} color={colors.textSecondary} />
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
              Nenhuma tarefa concluída ainda
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

