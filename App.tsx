import React, { useEffect } from 'react';
import { I18nManager, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler';

import './src/shared/i18n'; // initialize i18n
import { useAuthStore } from './src/features/auth/store/auth.store';
import RootNavigator from './src/navigation/RootNavigator';
import { initDatabase } from './src/infrastructure/db/client';
import { flushSyncQueue } from './src/features/sync/offlineQueue';

import { useFonts } from 'expo-font';
import { 
  Cairo_400Regular, 
  Cairo_600SemiBold, 
  Cairo_700Bold, 
  Cairo_800ExtraBold 
} from '@expo-google-fonts/cairo';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import { ScheherazadeNew_400Regular } from '@expo-google-fonts/scheherazade-new';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const settingsStr = storage.getString('mahfod_settings');
let isArabic = true;
if (settingsStr) {
  try {
    const settings = JSON.parse(settingsStr);
    isArabic = settings.language === 'ar';
  } catch (e) { }
}

// Force RTL only if the user's language is Arabic
I18nManager.allowRTL(isArabic);
I18nManager.forceRTL(isArabic);

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
    let appStateSubscription: any;
    
    async function setupApp() {
      await initDatabase();
      initializeAuth();
      
      // Flush immediately on startup
      flushSyncQueue().catch(console.error);

      // Safe background sync via AppState
      appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          flushSyncQueue().catch(console.error);
        }
      });
    }
    setupApp();

    return () => {
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
    };
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
