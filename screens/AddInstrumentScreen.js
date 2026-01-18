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
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Instrument' : 'Add Instrument'
    });
  }, [navigation, isEditing]);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library.
    // Manually request permissions for videos on iOS when `allowsEditing` is set to `false`
    // and `videoExportPreset` is `'Passthrough'` (the default), ideally before launching the picker
    // so the app users aren't surprised by a system dialog after picking a video.
    // See "Invoke permissions for videos" sub section for more details.
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
    </View>
  );

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

const renderCollapsiblePicker = (items, selectedValue, onValueChange, isVisible, setVisible) => (
  <View>
    <TouchableOpacity
      style={styles.pickerButton}
      onPress={() => setVisible(!isVisible)}
    >
      <Text style={styles.pickerButtonText}>
        {selectedValue || items[0].label}
      </Text>
      <Text style={styles.pickerArrow}>{isVisible ? '▲' : '▼'}</Text>
    </TouchableOpacity>
    {isVisible && (
      <View style={styles.pickerContainer}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={styles.pickerItem}
            onPress={() => {
              onValueChange(item.value);
              setVisible(false);
            }}
          >
            <Text style={styles.pickerText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

return (
  <View style={styles.container}>
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={true}
      nestedScrollEnabled={true}
    >
      <Text style={styles.title}>Add Instrument</Text>

      <Text style={styles.label}>Instrument Type *</Text>
      {renderCollapsiblePicker(
        INSTRUMENT_TYPES,
        instrument.type,
        (value) => setInstrument({ ...instrument, type: value }),
        showTypePicker,
        setShowTypePicker
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
      {renderCollapsiblePicker(
        CONDITIONS,
        instrument.condition,
        (value) => setInstrument({ ...instrument, condition: value }),
        showConditionPicker,
        setShowConditionPicker
      )}

      <Text style={styles.label}>Estimated Value ($)</Text>
      <TextInput
        style={styles.input}
        value={instrument.value}
        onChangeText={(text) => setInstrument({ ...instrument, value: text })}
        placeholder="Enter value"
        keyboardType="numeric"
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
  </View>
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
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
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
  pickerButton: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerArrow: {
    fontSize: 16,
    color: '#666',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    marginTop: -15,
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
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