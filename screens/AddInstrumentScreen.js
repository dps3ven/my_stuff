import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import storage from '../utils/storage';

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

const STEPS = ['Category', 'Photos', 'Details'];

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: '$', AUD: '$' };

export default function AddInstrumentScreen({ navigation, route }) {
  const editItem = route?.params?.editItem;
  const isEditing = !!editItem;
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 768;
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [userPrefs, setUserPrefs] = useState({ primaryInstrument: '', currency: 'USD' });
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
  const scrollViewRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Stuff' : 'Add Stuff' });
    // Load user preferences and pre-select primary instrument for new items
    (async () => {
      try {
        const currentUser = JSON.parse(await storage.getItem('currentUser'));
        if (currentUser?.preferences) {
          setUserPrefs(currentUser.preferences);
          if (!isEditing && !instrument.type && currentUser.preferences.primaryInstrument) {
            setInstrument(prev => ({ ...prev, type: currentUser.preferences.primaryInstrument }));
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [navigation, isEditing]);

  // ── Image helpers ──────────────────────────────────────────────
  const compressImageForWeb = (blobUri, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') { resolve({ uri: blobUri, size: 0 }); return; }
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const dataUri = canvas.toDataURL('image/jpeg', quality);
          // base64 chars * 0.75 gives actual byte size
          const size = Math.round(dataUri.length * 0.75);
          resolve({ uri: dataUri, size });
        } catch { resolve({ uri: blobUri, size: 0 }); }
      };
      img.onerror = () => resolve({ uri: blobUri, size: 0 });
      img.src = blobUri;
    });
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Camera access is needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setInstrument(prev => ({
        ...prev,
        images: [...prev.images, { uri: asset.uri, size: asset.fileSize || 0 }],
      }));
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 1 });
    if (!result.canceled) {
      let newImages;
      if (Platform.OS === 'web') {
        newImages = await Promise.all(result.assets.map(a => compressImageForWeb(a.uri)));
      } else {
        newImages = result.assets.map(a => ({ uri: a.uri, size: a.fileSize || 0 }));
      }
      setInstrument(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const removeImage = (index) => {
    setInstrument(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // ── Picker helpers ─────────────────────────────────────────────
  // Inline chip-style picker — keeps options in the page flow so they scroll
  // with the rest of the form regardless of screen size or orientation.
  const renderPickerButton = (label, selectedValue, title, items, onSelect) => {
    const options = items.filter(i => i.value !== '');
    return (
      <View style={styles.chipPickerRow}>
        {options.map(opt => {
          const active = selectedValue === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chipOption, active && styles.chipOptionActive]}
              onPress={() => onSelect(opt.value)}
            >
              <Text style={[styles.chipOptionText, active && styles.chipOptionTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ── Save ───────────────────────────────────────────────────────
  const saveInstrument = async () => {
    const missingFields = [];
    if (!instrument.type) missingFields.push('Type');
    if (!instrument.brand) missingFields.push('Make');
    if (!instrument.model) missingFields.push('Model');
    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in: ${missingFields.join(', ')}`);
      if (!isWide) setStep(1);
      return;
    }
    setErrorMessage('');
    try {
      const currentUser = JSON.parse(await storage.getItem('currentUser'));
      const inventory = JSON.parse(await storage.getItem(`inventory_${currentUser.id}`) || '[]');

      // Resolve "Other" custom values before saving
      const finalInstrument = {
        ...instrument,
        brand: instrument.brand === 'Other' && instrument.customBrand ? instrument.customBrand : instrument.brand,
        model: instrument.model === 'Other' && instrument.customModel ? instrument.customModel : instrument.model,
      };

      if (isEditing) {
        const updated = inventory.map(item => item.id === editItem.id ? { ...finalInstrument, id: editItem.id } : item);
        await storage.setItem(`inventory_${currentUser.id}`, JSON.stringify(updated));
      } else {
        inventory.push({ ...finalInstrument, id: Date.now() });
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
          {instrument.images.map((img, index) => (
            <View key={index} style={styles.pinCard}>
              <Image source={{ uri: img.uri }} style={styles.pinImage} resizeMode="cover" />
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
              onChangeText={(t) => setInstrument(prev => ({ ...prev, customBrand: t }))}
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
              onChangeText={(t) => setInstrument(prev => ({ ...prev, customModel: t }))}
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
      <Text style={styles.stepHint}>Complete your listing</Text>

      <Text style={styles.fieldLabel}>Year</Text>
      <TextInput
        style={styles.input}
        value={instrument.year}
        onChangeText={(t) => setInstrument(prev => ({ ...prev, year: t }))}
        placeholder="e.g. 2015"
        keyboardType="numeric"
        maxLength={4}
      />

      <Text style={styles.fieldLabel}>Serial Number</Text>
      <TextInput style={styles.input} value={instrument.serialNumber}
        onChangeText={(t) => setInstrument(prev => ({ ...prev, serialNumber: t }))}
        placeholder="e.g. US12345678" />

      <Text style={styles.fieldLabel}>Condition</Text>
      {renderPickerButton('Select condition', instrument.condition, 'Condition', CONDITIONS,
        (v) => setInstrument(prev => ({ ...prev, condition: v }))
      )}

      <Text style={styles.fieldLabel}>Value: ({CURRENCY_SYMBOLS[userPrefs.currency] || '$'})</Text>
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
  const renderMobileWizard = () => {
    const isWebPlatform = Platform.OS === 'web';
    const stepBody = (
      <>
        {step === 0 && renderStep1()}
        {step === 1 && renderStep0()}
        {step === 2 && renderStep2()}
        {errorMessage ? <View style={styles.errorContainer}><Text style={styles.errorText}>{errorMessage}</Text></View> : null}
      </>
    );

    return (
      <View style={isWebPlatform ? styles.webWizardRoot : { flex: 1 }}>
        {/* Header */}
        <View style={[styles.wizardHeader, { paddingTop: insets.top + 12 }, isWide && { maxWidth: 700 }]}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.navigate('Dashboard')}>
            <Text style={styles.wizardBack}>← Back</Text>
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

        {/* Step content — page-level scroll on web, inner ScrollView on native */}
        {isWebPlatform ? (
          <View style={[styles.wizardContent, isWide && { maxWidth: 700 }]}>
            {stepBody}
          </View>
        ) : (
          <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={[styles.wizardContent, isWide && { maxWidth: 700 }]}
            keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={true}>
            {stepBody}
          </ScrollView>
        )}

        {/* Footer nav */}
        <View style={styles.wizardFooter}>
          {step < STEPS.length - 1 ? (
            <TouchableOpacity style={[styles.nextButton, isWide && { maxWidth: 700 }]} onPress={() => { setErrorMessage(''); setStep(step + 1); }}>
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
  };

  return (
    <>
      <KeyboardAvoidingView
        style={Platform.OS === 'web' ? styles.webWizardRoot : { flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS !== 'web'}
      >
        <LinearGradient
          colors={['#0a1f3d', '#1e4d8c', '#4ECDC4']}
          style={StyleSheet.absoluteFillObject}
        />
        {renderMobileWizard()}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Web page-level scroll root ───────────────────────────────
  webWizardRoot: {
    width: '100%',
    overflow: 'visible',
  },
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
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    width: '100%',
  },
  wizardBack: { color: '#fff', fontSize: 15, fontWeight: '600', minWidth: 70 },
  wizardTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  wizardSave: { color: '#28a745', fontSize: 15, fontWeight: '700', minWidth: 50, textAlign: 'right' },
  progressBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
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
  wizardContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 110 : 20,
    alignSelf: 'center',
    width: '100%',
  },
  wizardFooter: {
    backgroundColor: 'rgba(15, 45, 82, 0.95)',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
    } : {}),
  },
  nextButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
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
  // Inline chip-style picker — replaces modal-based dropdown so options
  // flow with the page rather than overlay it.
  chipPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipOptionActive: {
    backgroundColor: '#0064d2',
    borderColor: '#0064d2',
  },
  chipOptionText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
  },
  chipOptionTextActive: {
    color: '#fff',
  },
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
});
