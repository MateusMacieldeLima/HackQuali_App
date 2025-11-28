import { FontAwesome } from '@expo/vector-icons';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { colors } from '../../../src/styles/authStyles';

export default function ContractorTabLayout() {
  const screenOptions: BottomTabNavigationOptions = {
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: {
      backgroundColor: colors.white,
      borderTopColor: colors.border,
      borderTopWidth: 1,
    },
    headerShown: true,
    headerStyle: {
      backgroundColor: colors.white,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
      fontWeight: '600',
    },
  };

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
          headerTitle: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Chamados',
          tabBarIcon: ({ color }) => <FontAwesome name="tasks" size={24} color={color} />,
          headerTitle: 'Gerenciar Chamados',
        }}
      />
      <Tabs.Screen
        name="buildings"
        options={{
          title: 'Empreendimentos',
          tabBarIcon: ({ color }) => <FontAwesome name="building" size={24} color={color} />,
          headerTitle: 'Empreendimentos',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
          headerTitle: 'Meu Perfil',
        }}
      />
    </Tabs>
  );
}
