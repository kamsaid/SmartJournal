import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Placeholder screens
import AuthScreen from '../screens/auth/AuthScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import CheckInScreen from '../screens/checkin/CheckInScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import PhaseJourneyScreen from '../screens/journey/PhaseJourneyScreen';
import LifeSystemsScreen from '../screens/systems/LifeSystemsScreen';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  CheckIn: undefined;
  Journey: undefined;
  Systems: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main app tabs after authentication
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#16213e',
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen 
        name="CheckIn" 
        component={CheckInScreen}
        options={{ title: 'Check In' }}
      />
      <Tab.Screen 
        name="Journey" 
        component={PhaseJourneyScreen}
        options={{ title: 'Journey' }}
      />
      <Tab.Screen 
        name="Systems" 
        component={LifeSystemsScreen}
        options={{ title: 'Systems' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// Root navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0f0f23' },
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}