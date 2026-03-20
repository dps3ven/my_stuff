import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import InventoryScreen from './screens/InventoryScreen';
import AddInstrumentScreen from './screens/AddInstrumentScreen';
import InstrumentDetailScreen from './screens/InstrumentDetailScreen';

const Stack = createStackNavigator();

// ONE-TIME STORAGE CLEAR — remove this block after first run
const CLEAR_STORAGE = true;
if (CLEAR_STORAGE) {
  if (Platform.OS === 'web') {
    localStorage.clear();
    console.log('Storage cleared (web)');
  } else {
    AsyncStorage.clear().then(() => console.log('Storage cleared (mobile)'));
  }
}
// END ONE-TIME CLEAR

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Inventory" component={InventoryScreen} />
          <Stack.Screen name="AddInstrument" component={AddInstrumentScreen} />
          <Stack.Screen name="InstrumentDetail" component={InstrumentDetailScreen} options={{ title: 'Instrument Details' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}