import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useDemo } from "../data/DemoProvider";
import type { ManagedUser } from "../Admin/model";
import { api, ApiError, getToken, setToken } from "../api/client";
const Context = createContext<{
  account: ManagedUser | null;
  signIn: (id: string, password: string) => Promise<ManagedUser | null>;
  signOut: () => void;
  changePassword: (old: string, next: string) => Promise<void>;
}>({
  account: null,
  signIn: async () => null,
  signOut: () => {},
  changePassword: async () => {},
});
export function AccountProvider({ children }: { children: ReactNode }) {
  const { reload, bindAccount } = useDemo();
  const [account, setAccount] = useState<ManagedUser | null>(null);
  const [ready, setReady] = useState(!getToken());
  async function enter(user: ManagedUser) {
    setAccount(user);
    bindAccount(user);
    if (!user.mustChange) await reload();
  }
  useEffect(() => {
    if (ready) return;
    api<ManagedUser>("/api/auth/me")
      .then(enter)
      .catch(() => setToken(null))
      .finally(() => setReady(true));
    // Restores the session once, on page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function signIn(code: string, password: string) {
    try {
      const { token, account: user } = await api<{
        token: string;
        account: ManagedUser;
      }>("/api/auth/login", {
        method: "POST",
        body: { username: code.trim(), password },
      });
      setToken(token);
      await enter(user);
      return user;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  }
  async function changePassword(old: string, next: string) {
    if (!account) throw Error("Đăng nhập trước khi đổi mật khẩu.");
    const user = await api<ManagedUser>("/api/auth/change-password", {
      method: "POST",
      body: { oldPassword: old, newPassword: next },
    });
    await enter(user);
  }
  function signOut() {
    setToken(null);
    setAccount(null);
    bindAccount(null);
  }
  if (!ready) return null;
  return (
    <Context.Provider value={{ account, signIn, signOut, changePassword }}>
      {children}
    </Context.Provider>
  );
}
export const useAccount = () => useContext(Context);
