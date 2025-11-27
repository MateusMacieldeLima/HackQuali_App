import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Fallback hardcoded values
const SUPABASE_URL = 'https://djnzhlvkaatcsavgshzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbnpobHZrYWF0Y3NhdmdzaHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTc0OTYsImV4cCI6MjA3OTYzMzQ5Nn0.-Uoy6rsZV_4LSVWqFqP_7U0ZnmUHR4XynDiDjkRKOfU';

// Prefer config from Expo Constants (app.config.js/app.json extra)
const extras = (Constants.expoConfig && Constants.expoConfig.extra) || (Constants.manifest && Constants.manifest.extra) || {};

const supabaseUrl = extras.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = extras.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

console.log('🔧 Supabase Config:');
console.log('  URL:', supabaseUrl);
console.log('  Key configured:', !!supabaseAnonKey);
console.log('  Key length:', supabaseAnonKey?.length);
console.log('  From extras:', !!extras.EXPO_PUBLIC_SUPABASE_URL);
console.log('  From env:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);