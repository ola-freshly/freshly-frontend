import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Tab = 'recommended' | 'import';

export default function RecipesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('recommended');

  return (
    <View style={styles.container}>
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'recommended' && styles.segmentActive]}
          onPress={() => setActiveTab('recommended')}
        >
          <Text
            style={[styles.segmentText, activeTab === 'recommended' && styles.segmentTextActive]}
          >
            Recommended
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segment, activeTab === 'import' && styles.segmentActive]}
          onPress={() => setActiveTab('import')}
        >
          <Text style={[styles.segmentText, activeTab === 'import' && styles.segmentTextActive]}>
            Import
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/create-recipe')}>
          <Text style={styles.actionButtonText}>Create Recipe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/generate-recipe')}
        >
          <Text style={styles.actionButtonText}>AI Generator</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'recommended' && (
        <View style={styles.content}>
          <Text style={styles.empty}>No recipes yet. Generate from your pantry.</Text>
        </View>
      )}

      {activeTab === 'import' && (
        <View style={styles.content}>
          <Text style={styles.empty}>Paste a YouTube cooking video URL to import a recipe.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  segmentRow: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  segmentActive: { backgroundColor: '#208AEF' },
  segmentText: { fontSize: 14, color: '#666' },
  segmentTextActive: { color: '#fff', fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#208AEF',
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#999', fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
});
