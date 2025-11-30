import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#0066CC',
  secondary: '#ff9625ff',
  danger: '#FF3333',
  processing: '#f04646ff',
  warning: '#f2da04ff',
  success: '#00CC66',
  background: '#F5F7FA',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
  white: '#FFFFFF',
};

export const styles = StyleSheet.create({
  // Auth styles
  container: {
    flex: 1,
    backgroundColor: colors.white,
},

  // usado quando a tela está dentro de um ImageBackground
  background: {
    flex: 1,
  },
  // overlay semi-transparente para melhorar contraste sobre a imagem
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    textAlign: 'center',
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkBold: {
    fontWeight: '600',
    color: colors.primary,
  },

  // General components
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export const statusColors: { [key: string]: string } = {
  open: colors.warning,
  assigned: colors.secondary,
  in_progress: colors.secondary,
  completed: colors.success,
  closed: colors.success,
  cancelled: colors.danger,
};

export const priorityColors: { [key: string]: string } = {
  low: colors.success,
  normal: colors.secondary,
  high: colors.warning,
  urgent: colors.danger,
};
