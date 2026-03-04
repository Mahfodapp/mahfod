import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useMemoStore } from './src/store/useMemoStore';
import { colors } from './src/theme/colors';

import HomeScreen from './src/screens/HomeScreen';
import AddMemoScreen from './src/screens/AddMemoScreen';
import LearnScreen from './src/screens/LearnScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import TestScreen from './src/screens/TestScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MemoListScreen from './src/screens/MemoListScreen';

// Force RTL for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export type RootStackParamList = {
    Home: undefined;
    AddMemo: undefined;
    Learn: { memoId: string };
    Review: undefined;
    Test: undefined;
    Settings: undefined;
    MemoList: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    const hydrate = useMemoStore(s => s.hydrate);

    useEffect(() => {
        hydrate();
    }, []);

    return (
        <SafeAreaProvider>
            <StatusBar style="light" />
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Home"
                    screenOptions={{
                        headerStyle: { backgroundColor: colors.primary },
                        headerTintColor: colors.accent,
                        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
                        headerBackTitle: 'رجوع',
                        contentStyle: { backgroundColor: colors.background },
                        animation: 'slide_from_right',
                    }}
                >
                    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="AddMemo" component={AddMemoScreen} options={{ title: 'إضافة محفوظ جديد' }} />
                    <Stack.Screen name="Learn" component={LearnScreen} options={{ title: 'جلسة الحفظ' }} />
                    <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'المراجعة اليومية' }} />
                    <Stack.Screen name="Test" component={TestScreen} options={{ title: 'الاختبار العشوائي' }} />
                    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'الإعدادات' }} />
                    <Stack.Screen name="MemoList" component={MemoListScreen} options={{ title: 'محفوظاتي' }} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
