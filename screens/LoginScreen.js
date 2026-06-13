import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import storage from '../utils/storage';
import * as LocalAuthentication from 'expo-local-authentication';

const INSTRUMENT_OPTIONS = ['Guitar', 'Bass', 'Drums', 'Piano', 'Violin', 'Microphone', 'Amplifier', 'Other'];

export default function LoginScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 768;

  const [profiles, setProfiles] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptionsFor, setShowOptionsFor] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [newPrimaryInstrument, setNewPrimaryInstrument] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfiles();
      setErrorMessage('');
      setNewProfileName('');
    });
    return unsubscribe;
  }, [navigation]);

  const loadProfiles = async () => {
    try {
      const data = await storage.getItem('profiles');
      setProfiles(data ? JSON.parse(data) : []);
    } catch (error) {
      setProfiles([]);
    }
  };

  const verifyBiometric = async () => {
    if (Platform.OS === 'web') return true;
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return true;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return true;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock My Stuff',
      fallbackLabel: 'Use passcode',
    });
    return result.success;
  };

  const selectProfile = async (profile) => {
    const ok = await verifyBiometric();
    if (!ok) {
      const msg = 'Authentication failed';
      if (Platform.OS === 'web') setErrorMessage(msg);
      else Alert.alert('Error', msg);
      return;
    }
    await storage.setItem('currentUser', JSON.stringify(profile));
    navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
  };

  const createProfile = async () => {
    const name = newProfileName.trim();
    if (!name) {
      setErrorMessage('Enter a profile name');
      return;
    }
    if (profiles.find(p => p.name.toLowerCase() === name.toLowerCase())) {
      setErrorMessage('A profile with that name already exists');
      return;
    }
    const newProfile = {
      id: Date.now(),
      name,
      preferences: {
        primaryInstrument: newPrimaryInstrument || '',
        currency: 'USD',
      },
    };
    const updated = [...profiles, newProfile];
    await storage.setItem('profiles', JSON.stringify(updated));
    setProfiles(updated);
    setShowCreateModal(false);
    setNewProfileName('');
    setNewPrimaryInstrument('');
    setErrorMessage('');
    selectProfile(newProfile);
  };

  const showProfileOptions = (profile) => {
    setShowOptionsFor(profile);
  };

  const handleRename = () => {
    setEditingProfile(showOptionsFor);
    setEditingName(showOptionsFor.name);
    setShowOptionsFor(null);
    setShowEditModal(true);
  };

  const handleDelete = () => {
    const profile = showOptionsFor;
    setShowOptionsFor(null);
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${profile.name}" and all its data? This cannot be undone.`)) {
        deleteProfileConfirmed(profile);
      }
    } else {
      Alert.alert(
        'Delete Profile',
        `Delete "${profile.name}" and all its data? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteProfileConfirmed(profile) },
        ]
      );
    }
  };

  const deleteProfileConfirmed = async (profile) => {
    const updated = profiles.filter(p => p.id !== profile.id);
    await storage.setItem('profiles', JSON.stringify(updated));
    await storage.removeItem(`inventory_${profile.id}`);
    setProfiles(updated);
  };

  const renameProfile = async () => {
    const name = editingName.trim();
    if (!name) {
      setErrorMessage('Enter a profile name');
      return;
    }
    if (profiles.find(p => p.id !== editingProfile.id && p.name.toLowerCase() === name.toLowerCase())) {
      setErrorMessage('A profile with that name already exists');
      return;
    }
    const updated = profiles.map(p => p.id === editingProfile.id ? { ...p, name } : p);
    await storage.setItem('profiles', JSON.stringify(updated));
    setProfiles(updated);
    setShowEditModal(false);
    setEditingProfile(null);
    setEditingName('');
    setErrorMessage('');
  };

  const resetAllData = () => {
    const action = async () => {
      if (Platform.OS === 'web') {
        localStorage.clear();
      } else {
        await storage.removeItem('profiles');
        await storage.removeItem('currentUser');
      }
      setProfiles([]);
    };
    if (Platform.OS === 'web') {
      if (window.confirm('⚠️ Reset all data? This will permanently delete all profiles and inventory.')) {
        if (window.confirm('Are you absolutely sure? All data will be lost forever.')) {
          action();
        }
      }
    } else {
      Alert.alert('⚠️ Reset All Data', 'This will permanently delete all profiles and inventory.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete Everything',
          style: 'destructive',
          onPress: () => Alert.alert('Final Warning', 'Are you absolutely sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete All', style: 'destructive', onPress: action },
          ]),
        },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0a1f3d', '#1e4d8c', '#4ECDC4']}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isWide && { maxWidth: 600 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <Text style={[styles.title, isWide && { fontSize: 48 }]}>My Stuff</Text>
        <Text style={styles.subtitle}>Who's here?</Text>

        <View style={styles.profileGrid}>
          {profiles.map(profile => (
            <View key={profile.id} style={styles.profileCardWrapper}>
              <TouchableOpacity
                style={styles.profileCard}
                onPress={() => selectProfile(profile)}
                onLongPress={() => showProfileOptions(profile)}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.profileName} numberOfLines={1}>{profile.name}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.profileCardWrapper}>
            <TouchableOpacity
              style={[styles.profileCard, styles.addCard]}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, styles.addAvatar]}>
                <Text style={styles.addIcon}>+</Text>
              </View>
              <Text style={styles.profileName}>Add Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {profiles.length > 0 && (
          <Text style={styles.hint}>Long-press a profile to rename or delete</Text>
        )}

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity onPress={resetAllData} style={styles.resetButton}>
          <Text style={styles.resetText}>Reset All Data</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Profile</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your profile name"
              value={newProfileName}
              onChangeText={setNewProfileName}
              autoFocus
            />

            <Text style={styles.prefLabel}>What do you mostly collect?</Text>
            <View style={styles.chipRow}>
              {INSTRUMENT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, newPrimaryInstrument === opt && styles.chipActive]}
                  onPress={() => setNewPrimaryInstrument(newPrimaryInstrument === opt ? '' : opt)}
                >
                  <Text style={[styles.chipText, newPrimaryInstrument === opt && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {errorMessage ? <Text style={styles.modalError}>{errorMessage}</Text> : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => { setShowCreateModal(false); setNewProfileName(''); setNewPrimaryInstrument(''); setErrorMessage(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCreateButton]}
                onPress={createProfile}
              >
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Profile</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new name"
              value={editingName}
              onChangeText={setEditingName}
              autoFocus
            />
            {errorMessage ? <Text style={styles.modalError}>{errorMessage}</Text> : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => { setShowEditModal(false); setEditingName(''); setEditingProfile(null); setErrorMessage(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCreateButton]}
                onPress={renameProfile}
              >
                <Text style={styles.modalCreateText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Options Action Sheet */}
      <Modal
        visible={showOptionsFor !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsFor(null)}
      >
        <TouchableOpacity 
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsFor(null)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle}>{showOptionsFor?.name}</Text>
            </View>
            <TouchableOpacity style={styles.actionSheetItem} onPress={handleRename}>
              <Text style={styles.actionSheetIcon}>✏️</Text>
              <Text style={styles.actionSheetText}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionSheetItem} onPress={handleDelete}>
              <Text style={styles.actionSheetIcon}>🗑️</Text>
              <Text style={[styles.actionSheetText, { color: '#dc3545' }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionSheetItem, styles.actionSheetCancel]} onPress={() => setShowOptionsFor(null)}>
              <Text style={[styles.actionSheetText, { color: '#666', fontWeight: '700' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 30,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  profileCardWrapper: {
    width: '30%',
    minWidth: 100,
    maxWidth: 140,
  },
  profileCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#133965',
  },
  addCard: {
    opacity: 0.85,
  },
  addAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
  },
  addIcon: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '300',
  },
  profileName: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    marginTop: 30,
    padding: 10,
    alignItems: 'center',
  },
  resetText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    marginBottom: 12,
  },
  modalError: {
    color: '#c62828',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  prefLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipActive: {
    backgroundColor: '#0064d2',
    borderColor: '#0064d2',
  },
  chipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalCreateButton: {
    backgroundColor: '#0064d2',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  modalCreateText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  actionSheetHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  actionSheetIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  actionSheetText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  actionSheetCancel: {
    justifyContent: 'center',
    borderBottomWidth: 0,
    marginTop: 8,
    backgroundColor: '#f5f5f5',
  },
});
