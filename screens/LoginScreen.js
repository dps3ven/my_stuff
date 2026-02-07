import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import storage from '../utils/storage';
import CryptoJS from 'crypto-js';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setUsername('');
      setPassword('');
      setName('');
      setIsSignup(false);
      setErrorMessage('');
    });
    return unsubscribe;
  }, [navigation]);

  const handleLogin = async () => {
    setErrorMessage('');
    try {
      const users = JSON.parse(await storage.getItem('users') || '[]');
      const hashedPassword = CryptoJS.SHA256(password).toString();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && (u.password === hashedPassword || u.password === password));
      
      if (user) {
        await storage.setItem('currentUser', JSON.stringify(user));
        navigation.navigate('Dashboard');
      } else {
        if (Platform.OS === 'web') {
          setErrorMessage('Invalid username or password');
        } else {
          Alert.alert('Error', 'Invalid username or password');
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        setErrorMessage('Login failed');
      } else {
        Alert.alert('Error', 'Login failed');
      }
    }
  };

  const handleSignup = async () => {
    setErrorMessage('');
    try {
      const users = JSON.parse(await storage.getItem('users') || '[]');
      
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        if (Platform.OS === 'web') {
          setErrorMessage('Username already exists');
        } else {
          Alert.alert('Error', 'Username already exists');
        }
        return;
      }
      
      const hashedPassword = CryptoJS.SHA256(password).toString();
      const newUser = { name, username: username.toLowerCase(), password: hashedPassword, id: Date.now() };
      users.push(newUser);
      await storage.setItem('users', JSON.stringify(users));
      await storage.setItem('currentUser', JSON.stringify(newUser));
      navigation.navigate('Dashboard');
    } catch (error) {
      if (Platform.OS === 'web') {
        setErrorMessage('Signup failed');
      } else {
        Alert.alert('Error', 'Signup failed');
      }
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
      <Text style={styles.title}>My Stuff</Text>
      
      {isSignup && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
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
          {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => Alert.alert('Login Help', 'To login, enter your username and password.\n\nForgot your password? Contact support or create a new account.\n\nNew user? Click "Sign up" to create an account.')}>
        <Text style={styles.helpLink}>Need help?</Text>
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
    width: Platform.OS === 'web' ? '100%' : '100%',
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
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  helpLink: {
    textAlign: 'center',
    color: '#ffc107',
    textDecorationLine: 'underline',
    marginTop: 15,
    fontSize: Platform.OS === 'web' ? 16 : 14,
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