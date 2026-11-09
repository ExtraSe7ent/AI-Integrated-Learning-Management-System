import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import { initialData } from "./fixtures";
import type { DemoData } from "./fixtures";
import { api, getToken } from "../api/client";
import { pushChanges } from "../api/sync";

const REFRESH_MS = 15000;
const LIVE_POLL_MS = 2000;
type Account = { id: string; role: string };

const Context = createContext<{
  data: DemoData;
  setData: Dispatch<SetStateAction<DemoData>>;
  saveData: (action: SetStateAction<DemoData>) => Promise<boolean>;
  notify: (message: string) => void;
  reload: () => Promise<void>;
  bindAccount: (account: Account | null) => void;
}>({
  data: initialData,
  setData: () => {},
  saveData: async () => false,
  notify: () => {},
  reload: async () => {},
  bindAccount: () => {},
});

/** Screens keep reading one state object; this provider loads it from the API and writes changes back. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setState] = useState<DemoData>(initialData);
  const [message, setMessage] = useState("");
  const latest = useRef(initialData);
  const synced = useRef(initialData);
  const flushing = useRef<Promise<boolean> | null>(null);
  const account = useRef<Account | null>(null);

  const apply = useCallback((next: DemoData) => {
    latest.current = next;
    setState(next);
  }, []);
  const reload = useCallback(async () => {
    if (!getToken()) return;
    const expected = latest.current;
    const server = await api<Partial<DemoData>>("/api/bootstrap");
    if (latest.current !== expected) return;
    const next = { ...initialData, ...server };
    synced.current = next;
    apply(next);
  }, [apply]);
  const flush = useCallback((): Promise<boolean> => {
    if (flushing.current) return flushing.current;
    if (!account.current) return Promise.resolve(false);
    // Share the active queue so explicit saves also wait for earlier autosaves.
    const pending = Promise.resolve().then(async () => {
      let graded = false;
      try {
        do {
          while (synced.current !== latest.current) {
            const target = latest.current;
            const patches = await pushChanges(synced.current, target, account.current!);
            synced.current = target;
            if (patches.length) {
              graded = true;
              const current = latest.current;
              const patched = patches.reduce((d, p) => p(d), current);
              if (current === target) synced.current = patched;
              apply(patched);
            }
          }
          if (graded) {
            graded = false;
            await reload();
          }
        } while (synced.current !== latest.current);
        return true;
      } catch (e) {
        setMessage((e as Error).message);
        await reload().catch(() => apply(synced.current));
        return false;
      } finally {
        flushing.current = null;
      }
    });
    flushing.current = pending;
    return pending;
  }, [apply, reload]);
  const saveData = useCallback(async (action: SetStateAction<DemoData>) => {
    const previous = latest.current;
    const next = typeof action === "function" ? action(previous) : action;
    if (next !== previous) apply(next);
    return flush();
  }, [apply, flush]);
  const setData = useCallback<Dispatch<SetStateAction<DemoData>>>(
    (action) => {
      const previous = latest.current;
      const next = typeof action === "function" ? action(previous) : action;
      if (next === previous) return;
      apply(next);
      void flush();
    },
    [apply, flush],
  );
  const bindAccount = useCallback(
    (next: Account | null) => {
      account.current = next;
      if (!next) {
        synced.current = initialData;
        apply(initialData);
      }
    },
    [apply],
  );
  const idle = () =>
    account.current && !flushing.current && synced.current === latest.current;
  useEffect(() => {
    const refresh = () => {
      if (idle()) void reload().catch(() => {});
    };
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [reload]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!idle() || !location.pathname.endsWith("/tren-lop")) return;
      void api<DemoData["live"]>("/api/live")
        .then((live) => {
          if (!idle()) return;
          const next = { ...latest.current, live };
          synced.current = next;
          apply(next);
        })
        .catch(() => {});
    }, LIVE_POLL_MS);
    return () => clearInterval(timer);
  }, [apply]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <Context.Provider
      value={{ data, setData, saveData, notify: setMessage, reload, bindAccount }}
    >
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
          <button aria-label="Đóng thông báo" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useDemo = () => useContext(Context);
