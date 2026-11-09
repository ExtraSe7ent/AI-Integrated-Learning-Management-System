import { describe, it, expect } from "vitest";
import { authenticateAccount, accountHome } from "./accounts";
describe("Account assigned roles", () => {
  it("uses the role assigned to a known account", () => {
    expect(authenticateAccount("23110149", "12345678")?.role).toBe("sinh-vien");
    expect(authenticateAccount("GV001", "12345678")?.role).toBe("giang-vien");
    expect(authenticateAccount("TK001", "12345678")?.role).toBe("truong-khoa");
    expect(authenticateAccount("TN001", "12345678")?.role).toBe(
      "truong-nhom-hp",
    );
  });
  it("rejects unknown identities and wrong passwords without guessing from a prefix", () => {
    expect(authenticateAccount("GV999", "12345678")).toBeNull();
    expect(authenticateAccount("23110149", "incorrect")).toBeNull();
  });
  it("routes each supported account role to its own workspace", () => {
    expect(accountHome("sinh-vien")).toBe("/sinh-vien/tong-quan");
    expect(accountHome("giang-vien")).toBe("/giang-vien/tong-quan");
    expect(accountHome("truong-khoa")).toBe("/truong-khoa/tong-quan");
    expect(accountHome("truong-nhom-hp")).toBe("/truong-nhom-hp/tong-quan");
  });
});
