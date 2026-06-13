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

// Expo's Metro web export generates its own index.html with a reset that sets
// `body { overflow: hidden }` and locks everything to height:100%. That traps
// scrolling and breaks rotation reflow. Since the generated template ignores
// web/index.html, we override those rules at runtime so the document body is
// the single scroll + rotation container for the whole app.
function applyWebGlobalLayout() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'global-container-layout';
  style.textContent = `
    html, body {
      height: auto !important;
      min-height: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch;
    }
    /* Matching gradient backdrop so scroll areas taller than the viewport
       never reveal a blank strip below the per-screen gradient. Fixed so it
       always fills the viewport behind the app content while scrolling. */
    html {
      background-color: #0a1f3d;
    }
    body {
      background-image: linear-gradient(to bottom, #0a1f3d 0%, #1e4d8c 50%, #4ECDC4 100%);
      background-attachment: fixed;
      background-repeat: no-repeat;
      background-size: 100% 100%;
    }
    #root {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      height: auto !important;
      flex: 0 1 auto !important;
      width: 100%;
    }
    /* Force React Navigation's nested screen wrappers to grow with content
       instead of clipping it, so the body owns the scroll. */
    #root > div,
    #root > div > div,
    #root > div > div > div,
    #root > div > div > div > div {
      min-height: 100vh;
      height: auto !important;
      overflow: visible !important;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenOrientation.unlockAsync();
    } else {
      applyWebGlobalLayout();
    }
  }, []);

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