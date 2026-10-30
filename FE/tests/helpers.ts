import type { Page } from "@playwright/test";
export async function loginAs(page: Page, role: "sinh-vien" | "giang-vien") {
  await page.goto("/dang-nhap");
  await page
    .getByLabel("Mã tài khoản", { exact: true })
    .fill(role === "giang-vien" ? "GV001" : "23110149");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/" + role + "/tong-quan");
}
export async function openRolePage(page: Page, path: string) {
  const role = path.startsWith("/giang-vien")
    ? "giang-vien"
    : path.startsWith("/sinh-vien")
      ? "sinh-vien"
      : null;
  if (
    role &&
    !(await page
      .locator(
        role === "giang-vien" ? ".teacher-workspace" : ".student-workspace",
      )
      .count())
  )
    await loginAs(page, role);
  await page.goto(path);
}
