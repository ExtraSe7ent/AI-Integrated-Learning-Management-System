import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { accountById, authenticateAccount } from "../data/accounts";
import type { Account } from "../data/accounts";
const KEY = "vju-preview-account";
const Context = createContext<{
  account: Account | null;
  signIn: (id: string, password: string) => Account | null;
  signOut: () => void;
}>({ account: null, signIn: () => null, signOut: () => {} });
function savedAccount() {
  try {
    return accountById(sessionStorage.getItem(KEY) || "");
  } catch {
    return null;
  }
}
export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(savedAccount);
  useEffect(() => {
    try {
      if (account) sessionStorage.setItem(KEY, account.id);
      else sessionStorage.removeItem(KEY);
    } catch {
      /* Private storage may be unavailable; the selection then lasts until reload. */
    }
  }, [account]);
  const signIn = (id: string, password: string) => {
    const result = authenticateAccount(id, password);
    if (result) setAccount(result);
    return result;
  };
  return (
    <Context.Provider
      value={{ account, signIn, signOut: () => setAccount(null) }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAccount = () => useContext(Context);
