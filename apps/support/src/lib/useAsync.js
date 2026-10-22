import { useCallback, useEffect, useRef, useState } from "react";
import { describeError } from "./api.js";

// Loads data on mount and whenever `key` changes, and exposes a reload().
// `load` may be an inline closure; the latest one is always used. Results are
// tagged with the key they were loaded for, so after a key change the old
// result reads as loading instead of briefly showing stale or empty data.
export function useAsync(load, key = null) {
  const [state, setState] = useState({ data: null, error: "", loading: true, key: undefined });
  const loadRef = useRef(load);
  const keyRef = useRef(key);
  useEffect(() => {
    loadRef.current = load;
    keyRef.current = key;
  });

  const reload = useCallback(async () => {
    try {
      const data = await loadRef.current();
      setState({ data, error: "", loading: false, key: keyRef.current });
    } catch (error) {
      setState({ data: null, error: describeError(error), loading: false, key: keyRef.current });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadRef.current().then(
      (data) => !cancelled && setState({ data, error: "", loading: false, key }),
      (error) => !cancelled && setState({ data: null, error: describeError(error), loading: false, key }),
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  const current = state.key === key;
  return {
    data: current ? state.data : null,
    error: current ? state.error : "",
    loading: !current || state.loading,
    reload,
  };
}
