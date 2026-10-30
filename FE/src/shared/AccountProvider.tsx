import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useDemo } from "../data/DemoProvider";
import { passwordDigest } from "../Admin/model";
import type { ManagedUser } from "../Admin/model";
const KEY = "vju-preview-account";
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
  const { data, setData } = useDemo();
  const [id, setId] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) || "";
    } catch {
      return "";
    }
  });
  const account = data.admin.users.find((u) => u.id === id && u.active) || null;
  useEffect(() => {
    try {
      if (account) sessionStorage.setItem(KEY, account.id);
      else sessionStorage.removeItem(KEY);
    } catch {
      /* In-memory session if storage is unavailable. */
    }
  }, [account]);
  const matches = async (u: ManagedUser, password: string) =>
    u.passwordHash
      ? u.passwordHash === (await passwordDigest(password))
      : password === "12345678";
  async function signIn(code: string, password: string) {
    const u = data.admin.users.find(
      (u) => u.active && u.id.toLowerCase() === code.trim().toLowerCase(),
    );
    if (!u || !(await matches(u, password))) return null;
    setId(u.id);
    return u;
  }
  async function changePassword(old: string, next: string) {
    if (!account) throw Error("Đăng nhập trước khi đổi mật khẩu.");
    if (!account.mustChange && !(await matches(account, old)))
      throw Error("Mật khẩu hiện tại không đúng.");
    if (next.length < 8) throw Error("Mật khẩu mới cần ít nhất 8 ký tự.");
    if (await matches(account, next))
      throw Error("Chọn mật khẩu mới khác mật khẩu hiện tại.");
    const passwordHash = await passwordDigest(next);
    setData((d) => ({
      ...d,
      admin: {
        ...d.admin,
        users: d.admin.users.map((u) =>
          u.id === account.id ? { ...u, passwordHash, mustChange: false } : u,
        ),
      },
    }));
  }
  return (
    <Context.Provider
      value={{ account, signIn, signOut: () => setId(""), changePassword }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAccount = () => useContext(Context);
