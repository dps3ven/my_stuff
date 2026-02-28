import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import storage from '../utils/storage';

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
    images: editItem?.images || [],
  });
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Instrument' : 'Add Instrument'
    });
  }, [navigation, isEditing]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setInstrument({ ...instrument, images: [...instrument.images, ...newImages] });
    }
  };

  const removeImage = (index) => {
    const updatedImages = instrument.images.filter((_, i) => i !== index);
    setInstrument({ ...instrument, images: updatedImages });
  };

  const saveInstrument = async () => {
    if (!instrument.type || !instrument.brand || !instrument.model) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const currentUser = JSON.parse(await storage.getItem('currentUser'));
      const inventory = JSON.parse(await storage.getItem(`inventory_${currentUser.id}`) || '[]');

      if (isEditing) {
        const updatedInventory = inventory.map(item =>
          item.id === editItem.id ? { ...instrument, id: editItem.id } : item
        );
        await storage.setItem(`inventory_${currentUser.id}`, JSON.stringify(updatedInventory));
        navigation.navigate('Dashboard');
      } else {
        const newInstrument = {
          ...instrument,
          id: Date.now(),
        };
        inventory.push(newInstrument);
        await storage.setItem(`inventory_${currentUser.id}`, JSON.stringify(inventory));
        navigation.navigate('Dashboard');
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
          nestedScrollEnabled={true}
        >
          <View style={Platform.OS === 'web' && instrument.images.length > 0 ? styles.contentWrapper : null}>
            <View style={Platform.OS === 'web' && instrument.images.length > 0 ? styles.formColumn : null}>
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
                <Text style={styles.imageButtonText}>Select Images</Text>
              </TouchableOpacity>

              {Platform.OS !== 'web' && instrument.images.length > 0 && (
                <View style={styles.imageGallery}>
                  <Text style={styles.galleryTitle}>Selected Images ({instrument.images.length})</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true}
                    style={styles.horizontalScroll}
                  >
                    {instrument.images.map((imageUri, index) => (
                      <View key={index} style={styles.imageCard}>
                        <Image source={{ uri: imageUri }} style={styles.cardImage} />
                        <Text style={styles.cardLabel}>Image {index + 1}</Text>
                        <TouchableOpacity 
                          style={styles.removeButton} 
                          onPress={() => removeImage(index)}
                        >
                          <Text style={styles.removeButtonText}>✕ Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity style={styles.saveButton} onPress={saveInstrument}>
                <Text style={styles.saveButtonText}>{isEditing ? 'Update Instrument' : 'Add to Inventory'}</Text>
              </TouchableOpacity>
            </View>

            {Platform.OS === 'web' && instrument.images.length > 0 && (
              <View style={styles.imageColumn}>
                <Text style={styles.galleryTitle}>Selected Images ({instrument.images.length})</Text>
                <ScrollView 
                  style={styles.verticalScroll}
                  showsVerticalScrollIndicator={true}
                >
                  <View style={styles.imageGrid}>
                    {instrument.images.map((imageUri, index) => (
                      <View key={index} style={styles.imageCardWeb}>
                        <Image source={{ uri: imageUri }} style={styles.cardImageWeb} />
                        <View style={styles.imageCardFooter}>
                          <Text style={styles.cardLabelWeb}>Image {index + 1}</Text>
                          <TouchableOpacity 
                            style={styles.removeButtonSmall} 
                            onPress={() => removeImage(index)}
                          >
                            <Text style={styles.removeButtonText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
    width: Platform.OS === 'web' ? '100%' : '100%',
    maxWidth: Platform.OS === 'web' ? 1200 : '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: Platform.OS === 'web' ? 36 : 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#fff',
  },
  label: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  input: {
    backgroundColor: 'white',
    padding: Platform.OS === 'web' ? 18 : 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: Platform.OS === 'web' ? 18 : 16,
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
  contentWrapper: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  formColumn: {
    flex: 1,
    minWidth: 0,
  },
  imageColumn: {
    width: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
  },
  verticalScroll: {
    maxHeight: 600,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageGallery: {
    marginBottom: 20,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  horizontalScroll: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
  },
  imageCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginRight: 15,
    alignItems: 'center',
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: 130,
    height: 130,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  imageCardWeb: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImageWeb: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginBottom: 8,
  },
  imageCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabelWeb: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  removeButtonSmall: {
    backgroundColor: '#dc3545',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});