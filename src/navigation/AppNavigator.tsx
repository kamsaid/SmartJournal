import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { CheckInType } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { LoadingAnimation } from '@/components/animated';
import AnimatedTabBar, { TAB_CONFIG } from '@/components/navigation/AnimatedTabBar';
import { theme } from '@/design-system';

// Placeholder screens
import AuthScreen from '../screens/auth/AuthScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import CheckInScreen from '../screens/checkin/CheckInScreen';
import CheckInTypeSelector from '../screens/checkin/CheckInTypeSelector';
import MorningCheckInScreen from '../screens/checkin/MorningCheckInScreen';
import NightlyCheckInScreen from '../screens/checkin/NightlyCheckInScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import DayDetailScreen from '../screens/calendar/DayDetailScreen';
import JournalingScreen from '../screens/journaling/JournalingScreen';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  CheckInFlow: undefined;
  Calendar: undefined;
  Journal: undefined;
  History: undefined;
  Settings: undefined;
};

export type CheckInStackParamList = {
  TypeSelector: undefined;
  MorningCheckIn: undefined;
  NightlyCheckIn: undefined;
  DailyCheckIn: undefined;
};

export type CalendarStackParamList = {
  CalendarMain: undefined;
  DayDetail: {
    date: string;
    summary: any;
  };
};

export type JournalStackParamList = {
  JournalingMain: undefined;
  JournalDetail: {
    entryId: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const CheckInStack = createStackNavigator<CheckInStackParamList>();
const CalendarStack = createStackNavigator<CalendarStackParamList>();
const JournalStack = createStackNavigator<JournalStackParamList>();

// Check-in flow navigator
function CheckInStackNavigator() {
  return (
    <CheckInStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.dark.bg },
      }}
    >
      <CheckInStack.Screen 
        name="TypeSelector" 
        component={CheckInTypeSelectorScreen}
      />
      <CheckInStack.Screen 
        name="MorningCheckIn" 
        component={MorningCheckInScreen}
      />
      <CheckInStack.Screen 
        name="NightlyCheckIn" 
        component={NightlyCheckInScreen}
      />
      <CheckInStack.Screen 
        name="DailyCheckIn" 
        component={CheckInScreen}
      />
    </CheckInStack.Navigator>
  );
}

// Wrapper component for CheckInTypeSelector with navigation prop
function CheckInTypeSelectorScreen({ navigation }: any) {
  const handleTypeSelect = (type: CheckInType) => {
    switch (type) {
      case 'morning':
        navigation.navigate('MorningCheckIn');
        break;
      case 'nightly':
        navigation.navigate('NightlyCheckIn');
        break;
      case 'daily':
        navigation.navigate('DailyCheckIn');
        break;
    }
  };

  return <CheckInTypeSelector onTypeSelect={handleTypeSelect} />;
}

// Calendar stack navigator
function CalendarStackNavigator() {
  return (
    <CalendarStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.dark.bg },
      }}
    >
      <CalendarStack.Screen 
        name="CalendarMain" 
        component={CalendarScreen}
      />
      <CalendarStack.Screen 
        name="DayDetail" 
        component={DayDetailScreen}
      />
    </CalendarStack.Navigator>
  );
}

// Journal stack navigator
function JournalStackNavigator() {
  return (
    <JournalStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.dark.bg },
      }}
    >
      <JournalStack.Screen 
        name="JournalingMain" 
        component={JournalingScreen}
      />
    </JournalStack.Navigator>
  );
}

// Main app tabs after authentication with custom animated tab bar
function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => (
        <AnimatedTabBar
          tabs={TAB_CONFIG.map(tab => ({
            ...tab,
            isActive: props.state.routeNames[props.state.index] === tab.key,
          }))}
          onTabPress={(tabKey) => {
            const targetIndex = props.state.routeNames.findIndex(name => name === tabKey);
            if (targetIndex !== -1) {
              props.navigation.navigate(props.state.routeNames[targetIndex]);
            }
          }}
          activeTabKey={props.state.routeNames[props.state.index]}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="CheckInFlow" 
        component={CheckInStackNavigator}
        options={{ title: 'Check In' }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarStackNavigator}
        options={{ title: 'Calendar' }}
      />
      <Tab.Screen 
        name="Journal" 
        component={JournalStackNavigator}
        options={{ title: 'Journal' }}
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

// Loading screen component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <LoadingAnimation
        variant="cosmic"
        size="lg"
        text="Loading Life Systems Architect..."
      />
    </View>
  );
}

// Root navigator with authentication awareness
export default function AppNavigator() {
  const { user, loading } = useAuth();

  // Show loading screen while determining auth state
  if (loading) {
    return (
      <NavigationContainer>
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.dark.bg },
        }}
      >
        {user ? (
          // User is authenticated - show main app
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </>
        ) : (
          // User is not authenticated - show auth flow
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.bg,
  },
});