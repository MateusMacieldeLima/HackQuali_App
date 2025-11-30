import { FontAwesome } from '@expo/vector-icons';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { colors } from '../../../src/styles/authStyles';

export default function TechnicianTabLayout() {
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
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color }) => <FontAwesome name="tasks" size={24} color={color} />,
          headerTitle: 'Meus Tickets',
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

