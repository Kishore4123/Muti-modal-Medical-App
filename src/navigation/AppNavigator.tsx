import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { colors } from '../theme/colors';

import SignInScreen from '../screens/SignInScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PatientListScreen from '../screens/PatientListScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';
import NewAnalysisScreen from '../screens/NewAnalysisScreen';
import AnalysisReportScreen from '../screens/AnalysisReportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.slate[900],
  headerTitleStyle: { fontWeight: '600' as const, fontSize: 16 },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

function DashboardTab() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Patient Chart' }} />
      <Stack.Screen name="NewAnalysis" component={NewAnalysisScreen} options={{ title: 'New Analysis' }} />
      <Stack.Screen name="AnalysisReport" component={AnalysisReportScreen} options={{ title: 'Report' }} />
    </Stack.Navigator>
  );
}

function PatientsTab() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PatientListHome" component={PatientListScreen} options={{ title: 'Patients' }} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Patient Chart' }} />
      <Stack.Screen name="NewAnalysis" component={NewAnalysisScreen} options={{ title: 'New Analysis' }} />
      <Stack.Screen name="AnalysisReport" component={AnalysisReportScreen} options={{ title: 'Report' }} />
    </Stack.Navigator>
  );
}

function AnalysisTab() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="NewAnalysisHome" component={NewAnalysisScreen} options={{ title: 'AI Analysis' }} />
      <Stack.Screen name="AnalysisReport" component={AnalysisReportScreen} options={{ title: 'Report' }} />
    </Stack.Navigator>
  );
}

function ProfileTab() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}

function AdminTab() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminHome" component={AdminScreen} options={{ title: 'Admin Panel' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.blue[600],
        tabBarInactiveTintColor: colors.slate[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.slate[200],
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'grid';
          if (route.name === 'Dashboard') iconName = 'grid';
          else if (route.name === 'Patients') iconName = 'people';
          else if (route.name === 'Analysis') iconName = 'scan';
          else if (route.name === 'Profile') iconName = 'person';
          else if (route.name === 'Admin') iconName = 'shield';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardTab} />
      <Tab.Screen name="Patients" component={PatientsTab} />
      <Tab.Screen name="Analysis" component={AnalysisTab} />
      <Tab.Screen name="Profile" component={ProfileTab} />
      {isAdmin && <Tab.Screen name="Admin" component={AdminTab} />}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const res = await api.post('/auth/signin', { idToken });
          setUser(res.data.user);
        } catch (err: any) {
          if (!err.response?.data?.needsRegistration) {
            setUser(null);
          }
          setLoading(false);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (isLoading) {
    return <LoadingSpinner message="Initializing TetrixAI..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
