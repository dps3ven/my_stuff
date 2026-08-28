import { StyleSheet } from 'react-native';

// Shared design language, distilled from the profile setup screen so every
// screen can follow the same model: dark gradient background, warm header,
// white rounded cards, a teal primary action, and a ghost secondary.
export const COLORS = {
  bgDark: '#0e2b4d',
  gradient: ['#0a1f3d', '#1e4d8c', '#4ECDC4'],
  primary: '#4ECDC4',
  primaryText: '#08343f',
  textOnDark: '#ffffff',
  subtleOnDark: 'rgba(255,255,255,0.8)',
  ghostBorder: 'rgba(255,255,255,0.4)',
  ghostFill: 'rgba(255,255,255,0.06)',
  card: '#ffffff',
  cardText: '#333333',
};

export const theme = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textOnDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.subtleOnDark,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
});
