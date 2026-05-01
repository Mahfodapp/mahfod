import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler';

import './src/i18n'; // initialize i18n
import { useAuthStore } from './src/store/auth.store';
import RootNavigator from './src/navigation/RootNavigator';
import { initDatabase } from './src/db/client';
import { flushSyncQueue } from './src/services/offlineQueue';

import { useFonts } from 'expo-font';
import { 
  Cairo_400Regular, 
  Cairo_600SemiBold, 
  Cairo_700Bold, 
  Cairo_800ExtraBold 
} from '@expo-google-fonts/cairo';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import { ScheherazadeNew_400Regular } from '@expo-google-fonts/scheherazade-new';

// Force RTL for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function App() {
  const initializeAuth = useAuthStore((s) => s.initialize);

  let [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
    Amiri_400Regular,
    ScheherazadeNew_400Regular,
  });

  useEffect(() => {
    async function setupApp() {
      await initDatabase();
      initializeAuth();
      
      // Attempt background sync every 30 seconds
      setInterval(() => {
        flushSyncQueue().catch(console.error);
      }, 30000);
      
      // Flush immediately on startup
      flushSyncQueue().catch(console.error);
    }
    setupApp();
  }, [initializeAuth]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
