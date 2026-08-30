import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
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

// A profile is the parent; instrument types are its sub-collections.
const TYPE_EMOJI = {
  Guitar: '🎸', Bass: '🎸', Drums: '🥁', Piano: '🎹',
  Violin: '🎻', Microphone: '🎤', Amplifier: '🔊', Other: '🎵',
};
const pluralizeType = (t) => (t === 'Other' ? 'Other' : t.endsWith('s') ? t : t + 's');

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalItems: 0, totalValue: 0, storageUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [happyMessage] = useState(() => HAPPY_MESSAGES[Math.floor(Math.random() * HAPPY_MESSAGES.length)]);
  const [allPhotos, setAllPhotos] = useState([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [collections, setCollections] = useState([]);

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

      // Sub-collections under this profile: count + value grouped by type.
      const byType = inventory.reduce((acc, item) => {
        const t = item.type || 'Other';
        if (!acc[t]) acc[t] = { type: t, count: 0, value: 0 };
        acc[t].count += 1;
        acc[t].value += parseFloat(item.value) || 0;
        return acc;
      }, {});
      setCollections(Object.values(byType).sort((a, b) => b.count - a.count));

      // Collect all photos with instrument context for the gallery
      const photos = [];
      inventory.forEach(item => {
        const label = [item.brand, item.model].filter(Boolean).join(' ') || item.type || 'Unknown';
        (item.images || []).forEach((img, idx) => {
          const uri = typeof img === 'string' ? img : img.uri;
          if (uri) photos.push({ uri, label, itemId: item.id, idx });
        });
      });
      setAllPhotos(photos);
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

  const Wrapper = Platform.OS === 'web' ? View : LinearGradient;
  const wrapperProps = Platform.OS === 'web'
    ? { style: styles.container }
    : { colors: ['#0a1f3d', '#1e4d8c', '#4ECDC4'], style: styles.container };

  return (
    <Wrapper {...wrapperProps}>
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

        <TouchableOpacity style={styles.instructionsCard} onPress={() => setGuideOpen(!guideOpen)} activeOpacity={0.7}>
          <View style={styles.instructionsHeader}>
            <Text style={styles.instructionsTitle}>📖 User Guide</Text>
            <Text style={styles.instructionsArrow}>{guideOpen ? '▲' : '▼'}</Text>
          </View>
          {guideOpen && (
            <View style={styles.instructionsBody}>
              <Text style={styles.instructionsText}>
                <Text style={styles.instructionsBold}>Add Stuff</Text> — Photograph and catalog your gear with type, make, model, serial number, condition, and value.
              </Text>
              <Text style={styles.instructionsText}>
                <Text style={styles.instructionsBold}>View Stuff</Text> — Browse your inventory grouped by category. Tap an item for full details, or use Edit/Delete.
              </Text>
              <Text style={styles.instructionsText}>
                <Text style={styles.instructionsBold}>Photos card</Text> — Tap the 💾 stat above to see all saved photos in a gallery.
              </Text>
              <Text style={styles.instructionsText}>
                <Text style={styles.instructionsBold}>Tip:</Text> Add a nickname to give your gear a personal touch.
              </Text>

              <Text style={styles.instructionsSectionTitle}>🔒 Privacy & Security</Text>
              <Text style={styles.instructionsText}>
                <Text style={styles.instructionsBold}>On your device</Text> — Profiles, inventory, and photos are stored locally. No account, no servers, nothing uploaded.
              </Text>
              <Text style={styles.instructionsText}>
                <Text style={styles.instructionsBold}>Biometric lock</Text> — On supported phones, Face ID / Touch ID protects your profile.
              </Text>
              <Text style={styles.instructionsText}>
                <Text style={styles.instructionsBold}>Photo access</Text> — Only photos you choose, and the app asks permission first.
              </Text>
              <Text style={styles.instructionsText}>
                <Text style={styles.instructionsBold}>Securely delivered</Text> — The web app loads over HTTPS with strict headers, so the app code can't be tampered with in transit.
              </Text>
            </View>
          )}
        </TouchableOpacity>

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
          <TouchableOpacity style={styles.statCard} onPress={() => allPhotos.length > 0 && navigation.navigate('PhotoGallery', { photos: allPhotos, storageUsed: stats.storageUsed })}>
            <View style={styles.statIcon}>
              <Text style={styles.iconText}>💾</Text>
            </View>
            {loading ? (
              <SkeletonLine width={50} height={20} style={{ marginBottom: 5 }} />
            ) : (
              <Text style={styles.statNumber}>{formatStorage(stats.storageUsed)}</Text>
            )}
            <Text style={styles.statLabel}>Photos</Text>
          </TouchableOpacity>
        </View>

        {!loading && collections.length > 0 && (
          <View style={styles.collectionsSection}>
            {collections.map(c => (
              <TouchableOpacity
                key={c.type}
                style={styles.collectionCard}
                onPress={() => navigation.navigate('Inventory')}
                activeOpacity={0.7}
              >
                <Text style={styles.collectionEmoji}>{TYPE_EMOJI[c.type] || '🎵'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.collectionName}>{pluralizeType(c.type)}</Text>
                  <Text style={styles.collectionMeta}>
                    {c.count} {c.count === 1 ? 'item' : 'items'}{c.value > 0 ? ` · $${Math.round(c.value).toLocaleString()}` : ''}
                  </Text>
                </View>
                <Text style={styles.collectionChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 8,
    marginTop: 4,
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
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
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
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  whyText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  instructionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  instructionsArrow: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  instructionsBody: {
    marginTop: 10,
  },
  instructionsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginTop: 14,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 8,
  },
  instructionsBold: {
    fontWeight: '700',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    gap: 10,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 10,
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
  collectionsSection: {
    marginBottom: 12,
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  collectionEmoji: { fontSize: 24 },
  collectionName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  collectionMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  collectionChevron: { color: 'rgba(255,255,255,0.5)', fontSize: 24, fontWeight: '300' },
  actions: {
    alignItems: 'center',
    gap: 10,
  },
  button: {
    padding: 12,
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
