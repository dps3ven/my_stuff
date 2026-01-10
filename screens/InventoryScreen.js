import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const currentUser = JSON.parse(await AsyncStorage.getItem('currentUser'));
      setUser(currentUser);
      const inventoryData = JSON.parse(await AsyncStorage.getItem(`inventory_${currentUser.id}`) || '[]');
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const editItem = (item) => {
    navigation.navigate('AddInstrument', { editItem: item });
  };

  const deleteItem = async (id) => {
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
              await AsyncStorage.setItem(`inventory_${user.id}`, JSON.stringify(updatedInventory));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.itemImage} />
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

  return (
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
        </View>
      ) : (
        <FlatList
          data={inventory}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  itemImage: {
    width: 80,
    height: 60,
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
});