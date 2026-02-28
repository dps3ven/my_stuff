import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import storage from '../utils/storage';

export default function InventoryScreen({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [user, setUser] = useState(null);
  const [groupedInventory, setGroupedInventory] = useState({});

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
      setInventory(inventoryData);
      
      // Group inventory by instrument type
      const grouped = inventoryData.reduce((acc, item) => {
        const type = item.type || 'Other';
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(item);
        return acc;
      }, {});
      
      setGroupedInventory(grouped);
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
          const updatedInventory = inventory.filter(item => item.id !== id);
          setInventory(updatedInventory);
          await storage.setItem(`inventory_${user.id}`, JSON.stringify(updatedInventory));
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
                const updatedInventory = inventory.filter(item => item.id !== id);
                setInventory(updatedInventory);
                await storage.setItem(`inventory_${user.id}`, JSON.stringify(updatedInventory));
              } catch (error) {
                Alert.alert('Error', 'Failed to delete item');
              }
            }
          }
        ]
      );
    }
  };

  const renderItem = ({ item }) => {
    // Get images array - handle both new (images) and old (image) format
    let imagesToShow = [];
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      imagesToShow = item.images;
    } else if (item.image) {
      imagesToShow = [item.image];
    }

    return (
      <View key={item.id} style={styles.itemContainer}>
        {imagesToShow.length > 0 ? (
          imagesToShow.length === 1 ? (
            <Image 
              source={{ uri: imagesToShow[0] }} 
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.imageScroll}
              nestedScrollEnabled={true}
            >
              {imagesToShow.map((imageUri, index) => (
                <Image 
                  key={index} 
                  source={{ uri: imageUri }} 
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )
        ) : (
          <View style={[styles.itemImage, styles.noImage]}>
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{item.type} - {item.brand} {item.model}</Text>
          <Text style={styles.itemInfo}>Serial: {item.serialNumber || 'N/A'}</Text>
          <Text style={styles.itemInfo}>Condition: {item.condition}</Text>
          <Text style={styles.itemInfo}>Value: ${item.value || 'N/A'}</Text>
          {imagesToShow.length > 1 && (
            <Text style={styles.itemInfo}>Images: {imagesToShow.length}</Text>
          )}
          {item.notes && <Text style={styles.itemNotes}>Notes: {item.notes}</Text>}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => editItem(item)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => deleteItem(item.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
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
            <ScrollView 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {Object.keys(groupedInventory).sort().map((type) => (
                <View key={type} style={styles.typeSection}>
                  <Text style={styles.typeHeader}>{type}</Text>
                  {groupedInventory[type].map((item) => renderItem({ item }))}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#133965ff',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1400 : '100%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: Platform.OS === 'web' ? 36 : 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  typeSection: {
    marginBottom: 30,
  },
  typeHeader: {
    fontSize: Platform.OS === 'web' ? 28 : 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: Platform.OS === 'web' ? 15 : 10,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: Platform.OS === 'web' ? 16 : 14,
    fontWeight: 'bold',
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: Platform.OS === 'web' ? 20 : 15,
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
  imageScroll: {
    width: Platform.OS === 'web' ? 150 : 120,
    height: Platform.OS === 'web' ? 150 : 120,
    marginRight: 15,
  },
  itemImage: {
    width: Platform.OS === 'web' ? 150 : 120,
    height: Platform.OS === 'web' ? 150 : 120,
    borderRadius: 6,
    marginRight: 15,
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
    fontSize: Platform.OS === 'web' ? 20 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemInfo: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#666',
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 5,
  },
  editButton: {
    backgroundColor: '#ffc107',
    padding: Platform.OS === 'web' ? 10 : 8,
    borderRadius: 4,
    minWidth: Platform.OS === 'web' ? 70 : 50,
  },
  editButtonText: {
    color: '#212529',
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: Platform.OS === 'web' ? 10 : 8,
    borderRadius: 4,
    minWidth: Platform.OS === 'web' ? 70 : 50,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: Platform.OS === 'web' ? 14 : 12,
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
});