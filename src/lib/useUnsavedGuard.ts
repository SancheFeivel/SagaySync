import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';

/**
 * Asks "Save draft or discard?" when the user leaves a form with unsaved text.
 * Set `allow.current = true` right before you navigate away on purpose.
 * Pass canDraft=false when editing an already-published item (a draft would unpublish it).
 */
export function useUnsavedGuard(dirty: boolean, saveDraft: () => Promise<boolean>, canDraft = true) {
  const nav = useNavigation();
  const allow = useRef(false);
  useEffect(
    () =>
      nav.addListener('beforeRemove', (e: any) => {
        if (allow.current || !dirty) return;
        e.preventDefault();
        const leave = () => { allow.current = true; nav.dispatch(e.data.action); };
        if (canDraft) {
          Alert.alert('Save draft or discard?', 'You have unsaved changes.', [
            { text: 'Keep editing', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: leave },
            { text: 'Save draft', onPress: async () => { if (await saveDraft()) leave(); } },
          ]);
        } else {
          Alert.alert('Discard changes?', 'Your edits have not been saved.', [
            { text: 'Keep editing', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: leave },
          ]);
        }
      }),
    [nav, dirty, saveDraft, canDraft],
  );
  return allow;
}
