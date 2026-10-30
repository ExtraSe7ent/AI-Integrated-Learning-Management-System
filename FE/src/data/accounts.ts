import type { Role } from "./fixtures";
export interface Account {
  id: string;
  name: string;
  role: Role;
}
const accounts: Account[] = [
  { id: "23110149", name: "Nguyễn Quang Anh", role: "sinh-vien" },
  { id: "GV001", name: "Nguyễn Minh Anh", role: "giang-vien" },
  { id: "TK001", name: "Trần Thu Hương", role: "truong-khoa" },
  { id: "TN001", name: "Lê Thanh Hà", role: "truong-nhom-hp" },
];
// Local UI fixtures only. The Java authentication response will supply this account.
export const accountById = (id: string) =>
  accounts.find((a) => a.id.toLowerCase() === id.trim().toLowerCase()) ?? null;
export function authenticateAccount(
  id: string,
  password: string,
): Account | null {
  return password === "12345678" ? accountById(id) : null;
}
export const accountHome = (role: Role) => `/${role}/tong-quan`;
