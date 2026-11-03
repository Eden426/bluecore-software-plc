import { useCallback, useEffect, useRef, useState } from "react";
import { describeError } from "./api.js";

// Loads data on mount and whenever `key` changes, and exposes a reload().
// `load` may be an inline closure; the latest one is always used.
export function useAsync(load, key = null) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const reload = useCallback(async () => {
    try {
      const data = await loadRef.current();
      setState({ data, error: "", loading: false });
    } catch (error) {
      setState({ data: null, error: describeError(error), loading: false });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadRef.current().then(
      (data) => !cancelled && setState({ data, error: "", loading: false }),
      (error) => !cancelled && setState({ data: null, error: describeError(error), loading: false }),
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { ...state, reload };
}
