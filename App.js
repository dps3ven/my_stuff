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
  ? {
      cardStyle: { overflow: 'visible', backgroundColor: 'transparent' },
      cardOverlayEnabled: false,
    }
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
      overscroll-behavior: none;
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
      min-height: var(--app-height, 100vh);
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
      min-height: var(--app-height, 100vh);
      height: auto !important;
      overflow: visible !important;
      flex-shrink: 0;
      background-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
}

// On iOS Safari, the virtual keyboard + contact bar reduces the visible area
// but doesn't fire a standard resize event that CSS viewport units respond to.
// We listen to the visualViewport resize and adjust a CSS variable that the
// min-height rules use, so the app content area always fits the actual visible
// space — nothing gets hidden behind the keyboard/autofill bar.
function handleVisualViewport() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (!window.visualViewport) return;

  const update = () => {
    const vh = window.visualViewport.height;
    document.documentElement.style.setProperty('--app-height', `${vh}px`);
  };

  update();
  window.visualViewport.addEventListener('resize', update);
  window.visualViewport.addEventListener('scroll', update);
}

// Mobile browsers (esp. iOS Safari) show a contact-autofill bar above the
// keyboard. iOS *ignores* autocomplete="off", so we instead assign a unique,
// non-standard autocomplete token plus a randomized name/id, which defeats the
// heuristic that matches a field to a contact (name/email/tel/address). We do
// this on focus (right before the keyboard's suggestions are computed) and for
// any inputs mounted later via a MutationObserver.
function suppressAutofill() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const harden = (el) => {
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) return;
    const token = `nofill-${Math.random().toString(36).slice(2)}`;
    el.setAttribute('autocomplete', token);
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('spellcheck', 'false');
    if (!el.dataset.autofillHardened) {
      const rand = Math.random().toString(36).slice(2);
      el.setAttribute('name', `field_${rand}`);
      el.setAttribute('id', `field_${rand}`);
      el.dataset.autofillHardened = '1';
      // iOS decides whether to offer contact autofill at the moment a field
      // receives focus. If the field is readOnly at that instant, iOS skips
      // the contact bar. We remove readOnly inside the focus handler, which
      // runs after iOS has already made that decision, so typing still works.
      el.readOnly = true;
      el.addEventListener('focus', () => { el.readOnly = false; });
    }
  };

  const scan = (root) => {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('input, textarea').forEach(harden);
  };

  scan(document);

  // Re-apply the moment a field is focused, before iOS computes suggestions.
  document.addEventListener('focusin', (e) => harden(e.target), true);

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        harden(node);
        scan(node);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenOrientation.unlockAsync();
    } else {
      applyWebGlobalLayout();
      handleVisualViewport();
      suppressAutofill();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            ...webScreenOptions,
            ...(Platform.OS === 'web' ? { cardContainerStyle: { backgroundColor: 'transparent' } } : {}),
          }}
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