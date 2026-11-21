import { useEffect, useRef, useState } from 'react';

function getWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function getTelegramContext() {
  const wa = getWebApp();
  const isTelegram = Boolean(wa && wa.initData && wa.initData.length > 0);
  const user = wa?.initDataUnsafe?.user ?? null;
  const colorScheme = wa?.colorScheme ?? 'light';
  return { wa, isTelegram, user, colorScheme };
}

export function initTelegram() {
  const { wa, isTelegram, user, colorScheme } = getTelegramContext();
  if (wa) {
    try {
      wa.ready();
      wa.expand();
    } catch {
      // Ignore outside full Telegram client
    }
  }
  return { isTelegram, user, colorScheme };
}

export function haptic(kind = 'light') {
  const wa = getWebApp();
  if (!wa?.HapticFeedback) return;
  try {
    if (kind === 'success' || kind === 'warning' || kind === 'error') {
      wa.HapticFeedback.notificationOccurred(kind);
    } else {
      wa.HapticFeedback.impactOccurred(kind);
    }
  } catch {
    // Ignore unsupported platform
  }
}

export function confirmAction(message) {
  const wa = getWebApp();
  if (wa?.showConfirm) {
    return new Promise((resolve) => {
      try {
        wa.showConfirm(message, (ok) => resolve(Boolean(ok)));
      } catch {
        resolve(window.confirm(message));
      }
    });
  }
  return Promise.resolve(window.confirm(message));
}

export function cloudGet(key) {
  const wa = getWebApp();
  const hasCloud = Boolean(wa?.CloudStorage && wa?.isVersionAtLeast?.('6.9'));
  if (hasCloud) {
    return new Promise((resolve) => {
      try {
        wa.CloudStorage.getItem(key, (err, value) => {
          if (err || !value) {
            resolve(localStorage.getItem(key));
          } else {
            resolve(value);
          }
        });
      } catch {
        resolve(localStorage.getItem(key));
      }
    });
  }
  return Promise.resolve(localStorage.getItem(key));
}

export function cloudSet(key, rawValue) {
  try {
    localStorage.setItem(key, rawValue);
  } catch {
    // Ignore storage quota errors in localStorage fallback
  }

  const wa = getWebApp();
  const hasCloud = Boolean(wa?.CloudStorage && wa?.isVersionAtLeast?.('6.9'));
  if (hasCloud) {
    return new Promise((resolve) => {
      try {
        wa.CloudStorage.setItem(key, rawValue, () => resolve());
      } catch {
        resolve();
      }
    });
  }
  return Promise.resolve();
}

/**
 * Persists JSON state in Telegram CloudStorage with transparent localStorage fallback.
 */
export function useCloudState(storageKey, defaultValue) {
  const [state, setState] = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const defaultRef = useRef(defaultValue);

  useEffect(() => {
    let active = true;
    cloudGet(storageKey).then((raw) => {
      if (!active) return;
      if (raw) {
        try {
          setState(JSON.parse(raw));
        } catch {
          setState(defaultRef.current);
        }
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [storageKey]);

  const updateState = (updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      cloudSet(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return [state, updateState, loaded];
}
