import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import storage from '../utils/storage';
import { SkeletonLine } from '../components/Skeleton';

const HAPPY_MESSAGES = [
  'A great collection deserves a record.',
  'Every instrument has a story.',
  'Your gear, organized.',
  'Keep track of what you own.',
  'Document what matters.',
  'Where music meets memory.',
  'Your sound, your stuff.',
  'A home for your gear.',
  'For the love of music.',
  'Every piece counts.',
];

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalItems: 0, totalValue: 0, storageUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [happyMessage] = useState(() => HAPPY_MESSAGES[Math.floor(Math.random() * HAPPY_MESSAGES.length)]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserAndStats();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserAndStats = async () => {
    setLoading(true);
    try {
      const currentUser = JSON.parse(await storage.getItem('currentUser'));
      setUser(currentUser);

      const inventory = JSON.parse(await storage.getItem(`inventory_${currentUser.id}`) || '[]');
      const totalItems = inventory.length;
      const totalValue = inventory.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);

      // Sum actual stored image sizes; support legacy plain-string URIs (size treated as 0)
      const totalBytes = inventory.reduce((sum, item) => {
        const imageBytes = (item.images || []).reduce((s, img) => {
          return s + (typeof img === 'string' ? 0 : (img.size || 0));
        }, 0);
        return sum + imageBytes;
      }, 0);

      setStats({ totalItems, totalValue, storageUsed: totalBytes });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatStorage = (bytes) => {
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const logout = async () => {
    await storage.removeItem('currentUser');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <LinearGradient
      colors={['#0a1f3d', '#1e4d8c', '#4ECDC4']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Text style={styles.appTitle}>My Stuff</Text>
        </View>

        <View style={styles.welcomeCard}>
          {loading ? (
            <SkeletonLine width={200} height={28} style={{ alignSelf: 'center' }} />
          ) : (
            <Text style={styles.welcome}>Hello, {user?.name}!</Text>
          )}
        </View>

        <View style={styles.whyCard}>
          <Text style={styles.whyText}>{happyMessage}</Text>
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Inventory')}
          >
            <View style={styles.statIcon}>
              <Text style={styles.iconText}>🎸</Text>
            </View>
            {loading ? (
              <SkeletonLine width={40} height={20} style={{ marginBottom: 5 }} />
            ) : (
              <Text style={styles.statNumber}>{stats.totalItems}</Text>
            )}
            <Text style={styles.statLabel}>My Stuff</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.iconText}>💰</Text>
            </View>
            {loading ? (
              <SkeletonLine width={60} height={20} style={{ marginBottom: 5 }} />
            ) : (
              <Text style={styles.statNumber}>${stats.totalValue.toFixed(2)}</Text>
            )}
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.iconText}>💾</Text>
            </View>
            {loading ? (
              <SkeletonLine width={50} height={20} style={{ marginBottom: 5 }} />
            ) : (
              <Text style={styles.statNumber}>{formatStorage(stats.storageUsed)}</Text>
            )}
            <Text style={styles.statLabel}>Photos</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('AddInstrument')}
          >
            <Text style={styles.buttonText}>Add Stuff</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Inventory')}
          >
            <Text style={styles.buttonText}>View Stuff</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={logout}
          >
            <Text style={styles.buttonText}>Switch Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 15,
    marginTop: 10,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  welcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  welcome: {
    fontSize: 22,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
  whyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  whyText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  statIcon: {
    marginBottom: 4,
  },
  iconText: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 2,
  },
  statLabel: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    alignItems: 'center',
    gap: 10,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    backgroundColor: '#7193c6ff',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
