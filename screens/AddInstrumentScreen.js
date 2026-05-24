import React, { useState, useEffect, useRef } from 'react';
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
  Guitar: ['Stratocaster', 'Telecaster', 'Les Paul', 'SG', 'ES-335', 'Flying V', 'Explorer', 'Jazzmaster', 'Jaguar', 'PRS Custom 24', 'RG Series', 'Dreadnought', 'Wolfgang', 'HP Special', 'Predator', 'Raptor', 'Other'],
  Bass: ['Jazz Bass', 'Precision Bass', 'StingRay', 'Thunderbird', 'Rick 4003', '4-String', '5-String', 'SR Series', 'T-40', 'Fury', 'Foundation', 'Millennium', 'Grind', 'Other'],
  Drums: ['Export Series', 'Imperialstar', "Collector's Series", 'Classic Maple', 'Catalina', 'Stage Custom', 'TD-17', 'DM10', 'Other'],
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

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [
  { label: 'Select Year', value: '' },
  ...Array.from({ length: CURRENT_YEAR - 1899 }, (_, i) => {
    const year = CURRENT_YEAR - i;
    return { label: year.toString(), value: year.toString() };
  }),
];

const STEPS = ['Photos', 'Category', 'Details'];

export default function AddInstrumentScreen({ navigation, route }) {
  const editItem = route?.params?.editItem;
  const isEditing = !!editItem;

  const [step, setStep] = useState(0);
  const [instrument, setInstrument] = useState({
    type: editItem?.type || '',
    brand: editItem?.brand || '',
    model: editItem?.model || '',
    year: editItem?.year || '',
    serialNumber: editItem?.serialNumber || '',
    condition: editItem?.condition || '',
    value: editItem?.value || '',
    notes: editItem?.notes || '',
    images: editItem?.images || [],
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [activePicker, setActivePicker] = useState(null);
  const [activePickerItems, setActivePickerItems] = useState([]);
  const [activePickerCallback, setActivePickerCallback] = useState(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Stuff' : 'Add Stuff' });
  }, [navigation, isEditing]);

  // ── Image helpers ──────────────────────────────────────────────
  const compressImageForWeb = (blobUri, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') { resolve(blobUri); return; }
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch { resolve(blobUri); }
      };
      img.onerror = () => resolve(blobUri);
      img.src = blobUri;
    });
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Camera access is needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) {
      setInstrument(prev => ({ ...prev, images: [...prev.images, result.assets[0].uri] }));
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 1 });
    if (!result.canceled) {
      let newImages;
      if (Platform.OS === 'web') {
        newImages = await Promise.all(result.assets.map(a => compressImageForWeb(a.uri)));
      } else {
        newImages = result.assets.map(a => a.uri);
      }
      setInstrument(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const removeImage = (index) => {
    setInstrument(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // ── Picker helpers ─────────────────────────────────────────────
  const openPicker = (title, items, onSelect) => {
    setActivePicker(title);
    setActivePickerItems(items.filter(i => i.value !== ''));
    setActivePickerCallback(() => onSelect);
  };

  const closePicker = (value) => {
    if (value !== undefined && activePickerCallback) activePickerCallback(value);
    setActivePicker(null);
    setActivePickerItems([]);
    setActivePickerCallback(null);
    setTimeout(() => scrollViewRef.current?.flashScrollIndicators?.(), 100);
  };

  const renderPickerButton = (label, selectedValue, title, items, onSelect) => (
    <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker(title, items, onSelect)}>
      <Text style={[styles.pickerButtonText, !selectedValue && { color: '#999' }]}>{selectedValue || label}</Text>
      <Text style={styles.pickerArrow}>▼</Text>
    </TouchableOpacity>
  );

  // ── Save ───────────────────────────────────────────────────────
  const saveInstrument = async () => {
    const missingFields = [];
    if (!instrument.type) missingFields.push('Type');
    if (!instrument.brand) missingFields.push('Make');
    if (!instrument.model) missingFields.push('Model');
    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in: ${missingFields.join(', ')}`);
      if (!isWebDesktop) setStep(1);
      return;
    }
    setErrorMessage('');
    try {
      const currentUser = JSON.parse(await storage.getItem('currentUser'));
      const inventory = JSON.parse(await storage.getItem(`inventory_${currentUser.id}`) || '[]');
      if (isEditing) {
        const updated = inventory.map(item => item.id === editItem.id ? { ...instrument, id: editItem.id } : item);
        await storage.setItem(`inventory_${currentUser.id}`, JSON.stringify(updated));
      } else {
        inventory.push({ ...instrument, id: Date.now() });
        await storage.setItem(`inventory_${currentUser.id}`, JSON.stringify(inventory));
      }
      navigation.navigate('Dashboard');
    } catch (error) {
      setErrorMessage('Failed to save: ' + error.message);
    }
  };

  // ── Step content ───────────────────────────────────────────────
  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>📸 Add Photos</Text>
      <Text style={styles.stepHint}>First photo will be the cover image.</Text>

      {instrument.images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
          {instrument.images.map((uri, index) => (
            <View key={index} style={styles.pinCard}>
              <Image source={{ uri }} style={styles.pinImage} resizeMode="cover" />
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
        <TouchableOpacity style={styles.emptyImageCard} onPress={pickImage}>
          <Text style={styles.emptyImageEmoji}>📷</Text>
          <Text style={styles.emptyImageText}>Tap to add photos</Text>
        </TouchableOpacity>
      )}

      <View style={styles.imageActions}>
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
            <Text style={styles.imageButtonText}>📷 Camera</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>🖼️ Library</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>🎸 Category</Text>
      <Text style={styles.stepHint}>What kind of instrument is it?</Text>

      <Text style={styles.fieldLabel}>Type <Text style={styles.required}>*</Text></Text>
      {renderPickerButton('Select type', instrument.type, 'Type', INSTRUMENT_TYPES,
        (v) => setInstrument(prev => ({ ...prev, type: v, brand: '', model: '' }))
      )}

      <Text style={styles.fieldLabel}>Make / Brand <Text style={styles.required}>*</Text></Text>
      {instrument.type && MAKES_BY_TYPE[instrument.type] ? (
        <>
          {renderPickerButton('Select make', instrument.brand === 'Other' ? 'Other' : instrument.brand, 'Make',
            [{ label: 'Select Make', value: '' }, ...MAKES_BY_TYPE[instrument.type].map(m => ({ label: m, value: m }))],
            (v) => setInstrument(prev => ({ ...prev, brand: v }))
          )}
          {instrument.brand === 'Other' && (
            <TextInput style={styles.otherInput} value={instrument.customBrand || ''}
              onChangeText={(t) => setInstrument(prev => ({ ...prev, customBrand: t, brand: t || 'Other' }))}
              placeholder="Enter brand name" />
          )}
        </>
      ) : (
        <View style={[styles.pickerButton, styles.disabledField]}>
          <Text style={styles.disabledText}>Select a type first</Text>
        </View>
      )}

      <Text style={styles.fieldLabel}>Model <Text style={styles.required}>*</Text></Text>
      {instrument.type && MODELS_BY_TYPE[instrument.type] ? (
        <>
          {renderPickerButton('Select model', instrument.model === 'Other' ? 'Other' : instrument.model, 'Model',
            [{ label: 'Select Model', value: '' }, ...MODELS_BY_TYPE[instrument.type].map(m => ({ label: m, value: m }))],
            (v) => setInstrument(prev => ({ ...prev, model: v }))
          )}
          {instrument.model === 'Other' && (
            <TextInput style={styles.otherInput} value={instrument.customModel || ''}
              onChangeText={(t) => setInstrument(prev => ({ ...prev, customModel: t, model: t || 'Other' }))}
              placeholder="Enter model name" />
          )}
        </>
      ) : (
        <View style={[styles.pickerButton, styles.disabledField]}>
          <Text style={styles.disabledText}>Select a type first</Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>📋 Details</Text>
      <Text style={styles.stepHint}>Add more info to complete your listing.</Text>

      <Text style={styles.fieldLabel}>Year</Text>
      {renderPickerButton('Select year', instrument.year, 'Year', YEARS,
        (v) => setInstrument(prev => ({ ...prev, year: v }))
      )}

      <Text style={styles.fieldLabel}>Serial Number</Text>
      <TextInput style={styles.input} value={instrument.serialNumber}
        onChangeText={(t) => setInstrument(prev => ({ ...prev, serialNumber: t }))}
        placeholder="e.g. US12345678" />

      <Text style={styles.fieldLabel}>Condition</Text>
      {renderPickerButton('Select condition', instrument.condition, 'Condition', CONDITIONS,
        (v) => setInstrument(prev => ({ ...prev, condition: v }))
      )}

      <Text style={styles.fieldLabel}>Estimated Value ($)</Text>
      <TextInput style={styles.input} value={instrument.value}
        onChangeText={(t) => setInstrument(prev => ({ ...prev, value: t }))}
        placeholder="0.00" keyboardType="numeric" />
    </View>
  );

  // ── Web desktop: single page ───────────────────────────────────
  const renderWebDesktop = () => (
    <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={true}>
      <View style={styles.titleRow}>
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.backArrowText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Stuff' : 'Add New Stuff'}</Text>
        <View style={{ width: 60 }} />
      </View>
      {renderStep0()}
      {renderStep1()}
      {renderStep2()}
      {errorMessage ? <View style={styles.errorContainer}><Text style={styles.errorText}>{errorMessage}</Text></View> : null}
    </ScrollView>
  );

  // ── Mobile: wizard ─────────────────────────────────────────────
  const renderMobileWizard = () => (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.wizardHeader}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.navigate('Dashboard')}>
          <Text style={styles.wizardBack}>{step > 0 ? '← Back' : '✕'}</Text>
        </TouchableOpacity>
        <Text style={styles.wizardTitle}>{isEditing ? 'Edit Stuff' : 'Add New Stuff'}</Text>
        <TouchableOpacity onPress={saveInstrument}>
          <Text style={styles.wizardSave}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        {STEPS.map((s, i) => (
          <TouchableOpacity key={i} style={styles.progressStep} onPress={() => setStep(i)}>
            <View style={[styles.progressDot, i <= step && styles.progressDotActive]} />
            <Text style={[styles.progressLabel, i === step && styles.progressLabelActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Step content */}
      <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={styles.wizardContent}
        keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={true}>
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {errorMessage ? <View style={styles.errorContainer}><Text style={styles.errorText}>{errorMessage}</Text></View> : null}
      </ScrollView>

      {/* Footer nav */}
      <View style={styles.wizardFooter}>
        {step < STEPS.length - 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={() => { setErrorMessage(''); setStep(step + 1); }}>
            <Text style={styles.nextButtonText}>Next: {STEPS[step + 1]} →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.saveButtonFull} onPress={saveInstrument}>
            <Text style={styles.saveButtonText}>{isEditing ? '✅ Save Changes' : '➕ Add to My Stuff'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#133965', height: Platform.OS === 'web' ? '100%' : undefined }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS !== 'web'}
      >
        {isWebDesktop ? (
          <View style={styles.webContainer}>
            {renderWebDesktop()}
            <View style={styles.fixedFooter}>
              <TouchableOpacity style={styles.saveButtonFull} onPress={saveInstrument}>
                <Text style={styles.saveButtonText}>{isEditing ? '✅ Save Changes' : '➕ Add to My Stuff'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dashboardButton} onPress={() => navigation.navigate('Dashboard')}>
                <Text style={styles.dashboardButtonText}>← Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          renderMobileWizard()
        )}
      </KeyboardAvoidingView>

      {/* Picker Modal */}
      <Modal visible={activePicker !== null} transparent animationType="slide"
        onRequestClose={() => closePicker()} hardwareAccelerated>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => closePicker()} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activePicker}</Text>
              <TouchableOpacity onPress={() => closePicker()}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList data={activePickerItems} keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => closePicker(item.value)}>
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Web desktop ──────────────────────────────────────────────
  webContainer: {
    flex: 1,
    backgroundColor: '#133965',
  },
  scrollView: {
    flex: 1,
    WebkitOverflowScrolling: 'touch',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 160,
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#fff',
    flex: 1,
  },
  backArrow: { paddingHorizontal: 10, paddingVertical: 6 },
  backArrowText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // ── Mobile wizard ────────────────────────────────────────────
  wizardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#133965',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  wizardBack: { color: '#fff', fontSize: 15, fontWeight: '600', minWidth: 50 },
  wizardTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  wizardSave: { color: '#28a745', fontSize: 15, fontWeight: '700', minWidth: 50, textAlign: 'right' },
  progressBar: {
    flexDirection: 'row',
    backgroundColor: '#0f2d52',
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  progressStep: { alignItems: 'center', gap: 4 },
  progressDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: { backgroundColor: '#28a745' },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  progressLabelActive: { color: '#fff', fontWeight: '700' },
  wizardContent: { padding: 16, paddingBottom: 20 },
  wizardFooter: {
    backgroundColor: '#0f2d52',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  nextButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // ── Shared step content ──────────────────────────────────────
  stepContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stepTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 4 },
  stepHint: { fontSize: 13, color: '#888', marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  required: { color: '#e53935' },

  // ── Images ───────────────────────────────────────────────────
  imageRow: { marginBottom: 12 },
  pinCard: {
    width: 120, height: 120, borderRadius: 10,
    overflow: 'hidden', marginRight: 10,
    backgroundColor: '#eee',
  },
  pinImage: { width: '100%', height: '100%' },
  coverBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: '#0064d2', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  coverBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  pinRemove: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  pinRemoveText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  addMoreCard: {
    width: 80, height: 120, borderRadius: 10,
    borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  addMoreText: { fontSize: 32, color: '#aaa' },
  emptyImageCard: {
    backgroundColor: '#f5f5f5', borderRadius: 12, padding: 30,
    alignItems: 'center', borderWidth: 2, borderColor: '#eee',
    borderStyle: 'dashed', marginBottom: 12,
  },
  emptyImageEmoji: { fontSize: 40, marginBottom: 8 },
  emptyImageText: { color: '#999', fontSize: 15 },
  imageActions: { flexDirection: 'row', gap: 10 },
  imageButton: {
    flex: 1, backgroundColor: '#28a745', padding: 12,
    borderRadius: 20, alignItems: 'center',
  },
  cameraButton: {
    flex: 1, backgroundColor: '#333', padding: 12,
    borderRadius: 20, alignItems: 'center',
  },
  imageButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // ── Form fields ──────────────────────────────────────────────
  input: {
    backgroundColor: '#f8f8f8', padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd', fontSize: 15, color: '#333',
  },
  pickerButton: {
    backgroundColor: '#f8f8f8', padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pickerButtonText: { fontSize: 15, color: '#333' },
  pickerArrow: { fontSize: 12, color: '#28a745', fontWeight: 'bold' },
  disabledField: { opacity: 0.5 },
  disabledText: { color: '#aaa', fontSize: 15 },
  otherInput: {
    backgroundColor: '#fffde7', padding: 12, marginTop: 8,
    borderRadius: 10, borderWidth: 2, borderColor: '#F39C12',
    fontSize: 14, color: '#333',
  },

  // ── Save / footer ────────────────────────────────────────────
  saveButtonFull: {
    backgroundColor: '#0064d2', padding: 16, borderRadius: 10,
    alignItems: 'center', width: '100%', maxWidth: 400, alignSelf: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  fixedFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0f2d52', padding: 12, gap: 8, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
  },
  dashboardButton: { padding: 10, alignItems: 'center' },
  dashboardButtonText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },

  // ── Error ────────────────────────────────────────────────────
  errorContainer: {
    backgroundColor: '#fff3f3', padding: 14, borderRadius: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#ffcdd2',
  },
  errorText: { color: '#c62828', textAlign: 'center', fontSize: 14, fontWeight: '600' },

  // ── Modal ────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', flexDirection: 'column',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '60%', paddingBottom: 30,
    width: '90%', maxWidth: 500, alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  modalClose: { fontSize: 20, color: '#999', padding: 4 },
  modalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  modalItemText: { fontSize: 16, color: '#333' },
});
