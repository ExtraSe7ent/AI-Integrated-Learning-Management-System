import { loginAs, openRolePage } from "./helpers";
import { test, expect } from "./base";
for (const role of ["sinh-vien", "giang-vien"] as const)
  test("account role determines workspace: " + role, async ({ page }) => {
    await page.goto("/dang-nhap?role=giang-vien");
    await expect(page.locator(".role-choice")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Sinh viên", exact: true }),
    ).toHaveCount(0);
    await loginAs(page, role);
    await expect(
      page.locator(
        role === "giang-vien" ? ".teacher-workspace" : ".student-workspace",
      ),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator(".app")).toBeVisible();
    await page.goto(
      role === "giang-vien" ? "/sinh-vien/tong-quan" : "/giang-vien/tong-quan",
    );
    await expect(page).toHaveURL(new RegExp(role + "/tong-quan$"));
    await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
    await expect(
      page
        .locator(".account-dropdown")
        .getByRole("link", { name: /^Sinh viên$|^Giảng viên$/ }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Đăng xuất", exact: true }).click();
    await page.goto("/" + role + "/tong-quan");
    await expect(page).toHaveURL(/dang-nhap$/);
  });
test("unknown account and incorrect password stay on login", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/dang-nhap$/);
  await page.getByLabel("Mã tài khoản", { exact: true }).fill("GV999");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Mã tài khoản hoặc mật khẩu không đúng",
  );
  await page.getByLabel("Mã tài khoản", { exact: true }).fill("GV001");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/dang-nhap$/);
});
test("bell opens a dismissible local panel and marks notices read", async ({
  page,
}) => {
  await openRolePage(page, "/sinh-vien/tong-quan");
  const bell = page.getByRole("button", { name: "Thông báo", exact: true });
  await bell.click();
  const panel = page.getByRole("dialog", { name: "Thông báo", exact: true });
  await expect(panel).toBeVisible();
  await expect(page).toHaveURL(/tong-quan$/);
  await panel.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
  await expect(page.locator(".notification-button i")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(bell).toBeFocused();
  await bell.click();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(panel).toHaveCount(0);
});
test("current section is a quick navigation control without role prefix", async ({
  page,
}) => {
  await openRolePage(page, "/sinh-vien/tong-quan");
  await expect(page.locator(".breadcrumb")).not.toContainText("Sinh viên");
  await page.getByRole("button", { name: "Chuyển mục: Tổng quan" }).click();
  await page
    .getByRole("navigation", { name: "Di chuyển nhanh" })
    .getByRole("link", { name: "Phiên tự học", exact: true })
    .click();
  await expect(page).toHaveURL(/tu-hoc$/);
  await expect(
    page.getByRole("navigation", { name: "Di chuyển nhanh" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Chuyển mục: Phiên tự học" }),
  ).toBeVisible();
});
test("course headings start at the same height and truncate long names", async ({
  page,
}) => {
  await openRolePage(page, "/sinh-vien/khoa-hoc");
  await page.locator(".course-cover-title").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  const metrics = await page
    .locator(".course-cover-title")
    .evaluateAll((nodes) =>
      nodes.slice(0, 3).map((n) => ({
        top: n.getBoundingClientRect().top,
        clamp: getComputedStyle(n).webkitLineClamp,
      })),
    );
  expect(new Set(metrics.map((m) => Math.round(m.top))).size).toBe(1);
  expect(metrics.every((m) => m.clamp === "2")).toBe(true);
});
for (const role of ["sinh-vien", "giang-vien"])
  test("mobile menus close on selected links: " + role, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openRolePage(page, "/" + role + "/tong-quan");
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await expect(page.locator(".sidebar")).toHaveClass(/is-open/);
    await page
      .getByRole("navigation", { name: "Điều hướng chính" })
      .getByRole("link", { name: "Tổng quan", exact: true })
      .click();
    await expect(page.locator(".sidebar")).not.toHaveClass(/is-open/);
    await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
    await page
      .locator(".account-dropdown")
      .getByRole("link", { name: "Hồ sơ cá nhân", exact: true })
      .click();
    await expect(page.locator(".account-dropdown")).toHaveCount(0);
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await page.locator(".user-block").click();
    await expect(page).toHaveURL(/ho-so$/);
    await expect(page.locator(".sidebar")).not.toHaveClass(/is-open/);
  });
