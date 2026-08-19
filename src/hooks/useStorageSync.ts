import { useEffect, useRef } from 'react';

interface StorageSyncOptions {
  /** Run the handler once on mount, before any event arrives. */
  immediate?: boolean;
  /** Also listen to the native cross-tab `storage` event. */
  includeNativeStorage?: boolean;
}

/**
 * Subscribes to `StorageService` change events (`cbt_storage_change`) and runs
 * the handler whenever cached data is updated.
 */
export function useStorageSync(handler: () => void, options: StorageSyncOptions = {}): void {
  const { immediate = false, includeNativeStorage = false } = options;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = () => handlerRef.current();

    if (immediate) listener();

    window.addEventListener('cbt_storage_change', listener);
    if (includeNativeStorage) window.addEventListener('storage', listener);

    return () => {
      window.removeEventListener('cbt_storage_change', listener);
      if (includeNativeStorage) window.removeEventListener('storage', listener);
    };
  }, [immediate, includeNativeStorage]);
}
