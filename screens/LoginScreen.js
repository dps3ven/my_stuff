import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');

  const handleLogin = async () => {
    try {
      const users = JSON.parse(await AsyncStorage.getItem('users') || '[]');
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        navigation.navigate('Dashboard');
      } else {
        Alert.alert('Error', 'Invalid username or password');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed');
    }
  };

  const handleSignup = async () => {
    try {
      const users = JSON.parse(await AsyncStorage.getItem('users') || '[]');
      
      if (users.find(u => u.username === username)) {
        Alert.alert('Error', 'Username already exists');
        return;
      }
      
      const newUser = { name, username, password, id: Date.now() };
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Error', 'Signup failed');
    }
  };

  return (
    <View style={styles.container}>
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
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={isSignup ? handleSignup : handleLogin}
      >
        <Text style={styles.buttonText}>{isSignup ? 'Sign Up' : 'Login'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
        <Text style={styles.link}>
          {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
});