import { useCallback, useEffect, useRef, useState } from "react";
import { subscribe, type Topic } from "@/services/events";

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
  /** Update local data optimistically. */
  setData: (fn: (prev: T | undefined) => T | undefined) => void;
}

/**
 * Run an async service call and track loading / error / data.
 * Re-runs when `deps` change or when any of `topics` is emitted (silently,
 * without flashing the skeleton again).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = [], topics: Topic[] = []): AsyncState<T> {
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const callId = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback((silent: boolean) => {
    const id = ++callId.current;
    if (!silent) setLoading(true);
    setError(null);
    fnRef
      .current()
      .then((d) => {
        if (id === callId.current) setDataState(d);
      })
      .catch((e: Error) => {
        if (id === callId.current) setError(e);
      })
      .finally(() => {
        if (id === callId.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const unsubs = topics.map((t) => subscribe(t, () => run(true)));
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics.join(",")]);

  return {
    data,
    loading,
    error,
    reload: () => run(false),
    setData: (f) => setDataState((p) => f(p)),
  };
}

/** Re-render when a topic is emitted; returns a value computed synchronously. */
export function useTopicValue<T>(topics: Topic[], read: () => T): T {
  const [value, setValue] = useState(read);
  const readRef = useRef(read);
  readRef.current = read;
  useEffect(() => {
    setValue(readRef.current());
    const unsubs = topics.map((t) => subscribe(t, () => setValue(readRef.current())));
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics.join(",")]);
  return value;
}
