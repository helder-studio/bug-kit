import { type ReactNode, useEffect, useState } from 'react';
import {
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { bugKit } from '../kit';
import { type BugKitProps, useActivation, useKitState } from '../react/shared';

/** React Native: a 🐞 button (or shake) that opens a report form you can share or file. */
export function BugKit(props: BugKitProps & { children?: ReactNode }) {
  useActivation(props);
  useEffect(() => {
    if (!props.enabled) return;
    const { width, height } = Dimensions.get('window');
    bugKit.setPlatformDevice({
      platform: Platform.OS,
      osVersion: String(Platform.Version),
      window: `${Math.round(width)}×${Math.round(height)}`,
    });
  }, [props.enabled]);
  const { open } = useKitState();
  return (
    <>
      {props.children}
      {props.enabled && props.button !== false && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Report a bug"
          onPress={bugKit.open}
          style={styles.fab}
        >
          <Text style={styles.fabText}>🐞</Text>
        </Pressable>
      )}
      {props.enabled && (
        <Modal visible={open} animationType="slide" onRequestClose={bugKit.close}>
          <SafeAreaView style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.title}>Report a bug</Text>
              <Pressable accessibilityRole="button" onPress={bugKit.close} hitSlop={12}>
                <Text style={styles.link}>Close</Text>
              </Pressable>
            </View>
            <BugKitPanel />
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
}

/** The report form, also used as the dev-dock tab. */
export function BugKitPanel() {
  const { drafting, steps, error } = useKitState();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const report = bugKit.report(title, description);
  const issueUrl = bugKit.issueUrl(report);
  void steps; // a new AI draft changes the report

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text>What went wrong?</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        accessibilityLabel="What went wrong?"
      />
      <Text>Details (optional)</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.multiline]}
        multiline
        accessibilityLabel="Details"
      />
      <View style={styles.actions}>
        {bugKit.getOptions().complete && (
          <Action
            label={drafting ? 'Drafting…' : 'Draft steps (AI)'}
            onPress={() => void bugKit.draftSteps(title, description)}
          />
        )}
        <Action
          label="Share"
          onPress={() => void Share.share({ title: report.title, message: report.markdown })}
        />
        {issueUrl && <Action label="GitHub issue" onPress={() => void Linking.openURL(issueUrl)} />}
      </View>
      {error && <Text style={styles.error}>AI draft failed: {error}</Text>}
      <Text style={styles.muted}>Preview (check it for private data before sharing)</Text>
      <Text style={styles.preview} selectable>
        {report.markdown}
      </Text>
    </ScrollView>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

/** Tab for `@helder-studio/dev-dock`. Use `<BugKit enabled button={false} />` alongside. */
export const bugKitTab = {
  id: 'bug-kit',
  title: 'Bug',
  render: () => <BugKitPanel />,
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 12,
    bottom: 96,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e37400',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  fabText: { fontSize: 20 },
  panel: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: { fontSize: 18, fontWeight: '600' },
  link: { color: '#1a73e8', fontWeight: '600' },
  content: { padding: 16, gap: 8 },
  input: { borderWidth: 1, borderColor: '#dadce0', borderRadius: 8, padding: 10, minHeight: 44 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: { color: '#fff', fontWeight: '600' },
  error: { color: '#d93025' },
  muted: { color: '#5f6368', fontSize: 12, marginTop: 8 },
  preview: {
    fontFamily: 'Courier',
    fontSize: 12,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
});
