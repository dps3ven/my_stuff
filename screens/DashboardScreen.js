import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import storage from '../utils/storage';
import Skeleton, { SkeletonLine } from '../components/Skeleton';

const HAPPY_MESSAGES = [
  'A great collection deserves a record.',
  'Every instrument has a story.',
  'Your gear, organized.',
  'Keep track of what you own.',
  'Document what matters.',
];

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalItems: 0, totalValue: 0 });
  const [recentItems, setRecentItems] = useState([]);
  const [topByType, setTopByType] = useState([]);
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
      setStats({ totalItems, totalValue });

      // Recent items (last 5, sorted by id which is timestamp)
      const recent = [...inventory].sort((a, b) => b.id - a.id).slice(0, 5);
      setRecentItems(recent);

      // Group by type for category cards
      const byType = inventory.reduce((acc, item) => {
        const t = item.type || 'Other';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const types = Object.entries(byType).map(([type, count]) => ({ type, count }));
      setTopByType(types);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await storage.removeItem('currentUser');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const typeEmoji = (type) => {
    const map = {
      Guitar: '🎸', Bass: '🎸', Drums: '🥁', Piano: '🎹',
      Violin: '🎻', Microphone: '🎤', Amplifier: '🔊', Other: '🎵',
    };
    return map[type] || '🎵';
  };

  return (
    <LinearGradient colors={['#0a1f3d', '#1e4d8c', '#4ECDC4']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {/* Greeting */}
        <View style={styles.greetingCard}>
          {loading ? (
            <SkeletonLine width={180} height={28} />
          ) : (
            <Text style={styles.greetingText}>Hi, {user?.name} 👋</Text>
          )}
          <Text style={styles.tagline}>{happyMessage}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Inventory')} activeOpacity={0.8}>
            <Text style={styles.statIcon}>🎸</Text>
            {loading ? <SkeletonLine width={40} height={22} /> : <Text style={styles.statNumber}>{stats.totalItems}</Text>}
            <Text style={styles.statLabel}>Items</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            {loading ? <SkeletonLine width={70} height={22} /> : <Text style={styles.statNumber}>${stats.totalValue.toFixed(0)}</Text>}
            <Text style={styles.statLabel}>Value</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📂</Text>
            {loading ? <SkeletonLine width={30} height={22} /> : <Text style={styles.statNumber}>{topByType.length}</Text>}
            <Text style={styles.statLabel}>Types</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#28a745' }]}
            onPress={() => navigation.navigate('AddInstrument')}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionTitle}>Add Stuff</Text>
            <Text style={styles.actionSubtitle}>New instrument</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#007bff' }]}
            onPress={() => navigation.navigate('Inventory')}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>View All</Text>
            <Text style={styles.actionSubtitle}>Browse inventory</Text>
          </TouchableOpacity>
        </View>

        {/* Recently Added */}
        {recentItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll} contentContainerStyle={{ paddingRight: 16 }}>
              {recentItems.map(item => (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.recentCard}
                  onPress={() => navigation.navigate('InstrumentDetail', { item })}
                  activeOpacity={0.85}
                >
                  {item.images && item.images.length > 0 ? (
                    <Image source={{ uri: item.images[0] }} style={styles.recentImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.recentImage, styles.recentNoImage]}>
                      <Text style={styles.recentNoImageText}>{typeEmoji(item.type)}</Text>
                    </View>
                  )}
                  <Text style={styles.recentTitle} numberOfLines={1}>{item.brand || item.type}</Text>
                  <Text style={styles.recentSubtitle} numberOfLines={1}>{item.model}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Categories */}
        {topByType.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesGrid}>
              {topByType.map(({ type, count }) => (
                <TouchableOpacity 
                  key={type}
                  style={styles.categoryCard}
                  onPress={() => navigation.navigate('Inventory')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.categoryEmoji}>{typeEmoji(type)}</Text>
                  <Text style={styles.categoryName}>{type}</Text>
                  <Text style={styles.categoryCount}>{count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Switch profile - bottom */}
        <TouchableOpacity style={styles.switchProfileLink} onPress={logout}>
          <Text style={styles.switchProfileText}>Switch Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Greeting
  greetingCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#0a1f3d' },
  statLabel: { fontSize: 11, color: '#666', fontWeight: '600', marginTop: 2 },

  // Section titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    marginTop: 4,
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  actionSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },

  // Recently added
  recentScroll: { marginBottom: 20 },
  recentCard: {
    width: 140,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  recentNoImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentNoImageText: { fontSize: 48 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  recentSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },

  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryEmoji: { fontSize: 28, marginBottom: 4 },
  categoryName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  categoryCount: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },

  // Switch profile
  switchProfileLink: {
    alignItems: 'center',
    padding: 12,
    marginTop: 10,
  },
  switchProfileText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
