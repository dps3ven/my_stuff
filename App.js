import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import InventoryScreen from './screens/InventoryScreen';
import AddInstrumentScreen from './screens/AddInstrumentScreen';
import InstrumentDetailScreen from './screens/InstrumentDetailScreen';
import PhotoGalleryScreen from './screens/PhotoGalleryScreen';

const Stack = createStackNavigator();

// On web, let the page scroll instead of trapping content inside fixed-height cards
const webScreenOptions = Platform.OS === 'web'
  ? { cardStyle: { overflow: 'visible', backgroundColor: 'transparent' } }
  : {};

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenOrientation.unlockAsync();
    }
  }, []);

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false, ...webScreenOptions }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Inventory" component={InventoryScreen} />
          <Stack.Screen name="AddInstrument" component={AddInstrumentScreen} />
          <Stack.Screen name="InstrumentDetail" component={InstrumentDetailScreen} />
          <Stack.Screen name="PhotoGallery" component={PhotoGalleryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}