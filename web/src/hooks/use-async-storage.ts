import { useState, useEffect, useCallback, useRef } from "react";

interface UseAsyncStorageOptions<T> {
  debounceMs?: number;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

/**
 * Hook para operações assíncronas no localStorage
 * Evita bloqueio da thread principal usando requestIdleCallback
 */
export function useAsyncStorage<T>(
  key: string,
  defaultValue: T,
  options: UseAsyncStorageOptions<T> = {}
): {
  data: T;
  loading: boolean;
  error: Error | null;
  setData: (value: T | ((prev: T) => T)) => void;
  refresh: () => void;
} {
  const {
    debounceMs = 500,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  const [data, setDataState] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Load data from localStorage
  useEffect(() => {
    let cancelled = false;

    const loadData = () => {
      try {
        const stored = localStorage.getItem(key);
        if (stored !== null && !cancelled && isMountedRef.current) {
          const parsed = deserialize(stored);
          setDataState(parsed);
        }
      } catch (err) {
        if (!cancelled && isMountedRef.current) {
          setError(
            err instanceof Error ? err : new Error("Failed to load data")
          );
        }
      } finally {
        if (!cancelled && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(loadData);
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    } else {
      const timeout = setTimeout(loadData, 0);
      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }
  }, [key, deserialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save data to localStorage with debouncing
  const saveData = useCallback(
    (value: T) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const saveToStorage = () => {
          try {
            localStorage.setItem(key, serialize(value));
          } catch (err) {
            if (isMountedRef.current) {
              setError(
                err instanceof Error ? err : new Error("Failed to save data")
              );
            }
          }
        };

        if ("requestIdleCallback" in window) {
          requestIdleCallback(saveToStorage);
        } else {
          saveToStorage();
        }
      }, debounceMs);
    },
    [key, serialize, debounceMs]
  );

  // Set data with save
  const setData = useCallback(
    (value: T | ((prev: T) => T)) => {
      setDataState((prev) => {
        const newValue =
          typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
        saveData(newValue);
        return newValue;
      });
    },
    [saveData]
  );

  // Refresh data from localStorage
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    const loadData = () => {
      try {
        const stored = localStorage.getItem(key);
        if (stored !== null && isMountedRef.current) {
          const parsed = deserialize(stored);
          setDataState(parsed);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(
            err instanceof Error ? err : new Error("Failed to refresh data")
          );
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(loadData);
    } else {
      setTimeout(loadData, 0);
    }
  }, [key, deserialize]);

  return { data, loading, error, setData, refresh };
}

/**
 * Hook helper para múltiplas chaves do localStorage
 */
export function useAsyncMultiStorage<T extends Record<string, unknown>>(
  keys: Record<keyof T, string>,
  defaultValues: T
): {
  data: T;
  loading: boolean;
  errors: Partial<Record<keyof T, Error>>;
  setData: <K extends keyof T>(
    key: K,
    value: T[K] | ((prev: T[K]) => T[K])
  ) => void;
  refresh: () => void;
} {
  const [data, setDataState] = useState<T>(defaultValues);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof T, Error>>>({});

  const loadingCountRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const keysList = Object.keys(keys) as Array<keyof T>;
    loadingCountRef.current = keysList.length;

    keysList.forEach((dataKey) => {
      const storageKey = keys[dataKey];

      const loadData = () => {
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored !== null && isMountedRef.current) {
            const parsed = JSON.parse(stored);
            setDataState((prev) => ({ ...prev, [dataKey]: parsed }));
          }
        } catch (err) {
          if (isMountedRef.current) {
            setErrors((prev) => ({
              ...prev,
              [dataKey]:
                err instanceof Error ? err : new Error("Failed to load data"),
            }));
          }
        } finally {
          loadingCountRef.current--;
          if (loadingCountRef.current === 0 && isMountedRef.current) {
            setLoading(false);
          }
        }
      };

      if ("requestIdleCallback" in window) {
        requestIdleCallback(loadData);
      } else {
        setTimeout(loadData, 0);
      }
    });

    return () => {
      isMountedRef.current = false;
    };
  }, [keys]);

  const setData = useCallback(
    <K extends keyof T>(key: K, value: T[K] | ((prev: T[K]) => T[K])) => {
      setDataState((prev) => {
        const newValue =
          typeof value === "function"
            ? (value as (prev: T[K]) => T[K])(prev[key])
            : value;
        const updated = { ...prev, [key]: newValue };

        // Save to localStorage asynchronously
        const saveData = () => {
          try {
            localStorage.setItem(keys[key], JSON.stringify(newValue));
          } catch (err) {
            if (isMountedRef.current) {
              setErrors((prev) => ({
                ...prev,
                [key]:
                  err instanceof Error ? err : new Error("Failed to save data"),
              }));
            }
          }
        };

        if ("requestIdleCallback" in window) {
          requestIdleCallback(saveData);
        } else {
          setTimeout(saveData, 0);
        }

        return updated;
      });
    },
    [keys]
  );

  const refresh = useCallback(() => {
    setLoading(true);
    setErrors({});

    const keysList = Object.keys(keys) as Array<keyof T>;
    loadingCountRef.current = keysList.length;

    keysList.forEach((dataKey) => {
      const storageKey = keys[dataKey];

      const loadData = () => {
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored !== null && isMountedRef.current) {
            const parsed = JSON.parse(stored);
            setDataState((prev) => ({ ...prev, [dataKey]: parsed }));
          }
        } catch (err) {
          if (isMountedRef.current) {
            setErrors((prev) => ({
              ...prev,
              [dataKey]:
                err instanceof Error
                  ? err
                  : new Error("Failed to refresh data"),
            }));
          }
        } finally {
          loadingCountRef.current--;
          if (loadingCountRef.current === 0 && isMountedRef.current) {
            setLoading(false);
          }
        }
      };

      if ("requestIdleCallback" in window) {
        requestIdleCallback(loadData);
      } else {
        setTimeout(loadData, 0);
      }
    });
  }, [keys]);

  return { data, loading, errors, setData, refresh };
}
