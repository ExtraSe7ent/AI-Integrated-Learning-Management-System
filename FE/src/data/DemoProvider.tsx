import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import { initialData } from "./fixtures";
import type { DemoData } from "./fixtures";
const KEY = "vju-learning-demo-v1";
const Context = createContext<{
  data: DemoData;
  setData: Dispatch<SetStateAction<DemoData>>;
  notify: (message: string) => void;
}>({ data: initialData, setData: () => {}, notify: () => {} });
export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoData>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
    } catch {
      return initialData;
    }
  });
  const [message, setMessage] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      setMessage(
        "Bộ nhớ trình duyệt đã đầy; thay đổi chỉ giữ trong phiên này.",
      );
    }
  }, [data]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== KEY || !event.newValue) return;
      try {
        setData({ ...initialData, ...JSON.parse(event.newValue) });
      } catch {
        /* Invalid demo data from another tab is ignored. */
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <Context.Provider value={{ data, setData, notify: setMessage }}>
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
