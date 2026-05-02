import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../shared/theme/colors';

import type { MainTabParamList, RootStackParamList } from './types';
import { TabBar } from '../shared/ui/TabBar';

// Use actual screens if available, otherwise placeholders
import AuthScreen from '../features/auth/screens/AuthScreen';
import HomeScreen from '../features/memo/screens/HomeScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';
import AddMemoScreen from '../features/memo/screens/AddMemoScreen';
import MemoLibraryScreen from '../features/memo/screens/MemoLibraryScreen';
import ReviewSessionScreen from '../features/srs/screens/ReviewSessionScreen';
import MohkamSessionScreen from '../features/srs/screens/MohkamSessionScreen';
import NoterHomeScreen from '../features/memo/screens/NoterHomeScreen';
import AddNoterBookScreen from '../features/memo/screens/AddNoterBookScreen';
import NoterDetailScreen from '../features/memo/screens/NoterDetailScreen';

import { useAuthStore } from '../features/auth/store/auth.store';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>{title}</Text>
      <Text style={styles.placeholderSubText}>قريباً</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="QuranTab" children={() => <PlaceholderScreen title="القرآن" />} />
      <Tab.Screen name="CenterFabPlaceholder" children={() => null} />
      <Tab.Screen name="NoterTab" component={NoterHomeScreen} />
      <Tab.Screen name="ToolsTab" children={() => <PlaceholderScreen title="الإعدادات" />} />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.primary },
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ presentation: 'card' }} />
      <Stack.Screen name="AddMemoScreen" component={AddMemoScreen} />
      <Stack.Screen name="MemoLibraryScreen" component={MemoLibraryScreen} />
      <Stack.Screen name="ReviewSessionScreen" component={ReviewSessionScreen} />
      <Stack.Screen name="MohkamSessionScreen" component={MohkamSessionScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="AddNoterBookScreen" component={AddNoterBookScreen} />
      <Stack.Screen name="NoterDetailScreen" component={NoterDetailScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isGuest } = useAuthStore();
  const isAuthenticated = user !== null || isGuest;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.primary } }}>
        {!isAuthenticated ? (
          <Stack.Screen name="AuthScreen" component={AuthScreen} />
        ) : (
          <Stack.Screen name="AppStack" component={AppStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  placeholderText: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  placeholderSubText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
  },
});
