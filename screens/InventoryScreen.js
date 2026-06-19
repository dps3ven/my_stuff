import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import storage from '../utils/storage';
import Skeleton, { SkeletonLine } from '../components/Skeleton';

export default function InventoryScreen({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadInventory();
    });
    return unsubscribe;
  }, [navigation]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const currentUser = JSON.parse(await storage.getItem('currentUser'));
      setUser(currentUser);
      const inventoryData = JSON.parse(await storage.getItem(`inventory_${currentUser.id}`) || '[]');
      
      // Group inventory by instrument type
      const grouped = inventoryData.reduce((acc, item) => {
        const type = item.type || 'Other';
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(item);
        return acc;
      }, {});
      
      // Pluralize instrument types
      const pluralize = (type) => {
        if (type === 'Other') return 'Other';
        if (type.endsWith('s')) return type;
        return type + 's';
      };
      
      // Convert to array format for SectionList
      const sections = Object.keys(grouped).sort().map(type => ({
        title: pluralize(type),
        data: grouped[type]
      }));
      
      setInventory(sections);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const editItem = (item) => {
    navigation.navigate('AddInstrument', { editItem: item });
  };

  const deleteItem = async (id) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this item?')) {
        try {
          const currentInventory = JSON.parse(await storage.getItem(`inventory_${user.id}`) || '[]');
          const updatedInventory = currentInventory.filter(item => item.id !== id);
          await storage.setItem(`inventory_${user.id}`, JSON.stringify(updatedInventory));
          loadInventory();
        } catch (error) {
          if (Platform.OS === 'web') {
            window.confirm('Failed to delete item');
          } else {
            Alert.alert('Error', 'Failed to delete item');
          }
        }
      }
    } else {
      Alert.alert(
        'Delete Item',
        'Are you sure you want to delete this item?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const currentInventory = JSON.parse(await storage.getItem(`inventory_${user.id}`) || '[]');
                const updatedInventory = currentInventory.filter(item => item.id !== id);
                await storage.setItem(`inventory_${user.id}`, JSON.stringify(updatedInventory));
                loadInventory();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete item');
              }
            }
          }
        ]
      );
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => navigation.navigate('InstrumentDetail', { item })}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {item.images && item.images.length > 0 ? (
          <View style={styles.imageWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.imageScroll}
            >
              {item.images.map((img, index) => (
                <Image 
                  key={index} 
                  source={{ uri: typeof img === 'string' ? img : img.uri }} 
                  style={styles.itemImage} 
                />
              ))}
            </ScrollView>
          </View>
        ) : item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, styles.noImage]}>
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemInfo}>{item.brand || 'N/A'}</Text>
        <Text style={styles.itemInfo}>{item.model || 'N/A'}</Text>
        {item.year ? <Text style={styles.itemInfo}>{item.year}</Text> : null}
        <Text style={styles.itemInfo}>{item.condition}</Text>

        {item.images && item.images.length > 1 && (
          <Text style={styles.itemInfo}>Images: {item.images.length}</Text>
        )}
        <Text style={styles.tapHint}>More details</Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={(e) => {
            e.stopPropagation();
            editItem(item);
          }}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={(e) => {
            e.stopPropagation();
            deleteItem(item.id);
          }}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0a1f3d', '#1e4d8c', '#4ECDC4']}
        style={Platform.OS === 'web' ? { display: 'none' } : StyleSheet.absoluteFillObject}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Stuff</Text>
        </View>
        
        {loading ? (
          <View>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.itemContainer}>
                <Skeleton width={80} height={80} borderRadius={6} style={{ marginRight: 10 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <SkeletonLine width="60%" height={16} />
                  <SkeletonLine width="80%" />
                  <SkeletonLine width="40%" />
                  <SkeletonLine width="50%" />
                </View>
              </View>
            ))}
          </View>
        ) : inventory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎸</Text>
            <Text style={styles.emptyText}>Nothing here yet!</Text>
            <Text style={styles.emptyHint}>Document your stuff with photos and anything important. A detailed record supports insurance claims, proof of ownership, and resale value.</Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('AddInstrument')}
            >
              <Text style={styles.buttonText}>Add Some Stuff</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.logoutLinkText}>Switch Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            style={{ flex: 1 }}
            sections={inventory}
            renderItem={renderItem}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}

        {/* Persistent back navigation */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.footerText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    marginRight: 10,
    width: 80,
    ...(Platform.OS === 'web' && {
      width: 120,
      marginRight: 15,
    }),
  },
  imageScroll: {
    width: 80,
    ...(Platform.OS === 'web' && {
      width: 120,
    }),
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 6,
    ...(Platform.OS === 'web' && {
      width: 120,
      height: 120,
      marginRight: 10,
    }),
  },
  noImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 10,
    color: '#666',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 1,
    fontWeight: '500',
  },
  itemNotes: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 5,
  },
  tapHint: {
    fontSize: 12,
    color: '#007bff',
    fontStyle: 'italic',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  editButton: {
    backgroundColor: '#F39C12',
    padding: 6,
    borderRadius: 4,
    minWidth: 44,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 6,
    borderRadius: 4,
    minWidth: 44,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  tipBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutLink: {
    marginTop: 15,
  },
  logoutLinkText: {
    color: '#fff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  sectionHeader: {
    backgroundColor: '#1e4976',
    padding: 12,
    marginBottom: 10,
    borderRadius: 6,
  },
  sectionHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    backgroundColor: '#1e4976',
    padding: 20,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  footerButton: {
    padding: 10,
  },
  footerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});