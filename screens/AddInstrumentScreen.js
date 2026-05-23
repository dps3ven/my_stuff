import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import storage from '../utils/storage';

const isWebDesktop = Platform.OS === 'web' && Dimensions.get('window').width > 768;

const INSTRUMENT_TYPES = [
  { label: 'Select Type', value: '' },
  { label: 'Guitar', value: 'Guitar' },
  { label: 'Bass', value: 'Bass' },
  { label: 'Drums', value: 'Drums' },
  { label: 'Piano', value: 'Piano' },
  { label: 'Violin', value: 'Violin' },
  { label: 'Microphone', value: 'Microphone' },
  { label: 'Amplifier', value: 'Amplifier' },
  { label: 'Other', value: 'Other' },
];

const MAKES_BY_TYPE = {
  Guitar: ['Fender', 'Gibson', 'PRS', 'Ibanez', 'Epiphone', 'Taylor', 'Martin', 'Yamaha', 'Gretsch', 'ESP', 'Jackson', 'Dean', 'Schecter', 'Peavey', 'Other'],
  Bass: ['Fender', 'Gibson', 'Music Man', 'Ibanez', 'Warwick', 'Rickenbacker', 'Spector', 'Yamaha', 'ESP', 'Peavey', 'Other'],
  Drums: ['Pearl', 'Tama', 'DW', 'Ludwig', 'Gretsch', 'Mapex', 'Sonor', 'Yamaha', 'Roland', 'Alesis', 'Other'],
  Piano: ['Steinway', 'Yamaha', 'Kawai', 'Roland', 'Casio', 'Nord', 'Korg', 'Baldwin', 'Bösendorfer', 'Other'],
  Violin: ['Stradivarius', 'Yamaha', 'Stentor', 'Mendini', 'Cecilio', 'Scott Cao', 'Other'],
  Microphone: ['Shure', 'Sennheiser', 'AKG', 'Audio-Technica', 'Neumann', 'Rode', 'Blue', 'Electro-Voice', 'Other'],
  Amplifier: ['Fender', 'Marshall', 'Vox', 'Mesa Boogie', 'Orange', 'Peavey', 'Blackstar', 'Line 6', 'Boss', 'Roland', 'Ampeg', 'Other'],
  Other: ['Other'],
};

