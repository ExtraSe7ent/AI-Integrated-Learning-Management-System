import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginAs } from "./helpers";

async function loginDean(page: Page) {
  await page.goto("/dang-nhap");
  await page.getByLabel("Mã tài khoản", { exact: true }).fill("TK001");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/truong-khoa\/tong-quan$/);
}
async function logout(page: Page) {
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  await page.getByRole("link", { name: "Đăng xuất", exact: true }).click();
}
test("Dean login restores assigned role, blocks other roles and logs out", async ({ page }) => {
  await loginDean(page);
  await expect(page.locator(".dean-workspace")).toBeVisible();
  await expect(page.locator(".role-choice")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tổng quan khoa");
  await page.goto("/giang-vien/cham-bai");
  await expect(page).toHaveURL(/truong-khoa\/tong-quan$/);
  await logout(page);
  await page.goto("/truong-khoa/canh-bao");
  await expect(page).toHaveURL(/dang-nhap$/);
  await loginAs(page, "sinh-vien");
  await page.goto("/truong-khoa/tong-quan");
  await expect(page).toHaveURL(/sinh-vien\/tong-quan$/);
});
test("overview drills from course to its own class and rejects a mismatched class", async ({ page }) => {
  await loginDean(page);
  await expect(page.locator(".metric-strip > div").filter({ has: page.getByText("Sinh viên", { exact: true }) }).locator("strong")).toHaveText("12");
  await page.getByRole("link", { name: "Xem học phần CSE301", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByRole("link", { name: "Xem lớp CSE301.02", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await expect(page.getByRole("cell", { name: "Đỗ Hải Yến", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Nguyễn Quang Anh", exact: true })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Vị trí trong khoa" }).getByRole("link", { name: "CSE301", exact: true }).click();
  await expect(page).toHaveURL(/hoc-phan\/cs301\?ky=2026-1$/);
  await page.goto("/truong-khoa/hoc-phan/cs204/lop/CSE301.01");
  await expect(page.getByRole("heading", { name: "Không tìm thấy lớp học trong phạm vi này" })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(0);
});
test("alerts scope students by course and class; filters and empty results recover", async ({ page }) => {
  await loginDean(page);
  await page.goto("/truong-khoa/canh-bao");
  await expect(page.locator("tbody tr")).toHaveCount(7);
  await expect(page.locator(".page-heading")).toContainText("4 sinh viên cần hỗ trợ");
  await page.getByRole("combobox", { name: "Học phần", exact: true }).selectOption("cs301");
  await page.getByRole("combobox", { name: "Lớp học", exact: true }).selectOption("CSE301.02");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("Đinh Quốc Bảo");
  await page.getByLabel("Tìm sinh viên", { exact: true }).fill("khong-co-ten-nay");
  await expect(page.getByRole("heading", { name: "Không có sinh viên cần hỗ trợ trong phạm vi này" })).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(7);
  await page.goto("/truong-khoa/canh-bao?hp=cs204&lop=CSE301.01");
  await expect(page.locator("tbody tr")).toHaveCount(0);
});
test("empty semester has zero totals and retains context through navigation", async ({ page }) => {
  await loginDean(page);
  await page.getByRole("combobox", { name: "Học kỳ", exact: true }).selectOption("2026-2");
  await expect(page.getByRole("heading", { name: "Chưa có lớp học trong học kỳ này" })).toBeVisible();
  await expect(page.locator(".metric-strip")).toContainText("0%");
  await page.locator(".sidebar").getByRole("link", { name: "Học phần", exact: true }).click();
  await expect(page).toHaveURL(/hoc-phan\?ky=2026-2$/);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Học kỳ", exact: true })).toHaveValue("2026-2");
  await page.getByRole("button", { name: "Về học kỳ I" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByLabel("Tìm học phần", { exact: true }).fill("CSE204");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("Cơ sở dữ liệu");
});
test("Dean profile is independent and persists after reload", async ({ page }) => {
  await loginDean(page);
  await page.goto("/truong-khoa/ho-so");
  await page.getByLabel("Họ và tên", { exact: true }).fill("Trần Thu Hương Lan");
  await page.getByLabel("Số điện thoại").fill("0912345678");
  await page.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Họ và tên", { exact: true })).toHaveValue("Trần Thu Hương Lan");
  await expect(page.locator(".user-block")).toContainText("Trần Thu Hương Lan");
  await logout(page);
  await loginAs(page, "giang-vien");
  await page.goto("/giang-vien/ho-so");
  await expect(page.getByLabel("Họ và tên", { exact: true })).toHaveValue("Nguyễn Minh Anh");
});
test("Dean bell and quick navigation are dismissible local menus", async ({ page }) => {
  await loginDean(page);
  const bell = page.getByRole("button", { name: "Thông báo", exact: true });
  await bell.click();
  await expect(page.getByRole("dialog", { name: "Thông báo", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/tong-quan$/);
  await page.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
  await page.keyboard.press("Escape");
  await expect(bell).toBeFocused();
  await expect(page.locator(".notification-button i")).toHaveCount(0);
  await page.getByRole("button", { name: "Chuyển mục: Tổng quan khoa" }).click();
  await page.getByRole("navigation", { name: "Di chuyển nhanh" }).getByRole("link", { name: "Cảnh báo học tập", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Di chuyển nhanh" })).toHaveCount(0);
});
test("student progress is reflected in the linked Dean class", async ({ page }) => {
  await loginAs(page, "sinh-vien");
  await page.goto("/sinh-vien/hoc/cs301");
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Xác nhận đáp án" }).click();
  await page.getByRole("button", { name: "Trang tiếp theo", exact: true }).click();
  await logout(page);
  await loginDean(page);
  await page.goto("/truong-khoa/hoc-phan/cs301/lop/CSE301.01");
  await expect(page.locator("tbody tr").filter({ hasText: "23110149" })).toContainText("25%");
});
for (const width of [1440, 390]) test("Dean routes and assets render at " + width, async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width, height: 1000 });
  await loginDean(page);
  for (const path of ["tong-quan", "hoc-phan", "hoc-phan/cs301", "hoc-phan/cs301/lop/CSE301.01", "canh-bao", "ho-so"]) {
    await page.goto("/truong-khoa/" + path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await page.locator("img").evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
  }
  if (width === 390) {
    const menu = page.getByRole("button", { name: "Mở menu", exact: true });
    await page.locator(".skip-link").focus();
    await page.keyboard.press("Tab");
    await expect(menu).toBeFocused();
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await expect(page.locator(".sidebar")).toBeHidden();
    await menu.click();
    await page.locator(".sidebar").getByRole("link", { name: "Cảnh báo học tập", exact: true }).click();
    await expect(page.locator(".sidebar")).not.toHaveClass(/is-open/);
  }
  expect(errors).toEqual([]);
});
