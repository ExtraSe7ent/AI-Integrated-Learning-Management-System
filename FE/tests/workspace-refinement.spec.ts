import { test, expect } from "@playwright/test";
import { openRolePage } from "./helpers";

test("grade roster and exported workbook follow the selected class", async ({
  page,
}) => {
  await openRolePage(page, "/giang-vien/diem-so");
  await expect(
    page.getByRole("cell", { name: "Nguyễn Quang Anh", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Lớp học", { exact: true }).selectOption("CSE301.02");
  await expect(
    page.getByRole("cell", { name: "Nguyễn Quang Anh", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("cell", { name: "Đỗ Hải Yến", exact: true }),
  ).toBeVisible();
  await page.getByPlaceholder("Tìm tên hoặc mã sinh viên…").fill("Đỗ Hải Yến");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất Excel" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("VJU-Bang-diem-CSE301.02.xlsx");
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile((await file.path())!);
  expect(workbook.worksheets[0].getRow(2).getCell(2).value).toBe("Đỗ Hải Yến");
  expect(workbook.worksheets[0].rowCount).toBe(2);
});

test("lecturer profile saves independently from student profile", async ({
  page,
}) => {
  await openRolePage(page, "/giang-vien/ho-so");
  await page
    .getByLabel("Họ và tên", { exact: true })
    .fill("Nguyễn Minh Anh Thư");
  await page.getByLabel("Số điện thoại").fill("0912345678");
  await page.getByRole("button", { name: "Lưu thông tin" }).click();
  await page.reload();
  await expect(page.getByLabel("Họ và tên", { exact: true })).toHaveValue(
    "Nguyễn Minh Anh Thư",
  );
  await expect(page.getByLabel("Số điện thoại")).toHaveValue("0912345678");
  await expect(page.locator(".user-block")).toContainText(
    "Nguyễn Minh Anh Thư",
  );
  await openRolePage(page, "/sinh-vien/ho-so");
  await expect(page.getByLabel("Họ và tên", { exact: true })).toHaveValue(
    "Nguyễn Quang Anh",
  );
});

for (const role of ["sinh-vien", "giang-vien"]) {
  test("notification entry opens a popup for " + role, async ({ page }) => {
    await openRolePage(page, `/${role}/thong-bao`);
    await expect(page).toHaveURL(new RegExp(role + "/tong-quan$"));
    await expect(
      page.getByRole("dialog", { name: "Thông báo", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
    await expect(page.locator(".notification-button i")).toHaveCount(0);
    await expect(page.locator(".notice-preview-row .small-dot")).toHaveCount(0);
    if (role === "giang-vien") {
      await openRolePage(page, "/sinh-vien/tong-quan");
      await expect(page.locator(".notification-button i")).toHaveCount(1);
    }
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Thông báo", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Thông báo", exact: true }),
    ).toBeVisible();
  });
}

test("dashboard uses metric cards; teaching workspace has a white sidebar", async ({
  page,
}) => {
  await openRolePage(page, "/sinh-vien/tong-quan");
  await expect(page.locator(".ai-tip")).toHaveCount(0);
  await expect(page.locator(".metric-strip > div")).toHaveCount(3);
  await expect(page.locator(".metric-strip > div").first()).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await openRolePage(page, "/giang-vien/tong-quan");
  await expect(page.locator(".sidebar")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await page.goto("/giang-vien/tro-ly-ai");
  await expect(
    page.getByRole("link", { name: "Mở bài học", exact: true }),
  ).toHaveAttribute("href", "/giang-vien/soan-bai");
  await page.goto("/giang-vien/tai-lieu");
  await expect(
    page.getByRole("heading", { name: "Tài liệu tham khảo", exact: true }),
  ).toBeVisible();
});
