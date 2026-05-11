import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, spacing, typography, fonts } from '../shared/theme';
import { MText } from '../shared/ui/MText';

import type { MainTabParamList, RootStackParamList } from './types';
import { TabBar } from '../shared/ui/TabBar';
import { MahfodAlert } from '../shared/ui/MahfodAlert';

// Use actual screens if available, otherwise placeholders
import AuthScreen from '../features/auth/screens/AuthScreen';
import HomeScreen from '../features/memo/screens/HomeScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';
import AddMemoScreen from '../features/memo/screens/AddMemoScreen';
import MemoLibraryScreen from '../features/memo/screens/MemoLibraryScreen';
import ReviewSessionScreen from '../features/srs/screens/ReviewSessionScreen';
import LearningSessionScreen from '../features/srs/screens/LearningSessionScreen';
import MohkamSessionScreen from '../features/srs/screens/MohkamSessionScreen';
import NoterHomeScreen from '../features/memo/screens/NoterHomeScreen';
import AddNoterBookScreen from '../features/memo/screens/AddNoterBookScreen';
import NoterDetailScreen from '../features/memo/screens/NoterDetailScreen';
import MemoViewScreen from '../features/memo/screens/MemoViewScreen';

import { useAuthStore } from '../features/auth/store/auth.store';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.placeholderContainer}>
      <MText weight="bold" style={styles.placeholderText}>{title}</MText>
      <MText weight="regular" style={styles.placeholderSubText}>قريباً</MText>
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
      <Tab.Screen name="ToolsTab" children={() => <PlaceholderScreen title="الأدوات" />} />
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
      <Stack.Screen name="LearningSessionScreen" component={LearningSessionScreen} />
      <Stack.Screen name="MohkamSessionScreen" component={MohkamSessionScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="AddNoterBookScreen" component={AddNoterBookScreen} />
      <Stack.Screen name="NoterDetailScreen" component={NoterDetailScreen} />
      <Stack.Screen name="MemoViewScreen" component={MemoViewScreen} />
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
      <MahfodAlert />
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
    ...typography.h1,
    color: colors.textPrimary,
  },
  placeholderSubText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
