import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function InstrumentDetailScreen({ navigation, route }) {
  const { item } = route.params;
  const [activeIndex, setActiveIndex] = useState(0);
  const imageScrollRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  const imageWidth = Platform.OS === 'web' ? Math.min(700, screenWidth - 32) : screenWidth - 32;

  const handleScroll = useCallback((event) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / imageWidth);
    setActiveIndex(index);
  }, [imageWidth]);

  const scrollToImage = (index) => {
    imageScrollRef.current?.scrollTo({ x: index * imageWidth, animated: true });
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a1f3d', '#1e4d8c', '#4ECDC4']}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >


        {/* Layout: side by side on web, stacked on mobile */}
        <View style={styles.contentLayout}>

          {/* Image Gallery */}
          <View style={styles.imageGallery}>
            {item.images && item.images.length > 0 ? (
              <>
                <ScrollView 
                  ref={imageScrollRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={[styles.imageScroll, { width: imageWidth }]}
                  pagingEnabled
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {item.images.map((img, index) => (
                    <Image 
                      key={index} 
                      source={{ uri: typeof img === 'string' ? img : img.uri }} 
                      style={[styles.largeImage, { width: imageWidth }]}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
                {item.images.length > 1 && (
                  <View style={styles.dotContainer}>
                    {item.images.map((_, index) => (
                      <TouchableOpacity key={index} onPress={() => scrollToImage(index)}>
                        <View style={[styles.dot, activeIndex === index && styles.dotActive]} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            ) : item.image ? (
              <Image source={{ uri: item.image }} style={[styles.largeImage, { width: imageWidth }]} resizeMode="cover" />
            ) : (
              <View style={[styles.largeImage, styles.noImage, { width: imageWidth }]}>
                <Text style={styles.noImageText}>No Image</Text>
              </View>
            )}
          </View>

          {/* Instrument Details */}
          <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{item.type}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Make:</Text>
            <Text style={styles.detailValue}>{item.brand}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model:</Text>
            <Text style={styles.detailValue}>{item.model}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Year:</Text>
            <Text style={styles.detailValue}>{item.year || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Serial Number:</Text>
            <Text style={styles.detailValue}>{item.serialNumber || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Condition:</Text>
            <Text style={styles.detailValue}>{item.condition}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Value:</Text>
            <Text style={styles.detailValue}>${item.value || 'N/A'}</Text>
          </View>
        </View>
        </View>{/* end contentLayout */}

        {/* Action Buttons - aligned with content */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('AddInstrument', { editItem: item })}
          >
            <Text style={styles.buttonText}>Edit Stuff</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Back to Inventory</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 900 : '100%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    alignItems: 'center',
  },
  contentLayout: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 700,
    alignItems: 'stretch',
    alignSelf: 'center',
  },
  title: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: Platform.OS === 'web' ? 10 : 20,
    width: '100%',
  },
  imageGallery: {
    marginBottom: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    height: Platform.OS === 'web' ? 250 : 170,
  },
  imageScroll: {
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: '100%',
    height: Platform.OS === 'web' ? 220 : 140,
  },
  largeImage: {
    height: Platform.OS === 'web' ? 220 : 160,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  noImage: {
    width: Platform.OS === 'web' ? 400 : 300,
    height: Platform.OS === 'web' ? 300 : 250,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  noImageText: {
    fontSize: 18,
    color: '#666',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'baseline',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#999',
    width: 90,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '600',
  },
  notesSection: {
    paddingTop: 12,
  },
  notesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    lineHeight: 24,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#133965ff',
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#1e4976',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1000,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 700,
    marginTop: 12,
    alignSelf: 'center',
  },
  editButton: {
    backgroundColor: '#ffc107',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flex: 1,
  },
  backButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
