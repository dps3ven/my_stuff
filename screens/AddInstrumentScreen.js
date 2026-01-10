import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INSTRUMENT_TYPES = [
  { label: 'Select Type', value: '' },
  { label: 'Guitar', value: 'Guitar' },
  { label: 'Bass', value: 'Bass' },
  { label: 'Drums', value: 'Drums' },
  { label: 'Piano', value: 'Piano' },
  { label: 'Violin', value: 'Violin' },
  { label: 'Other', value: 'Other' },
];

const CONDITIONS = [
  { label: 'Select Condition', value: '' },
  { label: 'New', value: 'New' },
  { label: 'Excellent', value: 'Excellent' },
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
];

export default function AddInstrumentScreen({ navigation, route }) {
  const editItem = route?.params?.editItem;
  const isEditing = !!editItem;
  
  const [instrument, setInstrument] = useState({
    type: editItem?.type || '',
    brand: editItem?.brand || '',
    model: editItem?.model || '',
    serialNumber: editItem?.serialNumber || '',
    condition: editItem?.condition || '',
    value: editItem?.value || '',
    notes: editItem?.notes || '',
    image: editItem?.image || null,
  });

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Instrument' : 'Add Instrument'
    });
  }, [navigation, isEditing]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setInstrument({ ...instrument, image: result.assets[0].uri });
    }
  };

  const saveInstrument = async () => {
    if (!instrument.type || !instrument.brand || !instrument.model) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const currentUser = JSON.parse(await AsyncStorage.getItem('currentUser'));
      const inventory = JSON.parse(await AsyncStorage.getItem(`inventory_${currentUser.id}`) || '[]');
      
      if (isEditing) {
        const updatedInventory = inventory.map(item => 
          item.id === editItem.id ? { ...instrument, id: editItem.id } : item
        );
        await AsyncStorage.setItem(`inventory_${currentUser.id}`, JSON.stringify(updatedInventory));
        Alert.alert('Success', 'Instrument updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const newInstrument = {
          ...instrument,
          id: Date.now(),
        };
        inventory.push(newInstrument);
        await AsyncStorage.setItem(`inventory_${currentUser.id}`, JSON.stringify(inventory));
        Alert.alert('Success', 'Instrument added to inventory', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save instrument');
    }
  };

  const renderPicker = (items, selectedValue, onValueChange, placeholder) => (
    <View style={styles.pickerContainer}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[
            styles.pickerItem,
            selectedValue === item.value && styles.pickerItemSelected
          ]}
          onPress={() => onValueChange(item.value)}
        >
          <Text style={[
            styles.pickerText,
            selectedValue === item.value && styles.pickerTextSelected
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.title}>Add Instrument</Text>
      
      <Text style={styles.label}>Instrument Type *</Text>
      {renderPicker(
        INSTRUMENT_TYPES,
        instrument.type,
        (value) => setInstrument({ ...instrument, type: value })
      )}
      
      <Text style={styles.label}>Make *</Text>
      <TextInput
        style={styles.input}
        value={instrument.brand}
        onChangeText={(text) => setInstrument({ ...instrument, brand: text })}
        placeholder="Enter make/brand"
      />
      
      <Text style={styles.label}>Model *</Text>
      <TextInput
        style={styles.input}
        value={instrument.model}
        onChangeText={(text) => setInstrument({ ...instrument, model: text })}
        placeholder="Enter model"
      />
      
      <Text style={styles.label}>Serial Number</Text>
      <TextInput
        style={styles.input}
        value={instrument.serialNumber}
        onChangeText={(text) => setInstrument({ ...instrument, serialNumber: text })}
        placeholder="Enter serial number"
      />
      
      <Text style={styles.label}>Condition *</Text>
      {renderPicker(
        CONDITIONS,
        instrument.condition,
        (value) => setInstrument({ ...instrument, condition: value })
      )}
      
      <Text style={styles.label}>Estimated Value ($)</Text>
      <TextInput
        style={styles.input}
        value={instrument.value}
        onChangeText={(text) => setInstrument({ ...instrument, value: text })}
        placeholder="Enter value"
        keyboardType="numeric"
      />
      
      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={instrument.notes}
        onChangeText={(text) => setInstrument({ ...instrument, notes: text })}
        placeholder="Additional details, repairs needed, etc."
        multiline
        numberOfLines={3}
      />
      
      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>Pick Image</Text>
      </TouchableOpacity>
      
      {instrument.image && (
        <Image source={{ uri: instrument.image }} style={styles.imagePreview} />
      )}
      
      <TouchableOpacity style={styles.saveButton} onPress={saveInstrument}>
        <Text style={styles.saveButtonText}>{isEditing ? 'Update Instrument' : 'Add to Inventory'}</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#133965ff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerItemSelected: {
    backgroundColor: '#007bff',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  pickerTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  imageButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  imageButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});