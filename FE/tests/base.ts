import { test as base, expect } from "@playwright/test";

/** Data now lives on the server, so each test resets it. Run the backend with the e2e profile. */
export const test = base.extend<{ cleanServer: void }>({
  cleanServer: [
    async ({ request }, use) => {
      const login = await request.post("/api/auth/login", {
        data: { username: "AD001", password: "12345678" },
      });
      const { token } = await login.json();
      const reset = await request.post("/api/e2e/reset", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(reset.status()).toBe(204);
      await use();
    },
    { auto: true },
  ],
});
export { expect };
