import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AppPopupProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function AppPopup({ visible, title, message, onClose }: AppPopupProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
