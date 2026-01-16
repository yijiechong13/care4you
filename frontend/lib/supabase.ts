import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vxnqxhpccaezcimbgywa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4bnF4aHBjY2FlemNpbWJneXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzcxOTMsImV4cCI6MjA4NDA1MzE5M30.SD0JigksAQRX8Vxvof7tfCzUEIPiunlkUM2vaN63Lvw';

// 1. Create a Custom Storage Adapter
const ExpoStorage = {
  getItem: (key: string) => {
    // If on server (no window), return null immediately
    if (typeof window === 'undefined') return Promise.resolve(null);
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    // If on server, do nothing
    if (typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    // If on server, do nothing
    if (typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 2. Use the Custom Adapter instead of raw AsyncStorage
    storage: ExpoStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});