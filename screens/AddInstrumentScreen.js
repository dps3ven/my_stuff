import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import storage from '../utils/storage';
import {
  instrumentSchema,
  instrumentBasicsSchema,
  REQUIRED_FIELD_LABELS,
  resolveInstrumentForStorage,
} from '../utils/instrumentSchema';

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

// Builds the form's initial values from an item being edited (or blanks for a
// new one). When editing, a saved brand/model that isn't in the predefined
// list is treated as "Other" with the custom value pre-filled.
function buildDefaultValues(editItem) {
  const type = editItem?.type || '';
  const makes = MAKES_BY_TYPE[type] || [];
  const models = MODELS_BY_TYPE[type] || [];

  const brand = !editItem ? '' : (makes.includes(editItem.brand) ? editItem.brand : (editItem.brand ? 'Other' : ''));
  const customBrand = (!editItem || brand !== 'Other') ? '' : editItem.brand;

  const model = !editItem ? '' : (models.includes(editItem.model) ? editItem.model : (editItem.model ? 'Other' : ''));
  const customModel = (!editItem || model !== 'Other') ? '' : editItem.model;

  return {
    type,
    brand,
    customBrand,
    model,
    customModel,
    nickname: editItem?.nickname || '',
    year: editItem?.year || '',
    serialNumber: editItem?.serialNumber || '',
    condition: editItem?.condition || '',
    value: editItem?.value || '',
    notes: editItem?.notes || '',
    images: editItem?.images || [],
  };
}

