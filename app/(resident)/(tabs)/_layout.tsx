import { FontAwesome } from '@expo/vector-icons';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { colors } from '../../../src/styles/authStyles';

export default function ResidentTabLayout() {
  const screenOptions: BottomTabNavigationOptions = {
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: {
      backgroundColor: colors.white,
      borderTopColor: colors.primary,
      borderTopWidth: 1,
    },
    headerShown: true,
    headerStyle: {
      backgroundColor: colors.white,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
    },
    headerTintColor: colors.primary,
    headerTitleStyle: {
      fontWeight: '600',
    },
  };

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
          headerTitle: 'HackQuali',
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Solicitações',
          tabBarIcon: ({ color }) => <FontAwesome name="list" size={24} color={color} />,
          headerTitle: 'Minhas Solicitações',
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Agendamentos',
          tabBarIcon: ({ color }) => <FontAwesome name="calendar" size={24} color={color} />,
          headerTitle: 'Agendamentos',
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
