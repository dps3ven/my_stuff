import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../styles/theme';

// Filled teal primary action — the main "do it" button on any screen.
export function PrimaryButton({ title, onPress, disabled, style, textStyle, children }) {
  return (
    <TouchableOpacity
      style={[styles.primary, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {children || <Text style={[styles.primaryText, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
}

// Transparent, light-bordered secondary action — quieter than the primary.
export function GhostButton({ title, onPress, disabled, style, textStyle, children }) {
  return (
    <TouchableOpacity
      style={[styles.ghost, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {children || <Text style={[styles.ghostText, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryText: { color: COLORS.primaryText, fontSize: 17, fontWeight: '800' },
  ghost: {
    backgroundColor: COLORS.ghostFill,
    borderWidth: 1,
    borderColor: COLORS.ghostBorder,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