export default function AddInstrumentScreen({ navigation, route }) {
  const editItem = route?.params?.editItem;
  const isEditing = !!editItem;
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 768;
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [userPrefs, setUserPrefs] = useState({ primaryInstrument: '', currency: 'USD' });
  const [errorMessage, setErrorMessage] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const scrollViewRef = useRef(null);

  // React Hook Form owns all field state; the Zod schema is the single source
  // of truth for validation (no more per-field useState or duplicated checks).
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(instrumentSchema),
    defaultValues: buildDefaultValues(editItem),
  });

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Stuff' : 'Add Stuff' });
    // Load user preferences and pre-select primary instrument for new items
    (async () => {
      try {
        const currentUser = JSON.parse(await storage.getItem('currentUser'));
        if (currentUser?.preferences) {
          setUserPrefs(currentUser.preferences);
          if (!isEditing && !getValues('type') && currentUser.preferences.primaryInstrument) {
            setValue('type', currentUser.preferences.primaryInstrument);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [navigation, isEditing]);

  // ── Image helpers ──────────────────────────────────────────────
  const addImages = (newImages) => {
    const current = getValues('images') || [];
    setValue('images', [...current, ...newImages], { shouldDirty: true });
  };

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
      addImages([{ uri: asset.uri, size: asset.fileSize || 0 }]);
    }
  };

  const pickImage = async () => {
    // Request photo library access on native platforms (web uses a file picker
    // and needs no permission). Mirrors how apps like Instagram gate access.
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'My Stuff needs access to your photo library to attach images. You can enable it in Settings.'
        );
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 1 });
    if (!result.canceled) {
      let newImages;
      if (Platform.OS === 'web') {
        newImages = await Promise.all(result.assets.map(a => compressImageForWeb(a.uri)));
      } else {
        newImages = result.assets.map(a => ({ uri: a.uri, size: a.fileSize || 0 }));
      }
      addImages(newImages);
    }
  };

  const removeImage = (index) => {
    const current = getValues('images') || [];
    setValue('images', current.filter((_, i) => i !== index), { shouldDirty: true });
  };

  // ── Picker helpers ─────────────────────────────────────────────
  // Inline chip-style picker — keeps options in the page flow so they scroll
  // with the rest of the form regardless of screen size or orientation.
  const renderPickerButton = (label, selectedValue, title, items, onSelect, hasError = false) => {
    const options = items.filter(i => i.value !== '');
    return (
      <View>
        <View style={[styles.chipPickerRow, hasError && styles.chipPickerRowError]}>
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
        {hasError && <Text style={styles.fieldErrorText}>Required</Text>}
      </View>
    );
  };

  // Derives the friendly "just need…" prompt from the schema so the message
  // never drifts from the validation rules.
  const buildBasicsMessage = () => {
    const result = instrumentBasicsSchema.safeParse(getValues());
    if (result.success) return '';
    const missing = [...new Set(result.error.issues.map(i => REQUIRED_FIELD_LABELS[i.path[0]]).filter(Boolean))];
    return `Just need a few basics first: ${missing.join(', ')}`;
  };

  // ── Save ───────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setErrorMessage('');
    try {
      const currentUser = JSON.parse(await storage.getItem('currentUser'));
      const inventory = JSON.parse(await storage.getItem(`inventory_${currentUser.id}`) || '[]');

      // Resolve "Other" custom values before saving
      const finalInstrument = resolveInstrumentForStorage(data);

      if (isEditing) {
        const updated = inventory.map(item => item.id === editItem.id ? { ...finalInstrument, id: editItem.id } : item);
        await storage.setItem(`inventory_${currentUser.id}`, JSON.stringify(updated));
      } else {
        inventory.push({ ...finalInstrument, id: Date.now() });
        await storage.setItem(`inventory_${currentUser.id}`, JSON.stringify(inventory));
      }

      // Show a brief, friendly confirmation before heading back so the save
      // feels like a small win rather than an abrupt jump.
      const nickname = (data.nickname || '').trim();
      setSavedMessage(
        isEditing
          ? 'Saved your changes!'
          : nickname
            ? `${nickname} joined your collection!`
            : 'Added to your collection!'
      );
      setTimeout(() => navigation.navigate('Dashboard'), 1200);
    } catch (error) {
      setErrorMessage('Failed to save: ' + error.message);
    }
  };

  // Called when a Save attempt fails schema validation — surfaces the friendly
  // prompt and sends the user back to the Category step to fix the basics.
  const onInvalid = () => {
    setErrorMessage(buildBasicsMessage() || 'Please check the highlighted fields.');
    if (!isWide) setStep(0);
    if (Platform.OS === 'web') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Step content ───────────────────────────────────────────────
  const renderStep0 = () => {
    const images = watch('images') || [];
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>📸 Add a few photos</Text>
        <Text style={styles.stepHint}>The first one becomes the cover — show it off!</Text>

        {images.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
            {images.map((img, index) => (
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
            <Text style={styles.emptyImageText}>Tap to add a photo or two</Text>
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
  };

  const renderStep1 = () => {
    const type = watch('type');
    const brand = watch('brand');
    const model = watch('model');
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>🎸Add some stuff here</Text>
        <Text style={styles.stepHint}>Pick the basics so we can file it in your collection.</Text>

        <Text style={styles.fieldLabel}>Type <Text style={styles.required}>*</Text></Text>
        {renderPickerButton('Select type', type, 'Type', INSTRUMENT_TYPES,
          (v) => {
            setValue('type', v, { shouldValidate: true });
            setValue('brand', '');
            setValue('model', '');
          },
          !!errors.type
        )}

        <Text style={styles.fieldLabel}>Make / Brand <Text style={styles.required}>*</Text></Text>
        {type && MAKES_BY_TYPE[type] ? (
          <>
            {renderPickerButton('Select make', brand === 'Other' ? 'Other' : brand, 'Make',
              [{ label: 'Select Make', value: '' }, ...MAKES_BY_TYPE[type].map(m => ({ label: m, value: m }))],
              (v) => setValue('brand', v, { shouldValidate: true }),
              !!errors.brand
            )}
            {brand === 'Other' && (
              <Controller
                control={control}
                name="customBrand"
                render={({ field: { value, onChange } }) => (
                  <TextInput style={styles.otherInput} value={value || ''}
                    onChangeText={onChange}
                    autoComplete="off" textContentType="none" autoCorrect={false}
                    placeholder="Enter brand name" />
                )}
              />
            )}
          </>
        ) : (
          <View style={[styles.pickerButton, styles.disabledField]}>
            <Text style={styles.disabledText}>Select a type first</Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>Model <Text style={styles.required}>*</Text></Text>
        {type && MODELS_BY_TYPE[type] ? (
          <>
            {renderPickerButton('Select model', model === 'Other' ? 'Other' : model, 'Model',
              [{ label: 'Select Model', value: '' }, ...MODELS_BY_TYPE[type].map(m => ({ label: m, value: m }))],
              (v) => setValue('model', v, { shouldValidate: true }),
              !!errors.model
            )}
            {model === 'Other' && (
              <Controller
                control={control}
                name="customModel"
                render={({ field: { value, onChange } }) => (
                  <TextInput style={styles.otherInput} value={value || ''}
                    onChangeText={onChange}
                    autoComplete="off" textContentType="none" autoCorrect={false}
                    placeholder="Enter model name" />
                )}
              />
            )}
          </>
        ) : (
          <View style={[styles.pickerButton, styles.disabledField]}>
            <Text style={styles.disabledText}>Select a type first</Text>
          </View>
        )}
      </View>
    );
  };

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>📋 A few more details</Text>
      <Text style={styles.stepHint}>All optional — add what you know, skip the rest.</Text>

      <Text style={styles.fieldLabel}>Nickname</Text>
      <Controller
        control={control}
        name="nickname"
        render={({ field: { value, onChange } }) => (
          <TextInput style={styles.input} value={value}
            onChangeText={onChange}
            autoComplete="off" textContentType="none" autoCorrect={false}
            placeholder="e.g. Old Faithful" />
        )}
      />

      <Text style={styles.fieldLabel}>Year</Text>
      <Controller
        control={control}
        name="year"
        render={({ field: { value, onChange } }) => (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            autoComplete="off" textContentType="none" autoCorrect={false}
            placeholder="e.g. 2015"
            keyboardType="numeric"
            maxLength={4}
          />
        )}
      />

      <Text style={styles.fieldLabel}>Serial Number</Text>
      <Controller
        control={control}
        name="serialNumber"
        render={({ field: { value, onChange } }) => (
          <TextInput style={styles.input} value={value}
            onChangeText={onChange}
            autoComplete="off" textContentType="none" autoCorrect={false}
            placeholder="e.g. US12345678" />
        )}
      />

      <Text style={styles.fieldLabel}>Condition</Text>
      {renderPickerButton('Select condition', watch('condition'), 'Condition', CONDITIONS,
        (v) => setValue('condition', v)
      )}

      <Text style={styles.fieldLabel}>Value: ({CURRENCY_SYMBOLS[userPrefs.currency] || '$'})</Text>
      <Controller
        control={control}
        name="value"
        render={({ field: { value, onChange } }) => (
          <TextInput style={styles.input} value={value}
            onChangeText={onChange}
            autoComplete="off" textContentType="none" autoCorrect={false}
            placeholder="0.00" keyboardType="numeric" />
        )}
      />
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
        <Text style={styles.title}>{isEditing ? 'Edit Stuff' : 'Add to your collection'}</Text>
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
      </>
    );

    return (
      <View style={isWebPlatform ? styles.webWizardRoot : { flex: 1 }}>
        {/* Header — title only; navigation lives in the footer */}
        <View style={[styles.wizardHeader, { paddingTop: insets.top + 12 }, isWide && { maxWidth: 700 }]}>
          <Text style={styles.wizardTitle}>{isEditing ? 'Edit Stuff' : 'Add to your collection'}</Text>
        </View>

        {/* Step navigation — tappable pills with a number/check badge so it's
            obvious you can jump between steps. */}
        <View style={styles.stepper}>
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isDone = i < step;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.stepPill, isActive && styles.stepPillActive, isDone && styles.stepPillDone]}
                onPress={() => setStep(i)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Step ${i + 1}: ${s}`}
              >
                <View style={[styles.stepBadge, isActive && styles.stepBadgeActive, isDone && styles.stepBadgeDone]}>
                  <Text style={[styles.stepBadgeText, (isActive || isDone) && styles.stepBadgeTextActive]}>
                    {isDone ? '✓' : i + 1}
                  </Text>
                </View>
                <Text style={[styles.stepPillLabel, isActive && styles.stepPillLabelActive]} numberOfLines={1}>
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Error message — pinned above scroll content so it's always visible */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

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

        {/* Footer nav — Previous/Cancel on the left, Next/Save on the right */}
        <View style={styles.wizardFooter}>
          <View style={[styles.footerRow, isWide && { maxWidth: 700 }]}>
            {/* Previous step, or Cancel/exit on the first step */}
            {step > 0 ? (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={() => { setErrorMessage(''); setStep(step - 1); }}
              >
                <Text style={styles.prevButtonText}>← {STEPS[step - 1]}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Text style={styles.prevButtonText}>← Back</Text>
              </TouchableOpacity>
            )}

            {/* Next step, or Save on the last step */}
            {step < STEPS.length - 1 ? (
              <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={async () => {
                // Block navigation from the Category step until the required
                // fields pass the schema. trigger() sets the red chip errors;
                // buildBasicsMessage() derives the prompt from the same schema.
                if (step === 0) {
                  const ok = await trigger(['type', 'brand', 'model']);
                  if (!ok) {
                    setErrorMessage(buildBasicsMessage());
                    if (Platform.OS === 'web') window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                }
                setErrorMessage('');
                setStep(step + 1);
              }}>
                <Text style={styles.nextButtonText}>{STEPS[step + 1]} →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.navButton, styles.saveButton]} onPress={handleSubmit(onSubmit, onInvalid)}>
                <Text style={styles.saveButtonText}>{isEditing ? '✅ Save' : '+ Add'}</Text>
              </TouchableOpacity>
            )}
          </View>
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
          style={Platform.OS === 'web' ? { display: 'none' } : StyleSheet.absoluteFillObject}
        />
        {renderMobileWizard()}
      </KeyboardAvoidingView>

      {/* Friendly save confirmation — briefly celebrates the add/edit before
          navigating back to the dashboard. */}
      {savedMessage ? (
        <View style={styles.successOverlay} pointerEvents="none">
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>🎵</Text>
            <Text style={styles.successText}>{savedMessage}</Text>
          </View>
        </View>
      ) : null}
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
  wizardHeaderSpacer: { minWidth: 70 },
  stepper: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stepPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stepPillActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  stepPillDone: {
    backgroundColor: 'rgba(78,205,196,0.18)',
    borderColor: 'rgba(78,205,196,0.55)',
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepBadgeActive: { backgroundColor: 'rgba(255,255,255,0.95)' },
  stepBadgeDone: { backgroundColor: '#4ECDC4' },
  stepBadgeText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  stepBadgeTextActive: { color: '#08343f' },
  stepPillLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  stepPillLabelActive: { color: '#08343f', fontWeight: '700' },
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
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    alignSelf: 'center',
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButton: {
    backgroundColor: '#007bff',
  },
  prevButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nextButton: {
    backgroundColor: '#007bff',
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  saveButton: {
    backgroundColor: '#0064d2',
  },

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
  chipPickerRowError: {
    borderWidth: 1,
    borderColor: '#e53935',
    borderRadius: 12,
    padding: 8,
    backgroundColor: '#fff5f5',
  },
  fieldErrorText: {
    color: '#e53935',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
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
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  fixedFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0f2d52', padding: 12, gap: 8, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
  },
  dashboardButton: { padding: 10, alignItems: 'center' },
  dashboardButtonText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },

  // ── Error ────────────────────────────────────────────────────
  errorBanner: {
    backgroundColor: '#fff3f3',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorContainer: {
    backgroundColor: '#fff3f3', padding: 14, borderRadius: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#ffcdd2',
  },
  errorText: { color: '#c62828', textAlign: 'center', fontSize: 14, fontWeight: '600' },

  // ── Save confirmation overlay ────────────────────────────────
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 31, 61, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    ...(Platform.OS === 'web' ? { position: 'fixed' } : {}),
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 36,
    marginHorizontal: 32,
    alignItems: 'center',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  successEmoji: { fontSize: 44, marginBottom: 10 },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0a1f3d',
    textAlign: 'center',
  },
});
