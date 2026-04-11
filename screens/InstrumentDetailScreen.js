import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';

export default function InstrumentDetailScreen({ navigation, route }) {
  const { item } = route.params;
  const [activeIndex, setActiveIndex] = useState(0);
  const imageScrollRef = useRef(null);
  const imageWidth = Platform.OS === 'web' ? 420 : Dimensions.get('window').width - 40;

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
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>{item.type} Details</Text>

        {/* Image Gallery */}
        {item.images && item.images.length > 0 ? (
          <View style={styles.imageGallery}>
            <ScrollView 
              ref={imageScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={[styles.imageScroll, { width: imageWidth }]}
              pagingEnabled
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {item.images.map((imageUri, index) => (
                <Image 
                  key={index} 
                  source={{ uri: imageUri }} 
                  style={[styles.largeImage, { width: imageWidth }]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {item.images.length > 1 && (
              <View style={styles.dotContainer}>
                {item.images.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => scrollToImage(index)}
                  >
                    <View
                      style={[
                        styles.dot,
                        activeIndex === index && styles.dotActive,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.largeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.largeImage, styles.noImage]}>
            <Text style={styles.noImageText}>No Image Available</Text>
          </View>
        )}

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
            <Text style={styles.detailLabel}>Serial Number:</Text>
            <Text style={styles.detailValue}>{item.serialNumber || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Condition:</Text>
            <Text style={styles.detailValue}>{item.condition}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Value:</Text>
            <Text style={styles.detailValue}>${item.value || 'N/A'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('AddInstrument', { editItem: item })}
          >
            <Text style={styles.buttonText}>Edit Instrument</Text>
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
    backgroundColor: '#133965ff',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 900 : '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 180,
    alignItems: 'center',
  },
  title: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    width: '100%',
  },
  imageGallery: {
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 700,
  },
  imageScroll: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  largeImage: {
    height: Platform.OS === 'web' ? 300 : 250,
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
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
    maxWidth: 700,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 140,
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
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
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 15,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 700 : '100%',
  },
  editButton: {
    backgroundColor: '#ffc107',
    padding: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flex: Platform.OS === 'web' ? 1 : 0,
  },
  backButton: {
    backgroundColor: '#007bff',
    padding: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flex: Platform.OS === 'web' ? 1 : 0,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
