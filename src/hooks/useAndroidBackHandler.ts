import { useCallback, useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

/** Mirrors in-app Back on Android hardware back. */
export function useAndroidBackHandler(handler: () => void) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handler();
      return true;
    });
    return () => sub.remove();
  }, [handler]);
}
