import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, KeyboardAvoidingView, Platform, Dimensions, Modal, FlatList } from 'react-native';
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
  const [activePicker, setActivePicker] = useState(null);
  const [activePickerItems, setActivePickerItems] = useState([]);
  const [activePickerCallback, setActivePickerCallback] = useState(null);

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

  const openPicker = (title, items, onSelect) => {
    setActivePicker(title);
    setActivePickerItems(items.filter(i => i.value !== ''));
    setActivePickerCallback(() => onSelect);
  };

  const renderPickerButton = (label, selectedValue, title, items, onSelect) => (
    <TouchableOpacity
      style={styles.pickerButton}
      onPress={() => openPicker(title, items, onSelect)}
    >
      <Text style={[styles.pickerButtonText, !selectedValue && { color: '#999' }]}>
        {selectedValue || label}
      </Text>
      <Text style={styles.pickerArrow}>▼</Text>
    </TouchableOpacity>
  );

  return (
    <>
    <KeyboardAvoidingView
      style={{ flex: 1, height: Platform.OS === 'web' ? '100%' : undefined }}
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
          <Text style={styles.title}>{isEditing ? 'Edit Listing' : 'Create Listing'}</Text>

          {/* SECTION 1: Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>📸 Photos</Text>
            <Text style={styles.sectionHint}>Add up to 10 photos. First photo is the cover.</Text>
            {instrument.images.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                {instrument.images.map((imageUri, index) => (
                  <View key={index} style={styles.pinCard}>
                    <Image source={{ uri: imageUri }} style={styles.pinImage} resizeMode="cover" />
                    {index === 0 && <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Cover</Text></View>}
                    <TouchableOpacity style={styles.pinRemove} onPress={() => removeImage(index)}>
                      <Text style={styles.pinRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addMoreCard} onPress={pickImage}>
                  <Text style={styles.addMoreText}>+</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.emptyImageCard}>
                <Text style={styles.emptyImageEmoji}>📷</Text>
                <Text style={styles.emptyImageText}>Add photos to attract more interest</Text>
              </View>
            )}
            <View style={styles.imageActions}>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
                  <Text style={styles.imageButtonText}>📷 Take Photo</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Text style={styles.imageButtonText}>🖼️ Choose from Library</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SECTION 2: Item Details */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>📋 Item Details</Text>

            <Text style={styles.fieldLabel}>Category <Text style={styles.required}>*</Text></Text>
            {renderPickerButton('Select instrument type', instrument.type, 'Category', INSTRUMENT_TYPES,
              (value) => setInstrument({ ...instrument, type: value, brand: '', model: '' })
            )}

            <Text style={styles.fieldLabel}>Brand / Make <Text style={styles.required}>*</Text></Text>
            {instrument.type && MAKES_BY_TYPE[instrument.type] ? (
              <>
                {renderPickerButton('Select brand', instrument.brand === 'Other' ? 'Other' : instrument.brand, 'Brand / Make',
                  [{ label: 'Select Make', value: '' }, ...MAKES_BY_TYPE[instrument.type].map(m => ({ label: m, value: m }))],
                  (value) => setInstrument({ ...instrument, brand: value })
                )}
                {instrument.brand === 'Other' && (
                  <TextInput
                    style={styles.otherInput}
                    value={instrument.customBrand || ''}
                    onChangeText={(text) => setInstrument({ ...instrument, customBrand: text, brand: text || 'Other' })}
                    placeholder="Enter brand name"
                  />
                )}
              </>
            ) : (
              <View style={[styles.pickerButton, styles.disabledField]}>
                <Text style={styles.disabledText}>Select a category first</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Model <Text style={styles.required}>*</Text></Text>
            {instrument.type && MODELS_BY_TYPE[instrument.type] ? (
              <>
                {renderPickerButton('Select model', instrument.model === 'Other' ? 'Other' : instrument.model, 'Model',
                  [{ label: 'Select Model', value: '' }, ...MODELS_BY_TYPE[instrument.type].map(m => ({ label: m, value: m }))],
                  (value) => setInstrument({ ...instrument, model: value })
                )}
                {instrument.model === 'Other' && (
                  <TextInput
                    style={styles.otherInput}
                    value={instrument.customModel || ''}
                    onChangeText={(text) => setInstrument({ ...instrument, customModel: text, model: text || 'Other' })}
                    placeholder="Enter model name"
                  />
                )}
              </>
            ) : (
              <View style={[styles.pickerButton, styles.disabledField]}>
                <Text style={styles.disabledText}>Select a category first</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Serial Number</Text>
            <TextInput
              style={styles.input}
              value={instrument.serialNumber}
              onChangeText={(text) => setInstrument({ ...instrument, serialNumber: text })}
              placeholder="e.g. US12345678 (found on headstock or back)"
            />
          </View>

          {/* SECTION 3: Condition & Price */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>💰 Condition & Value</Text>

            <Text style={styles.fieldLabel}>Condition <Text style={styles.required}>*</Text></Text>
            {renderPickerButton('Select condition', instrument.condition, 'Condition', CONDITIONS,
              (value) => setInstrument({ ...instrument, condition: value })
            )}

            <Text style={styles.fieldLabel}>Estimated Value ($)</Text>
            <TextInput
              style={styles.input}
              value={instrument.value}
              onChangeText={(text) => setInstrument({ ...instrument, value: text })}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

        </ScrollView>
        
        <View style={styles.fixedFooter}>
          <TouchableOpacity style={styles.saveButton} onPress={saveInstrument}>
            <Text style={styles.saveButtonText}>{isEditing ? '✅ Save Changes' : '➕ Add to My Stuff'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dashboardButton} 
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.dashboardButtonText}>← Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>

      {/* Picker Modal */}
      <Modal
        visible={activePicker !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={{ flex: 1 }}
            activeOpacity={1} 
            onPress={() => setActivePicker(null)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activePicker}</Text>
              <TouchableOpacity onPress={() => setActivePicker(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={activePickerItems}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (activePickerCallback) activePickerCallback(item.value);
                    setActivePicker(null);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#133965',
    height: Platform.OS === 'web' ? '100%' : undefined,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    height: Platform.OS === 'web' ? '100%' : undefined,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 160,
    maxWidth: isWebDesktop ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'left',
    marginBottom: 16,
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  required: {
    color: '#e53935',
  },
  disabledField: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  disabledText: {
    color: '#aaa',
    fontSize: 15,
  },
  addMoreCard: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#fafafa',
  },
  addMoreText: {
    fontSize: 28,
    color: '#aaa',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#0064d2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 15,
    color: '#333',
  },
  otherInput: {
    backgroundColor: '#fffde7',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F39C12',
    fontSize: 14,
    color: '#333',
  },
  pickerButton: {
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
    overflow: 'hidden',
    maxHeight: 180,
  },
  pickerItem: {
    padding: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#0064d2',
    padding: 14,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#0064d2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    padding: 10,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
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
    gap: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    flexDirection: 'column',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalClose: {
    fontSize: 20,
    color: '#999',
    padding: 4,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
});