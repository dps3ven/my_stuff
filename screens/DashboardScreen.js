import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Image, FlatList, Dimensions, SafeAreaView } from 'react-native';
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
  const [allPhotos, setAllPhotos] = useState([]);
  const [photosModalVisible, setPhotosModalVisible] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

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

  return (
    <>
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
          <TouchableOpacity style={styles.statCard} onPress={() => allPhotos.length > 0 && setPhotosModalVisible(true)}>
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

    {/* Photo Gallery Modal */}
    <Modal
      visible={photosModalVisible}
      animationType="slide"
      onRequestClose={() => setPhotosModalVisible(false)}
    >
      <SafeAreaView style={styles.galleryContainer}>
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryTitle}>All Photos ({allPhotos.length})</Text>
          <TouchableOpacity onPress={() => setPhotosModalVisible(false)} style={styles.galleryClose}>
            <Text style={styles.galleryCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={allPhotos}
          numColumns={3}
          keyExtractor={(item, index) => `${item.itemId}-${item.idx}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => setLightboxPhoto(item)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.uri }} style={styles.gridImage} resizeMode="cover" />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.gridContent}
        />
      </SafeAreaView>
    </Modal>

    {/* Lightbox Modal */}
    <Modal
      visible={lightboxPhoto !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setLightboxPhoto(null)}
    >
      <TouchableOpacity
        style={styles.lightboxOverlay}
        activeOpacity={1}
        onPress={() => setLightboxPhoto(null)}
      >
        <Image
          source={{ uri: lightboxPhoto?.uri }}
          style={styles.lightboxImage}
          resizeMode="contain"
        />
        {lightboxPhoto?.label ? (
          <View style={styles.lightboxLabel}>
            <Text style={styles.lightboxLabelText}>{lightboxPhoto.label}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Modal>
  </>
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
  // ── Photo gallery ────────────────────────────────────────────
  galleryContainer: {
    flex: 1,
    backgroundColor: '#0a1f3d',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  galleryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  galleryClose: {
    padding: 6,
  },
  galleryCloseText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
  },
  gridContent: {
    padding: 2,
  },
  gridItem: {
    flex: 1/3,
    aspectRatio: 1,
    margin: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  // ── Lightbox ─────────────────────────────────────────────────
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  lightboxLabel: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  lightboxLabelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
