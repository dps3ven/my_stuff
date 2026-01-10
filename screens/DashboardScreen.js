import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalItems: 0, totalValue: 0 });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserAndStats();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserAndStats = async () => {
    try {
      const currentUser = JSON.parse(await AsyncStorage.getItem('currentUser'));
      setUser(currentUser);
      
      const inventory = JSON.parse(await AsyncStorage.getItem(`inventory_${currentUser.id}`) || '[]');
      const totalItems = inventory.length;
      const totalValue = inventory.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
      
      setStats({ totalItems, totalValue });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('currentUser');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.welcome}>Welcome back, {user?.name}!</Text>
      <Text style={styles.subtitle}>Manage your musical instrument inventory</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalItems}</Text>
          <Text style={styles.statLabel}>Total Instruments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>${stats.totalValue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.successButton]} 
          onPress={() => navigation.navigate('AddInstrument')}
        >
          <Text style={styles.buttonText}>Add Instrument</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={() => navigation.navigate('Inventory')}
        >
          <Text style={styles.buttonText}>View Inventory</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#133965ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
  },
  welcome: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 10,
    color: '#fff',
  },
  subtitle: {
    textAlign: 'center',
    color: '#fff',
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    color: '#666',
    marginTop: 5,
  },
  actions: {
    alignItems: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 200,
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});