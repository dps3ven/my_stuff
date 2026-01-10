import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddInstrumentScreen({ navigation }) {
  const [instrument, setInstrument] = useState({
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    condition: '',
    value: '',
    notes: '',
    image: null,
  });

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
      
      const newInstrument = {
        ...instrument,
        id: Date.now(),
      };
      
      inventory.push(newInstrument);
      await AsyncStorage.setItem(`inventory_${currentUser.id}`, JSON.stringify(inventory));
      
      Alert.alert('Success', 'Instrument added to inventory', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save instrument');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Instrument</Text>
      
      <Text style={styles.label}>Instrument Type *</Text>
      <Picker
        selectedValue={instrument.type}
        onValueChange={(value) => setInstrument({ ...instrument, type: value })}
        style={styles.picker}
      >
        <Picker.Item label="Select Type" value="" />
        <Picker.Item label="Guitar" value="Guitar" />
        <Picker.Item label="Bass" value="Bass" />
        <Picker.Item label="Drums" value="Drums" />
        <Picker.Item label="Piano" value="Piano" />
        <Picker.Item label="Violin" value="Violin" />
        <Picker.Item label="Other" value="Other" />
      </Picker>
      
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
      <Picker
        selectedValue={instrument.condition}
        onValueChange={(value) => setInstrument({ ...instrument, condition: value })}
        style={styles.picker}
      >
        <Picker.Item label="Select Condition" value="" />
        <Picker.Item label="New" value="New" />
        <Picker.Item label="Excellent" value="Excellent" />
        <Picker.Item label="Good" value="Good" />
        <Picker.Item label="Fair" value="Fair" />
        <Picker.Item label="Poor" value="Poor" />
      </Picker>
      
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
        <Text style={styles.saveButtonText}>Add to Inventory</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
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
  picker: {
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 8,
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