const MODELS_BY_TYPE = {
  Guitar: ['Stratocaster', 'Telecaster', 'Les Paul', 'SG', 'ES-335', 'Flying V', 'Explorer', 'Jazzmaster', 'Jaguar', '335', 'PRS Custom 24', 'RG Series', 'Dreadnought', '000-15M', 'Wolfgang', 'HP Special', 'Predator', 'Raptor', 'Other'],
  Bass: ['Jazz Bass', 'Precision Bass', 'StingRay', 'Thunderbird', 'Rick 4003', '4-String', '5-String', 'SR Series', 'T-40', 'Fury', 'Foundation', 'Millennium', 'Grind', 'Other'],
  Drums: ['Export Series', 'Imperialstar', 'Collector\'s Series', 'Classic Maple', 'Catalina', 'Stage Custom', 'TD-17', 'DM10', 'Other'],
  Piano: ['Model D', 'U1', 'K-200', 'FP-90', 'PX-S3100', 'Stage 88', 'Kronos', 'Hamilton', 'Other'],
  Violin: ['4/4 Full Size', '3/4 Size', '1/2 Size', 'Electric Violin', 'Other'],
  Microphone: ['SM58', 'SM7B', 'e835', 'C414', 'AT2020', 'TLM 102', 'NT1', 'NT2-A', 'Yeti', 'Other'],
  Amplifier: ['Twin Reverb', 'Deluxe Reverb', 'Blues Junior', 'JCM800', 'DSL40', 'AC30', 'AC15', 'Dual Rectifier', 'Mark V', 'Rockerverb', 'Tiny Terror', '5150', '6505', 'HT-20', 'Spider V', 'Katana', 'SVT', 'Other'],
  Other: ['Other'],
};

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
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Stuff' : 'Add Stuff'
    });
  }, [navigation, isEditing]);

  const compressImageForWeb = (blobUri, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = blobUri;
    });
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setInstrument({ ...instrument, images: [...instrument.images, ...newImages] });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      let newImages;
      if (Platform.OS === 'web') {
        newImages = await Promise.all(
          result.assets.map(asset => compressImageForWeb(asset.uri))
        );
      } else {
        newImages = result.assets.map(asset => asset.uri);
      }
      setInstrument({ ...instrument, images: [...instrument.images, ...newImages] });
    }
  };

  const removeImage = (index) => {
    const updatedImages = instrument.images.filter((_, i) => i !== index);
    setInstrument({ ...instrument, images: updatedImages });
  };

  const saveInstrument = async () => {
    // Validate required fields
    const missingFields = [];
    if (!instrument.type) missingFields.push('Type');
    if (!instrument.brand) missingFields.push('Make');
    if (!instrument.model) missingFields.push('Model');

    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    setErrorMessage('');

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
      console.error('Failed to save stuff:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to save stuff: ' + error.message);
      } else {
        Alert.alert('Error', 'Failed to save stuff');
      }
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
          {items.filter(item => item.value !== '').map((item) => (
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS !== 'web'}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.title}>{isEditing ? '✏️ Edit Stuff' : '🎸 Add New Stuff'}</Text>

          {/* Image Section - Pinterest style hero */}
          <View style={styles.imageSection}>
            {instrument.images.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                {instrument.images.map((imageUri, index) => (
                  <View key={index} style={styles.pinCard}>
                    <Image source={{ uri: imageUri }} style={styles.pinImage} resizeMode="cover" />
                    <TouchableOpacity style={styles.pinRemove} onPress={() => removeImage(index)}>
                      <Text style={styles.pinRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyImageCard}>
                <Text style={styles.emptyImageEmoji}>📷</Text>
                <Text style={styles.emptyImageText}>Add photos of your stuff</Text>
              </View>
            )}
            <View style={styles.imageActions}>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
                  <Text style={styles.imageButtonText}>📷 Camera</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Text style={styles.imageButtonText}>🖼️ Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>Type</Text>
                {renderCollapsiblePicker(
                  INSTRUMENT_TYPES,
                  instrument.type,
                  (value) => setInstrument({ ...instrument, type: value, brand: '', model: '' }),
                  showTypePicker,
                  setShowTypePicker
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Make</Text>
                {instrument.type && MAKES_BY_TYPE[instrument.type] ? (
                  <>
                    {renderCollapsiblePicker(
                      [{ label: 'Select Make', value: '' }, ...MAKES_BY_TYPE[instrument.type].map(m => ({ label: m, value: m }))],
                      instrument.brand === 'Other' ? 'Other' : instrument.brand,
                      (value) => setInstrument({ ...instrument, brand: value }),
                      showMakePicker,
                      setShowMakePicker
                    )}
                    {instrument.brand === 'Other' && (
                      <TextInput
                        style={styles.otherInput}
                        value={instrument.customBrand || ''}
                        onChangeText={(text) => setInstrument({ ...instrument, customBrand: text, brand: text || 'Other' })}
                        placeholder="✏️ Type your make/brand here"
                      />
                    )}
                  </>
                ) : (
                  <TextInput
                    style={[styles.input, { color: '#aaa' }]}
                    value=""
                    placeholder="Pick a type first"
                    editable={false}
                  />
                )}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>Model</Text>
                {instrument.type && MODELS_BY_TYPE[instrument.type] ? (
                  <>
                    {renderCollapsiblePicker(
                      [{ label: 'Select Model', value: '' }, ...MODELS_BY_TYPE[instrument.type].map(m => ({ label: m, value: m }))],
                      instrument.model === 'Other' ? 'Other' : instrument.model,
                      (value) => setInstrument({ ...instrument, model: value }),
                      showModelPicker,
                      setShowModelPicker
                    )}
                    {instrument.model === 'Other' && (
                      <TextInput
                        style={styles.otherInput}
                        value={instrument.customModel || ''}
                        onChangeText={(text) => setInstrument({ ...instrument, customModel: text, model: text || 'Other' })}
                        placeholder="✏️ Type your model here"
                      />
                    )}
                  </>
                ) : (
                  <TextInput
                    style={[styles.input, { color: '#aaa' }]}
                    value=""
                    placeholder="Pick a type first"
                    editable={false}
                  />
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Serial Number</Text>
                <TextInput
                  style={styles.input}
                  value={instrument.serialNumber}
                  onChangeText={(text) => setInstrument({ ...instrument, serialNumber: text })}
                  placeholder="Optional"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>Condition</Text>
                {renderCollapsiblePicker(
                  CONDITIONS,
                  instrument.condition,
                  (value) => setInstrument({ ...instrument, condition: value }),
                  showConditionPicker,
                  setShowConditionPicker
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Value ($)</Text>
                <TextInput
                  style={styles.input}
                  value={instrument.value}
                  onChangeText={(text) => setInstrument({ ...instrument, value: text })}
                  placeholder="Estimated"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.saveButton} onPress={saveInstrument}>
            <Text style={styles.saveButtonText}>{isEditing ? '✅ Save Changes' : '➕ Add to My Stuff'}</Text>
          </TouchableOpacity>
        </ScrollView>
        
        <View style={styles.fixedFooter}>
          <TouchableOpacity 
            style={styles.dashboardButton} 
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.dashboardButtonText}>← Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#133965',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    maxWidth: isWebDesktop ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    color: '#fff',
  },
  imageSection: {
    marginBottom: 16,
  },
  imageRow: {
    marginBottom: 12,
  },
  pinCard: {
    width: 160,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pinImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  pinRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinRemoveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyImageCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  emptyImageEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyImageText: {
    color: '#999',
    fontSize: 16,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 10,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 24,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cameraButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  imageButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formRow: {
    flexDirection: isWebDesktop ? 'row' : 'column',
    gap: 12,
    marginBottom: 4,
  },
  formField: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 15,
    color: '#333',
  },
  otherInput: {
    backgroundColor: '#fffde7',
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F39C12',
    fontSize: 15,
    color: '#333',
  },
  pickerButton: {
    backgroundColor: '#f8f8f8',
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 15,
    color: '#333',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
    marginTop: -12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pickerItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  pickerText: {
    fontSize: 15,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 18,
    borderRadius: 28,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  errorContainer: {
    backgroundColor: '#fff3f3',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  dashboardButton: {
    padding: 12,
  },
  dashboardButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f2d52',
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});