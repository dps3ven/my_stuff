import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import storage from '../utils/storage';
import CryptoJS from 'crypto-js';
import * as LocalAuthentication from 'expo-local-authentication';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setUsername('');
      setPassword('');
      setIsSignup(false);
      setErrorMessage('');
    });
    return unsubscribe;
  }, [navigation]);

  const sanitize = (text) => {
    return text.replace(/[<>]/g, '').trim();
  };

  const verifyBiometric = async () => {
    if (Platform.OS === 'web') return true;

    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return true;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return true;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify your identity',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    return result.success;
  };

  const showError = (msg) => {
    if (Platform.OS === 'web') {
      setErrorMessage(msg);
    } else {
      Alert.alert('Error', msg);
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');
    if (!username.trim() || !password.trim()) {
      showError('Username and password are required');
      return;
    }
    try {
      const users = JSON.parse(await storage.getItem('users') || '[]');
      const hashedPassword = CryptoJS.SHA256(password).toString();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === hashedPassword);
      if (user) {
        const biometricPassed = await verifyBiometric();
        if (!biometricPassed) {
          showError('Biometric verification failed. Login denied.');
          return;
        }
        const { password: _, ...safeUser } = user;
        await storage.setItem('currentUser', JSON.stringify(safeUser));
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      } else {
        showError('Invalid username or password');
      }
    } catch (error) {
      showError('Login failed: ' + error.message);
    }
  };

  const handleSignup = async () => {
    setErrorMessage('');
    if (!username.trim() || !password.trim()) {
      showError('Username and password are required');
      return;
    }
    if (username.trim().length < 3) {
      showError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      showError('Username can only contain letters, numbers, and underscores');
      return;
    }
    if (password.trim().length < 12) {
      showError('Password must be at least 12 characters (currently ' + password.trim().length + ')');
      return;
    }
    try {
      const users = JSON.parse(await storage.getItem('users') || '[]');
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        showError('Username already exists');
        return;
      }
      const hashedPassword = CryptoJS.SHA256(password).toString();
      const newUser = { name: sanitize(username), username: sanitize(username).toLowerCase(), password: hashedPassword, id: Date.now() };
      users.push(newUser);
      await storage.setItem('users', JSON.stringify(users));
      const { password: _, ...safeUser } = newUser;
      await storage.setItem('currentUser', JSON.stringify(safeUser));
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } catch (error) {
      showError('Signup failed: ' + error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>My Inventory</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={isSignup ? handleSignup : handleLogin}
        >
          <Text style={styles.buttonText}>{isSignup ? 'Sign Up' : 'Login'}</Text>
        </TouchableOpacity>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
          <Text style={styles.link}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <Text style={styles.linkAction}>
            {isSignup ? 'Login' : 'Sign up'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#133965ff',
    height: Platform.OS === 'web' ? '100vh' : undefined,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 100,
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 500 : '100%',
  },
  title: {
    fontSize: Platform.OS === 'web' ? 48 : 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#fff',
  },
  input: {
    backgroundColor: 'white',
    padding: Platform.OS === 'web' ? 18 : 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: Platform.OS === 'web' ? 18 : 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
  },
  eyeButton: {
    padding: 15,
  },
  eyeIcon: {
    fontSize: 18,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 15,
  },
  linkAction: {
    textAlign: 'center',
    color: '#007bff',
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 5,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
    fontSize: Platform.OS === 'web' ? 16 : 14,
    fontWeight: '600',
  },
});
