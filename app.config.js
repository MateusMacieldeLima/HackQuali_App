import fs from 'fs';
import path from 'path';

// Lê o arquivo .env.local diretamente
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse manual das variáveis
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key] = valueParts.join('=');
  }
});

module.exports = {
  expo: {
    name: 'HackQuali',
    slug: 'hackquali-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    plugins: ['expo-router'],
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
      },
      package: 'com.hackquali.app',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    extra: {
      // Injeta as variáveis do .env.local aqui
      EXPO_PUBLIC_SUPABASE_URL: envVars.EXPO_PUBLIC_SUPABASE_URL || '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
  },
};
