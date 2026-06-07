import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  FlatList, StatusBar, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NUM_COLUMNS = 3;
const GAP = 3;

function formatStorage(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PhotoGalleryScreen({ navigation, route }) {
  const { photos = [], storageUsed = 0 } = route.params || {};
  const [lightbox, setLightbox] = useState(null);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Thumb fills exactly 1/3 of available width accounting for gaps
  const thumbSize = Math.floor((width - GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS);

  // ── Lightbox ───────────────────────────────────────────────────
  if (lightbox !== null) {
    const photo = photos[lightbox];
    return (
      <View style={styles.lightboxContainer}>
        <StatusBar hidden />
        <TouchableOpacity
          style={styles.lightboxBg}
          activeOpacity={1}
          onPress={() => setLightbox(null)}
        >
          <Image
            source={{ uri: photo.uri }}
            style={{ width, height: height * 0.85 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Label / counter bar */}
        <View style={[styles.lightboxBar, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.lightboxLabel}>{photo.label}</Text>
          <Text style={styles.lightboxCounter}>{lightbox + 1} / {photos.length}</Text>
        </View>

        {/* Prev */}
        {lightbox > 0 && (
          <TouchableOpacity style={[styles.navBtn, styles.navLeft]} onPress={() => setLightbox(lightbox - 1)}>
            <Text style={styles.navText}>‹</Text>
          </TouchableOpacity>
        )}
        {/* Next */}
        {lightbox < photos.length - 1 && (
          <TouchableOpacity style={[styles.navBtn, styles.navRight]} onPress={() => setLightbox(lightbox + 1)}>
            <Text style={styles.navText}>›</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.lightboxClose, { top: insets.top + 12 }]}
          onPress={() => setLightbox(null)}
        >
          <Text style={styles.lightboxCloseText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Grid ───────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#0a1f3d', '#1e4d8c', '#4ECDC4']} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>All Photos</Text>
          <Text style={styles.headerSub}>
            {photos.length} photo{photos.length !== 1 ? 's' : ''} · {formatStorage(storageUsed)} used
          </Text>
        </View>
        <View style={styles.headerSide} />
      </View>

      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📷</Text>
          <Text style={styles.emptyText}>No photos yet</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          numColumns={NUM_COLUMNS}
          keyExtractor={(item, index) => `${item.itemId}-${item.idx}-${index}`}
          style={styles.list}
          contentContainerStyle={{ padding: GAP, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={true}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => setLightbox(index)}
              activeOpacity={0.85}
              style={{ margin: GAP }}
            >
              <Image
                source={{ uri: item.uri }}
                style={{ width: thumbSize, height: thumbSize, borderRadius: 6 }}
                resizeMode="cover"
              />
              <View style={[styles.thumbLabel, { width: thumbSize }]}>
                <Text style={styles.thumbLabelText} numberOfLines={1}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  // ── Header ────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  headerSide: {
    minWidth: 70,
  },
  backText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  // ── Empty ─────────────────────────────────────────────────────
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  // ── Grid ─────────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  thumbLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  thumbLabelText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  // ── Lightbox ─────────────────────────────────────────────────
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  lightboxBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lightboxLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  lightboxCounter: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginLeft: 12,
  },
  lightboxClose: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -28,
    width: 50,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
  },
  navLeft: { left: 8 },
  navRight: { right: 8 },
  navText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 40,
  },
});
