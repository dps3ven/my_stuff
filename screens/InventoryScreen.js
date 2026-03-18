import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import storage from '../utils/storage';

export default function InventoryScreen({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadInventory();
    });
    return unsubscribe;
  }, [navigation]);

  const loadInventory = async () => {
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
          alert('Failed to delete item');
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
              {item.images.map((imageUri, index) => (
                <Image 
                  key={index} 
                  source={{ uri: imageUri }} 
                  style={styles.itemImage} 
                />
              ))}
            </ScrollView>
            {item.images.length > 3 && (
              <View style={styles.scrollHint}>
                <Text style={styles.scrollHintText}>→</Text>
              </View>
            )}
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
        <Text style={styles.itemTitle}>{item.type} - {item.brand} {item.model}</Text>
        <Text style={styles.itemInfo}>Serial: {item.serialNumber || 'N/A'}</Text>
        <Text style={styles.itemInfo}>Condition: {item.condition}</Text>
        <Text style={styles.itemInfo}>Value: ${item.value || 'N/A'}</Text>
        {item.images && item.images.length > 1 && (
          <Text style={styles.itemInfo}>Images: {item.images.length}</Text>
        )}
        <Text style={styles.tapHint}>Tap for details</Text>
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inventory</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddInstrument')}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {inventory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No instruments added yet</Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('AddInstrument')}
            >
              <Text style={styles.buttonText}>Add Your First Instrument</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.logoutLinkText}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <SectionList
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
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.footerButton}
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Text style={styles.footerText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
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
    marginRight: 15,
    width: 120,
    ...(Platform.OS === 'web' && {
      maxWidth: 380,
      width: 'auto',
    }),
  },
  imageScroll: {
    width: 120,
    ...(Platform.OS === 'web' && {
      maxWidth: 380,
      width: 'auto',
    }),
  },
  itemImage: {
    width: 120,
    height: 120,
    borderRadius: 6,
    marginRight: 10,
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
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
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
    flexDirection: 'column',
    gap: 5,
  },
  editButton: {
    backgroundColor: '#ffc107',
    padding: 8,
    borderRadius: 4,
    minWidth: 50,
  },
  editButtonText: {
    color: '#212529',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 4,
    minWidth: 50,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
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