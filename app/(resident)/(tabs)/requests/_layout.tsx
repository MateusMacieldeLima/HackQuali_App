import { Stack } from 'expo-router';
import { colors } from '../../../../src/styles/authStyles';

export default function RequestsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // Já tem header no tab layout
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'Nova Solicitação',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalhes da Solicitação',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}

