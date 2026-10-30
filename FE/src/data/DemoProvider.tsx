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
  notify: (message: string) => void;
  reload: () => Promise<void>;
  bindAccount: (account: Account | null) => void;
}>({
  data: initialData,
  setData: () => {},
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
  const flushing = useRef(false);
  const account = useRef<Account | null>(null);

  const apply = useCallback((next: DemoData) => {
    latest.current = next;
    setState(next);
  }, []);
  const reload = useCallback(async () => {
    if (!getToken()) return;
    const server = await api<Partial<DemoData>>("/api/bootstrap");
    const next = { ...initialData, ...server };
    synced.current = next;
    apply(next);
  }, [apply]);
  const flush = useCallback(async () => {
    if (flushing.current || !account.current) return;
    flushing.current = true;
    try {
      // Rapid edits collapse: each round sends only the difference to the newest state.
      while (synced.current !== latest.current) {
        const target = latest.current;
        const patches = await pushChanges(synced.current, target, account.current);
        synced.current = target;
        if (patches.length) {
          const current = latest.current;
          const patched = patches.reduce((d, p) => p(d), current);
          if (current === target) synced.current = patched;
          apply(patched);
        }
      }
    } catch (e) {
      setMessage((e as Error).message);
      await reload().catch(() => {});
    } finally {
      flushing.current = false;
    }
  }, [apply, reload]);
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
      value={{ data, setData, notify: setMessage, reload, bindAccount }}
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
