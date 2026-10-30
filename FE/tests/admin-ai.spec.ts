import { test, expect } from "./base";
import type { Page } from "@playwright/test";
import ExcelJS from "exceljs";
async function login(page: Page, id = "AD001", password = "12345678") {
  await page.goto("/dang-nhap");
  await page.getByLabel("Mã tài khoản", { exact: true }).fill(id);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  // Login is a network call now: wait for its outcome before navigating away.
  await page.waitForFunction(
    () =>
      location.pathname !== "/dang-nhap" ||
      document.querySelector('[role="alert"]'),
  );
}
async function signOut(page: Page) {
  await page.goto("/dang-nhap");
  await page.evaluate(() => sessionStorage.removeItem("vju-token"));
  await page.reload();
}
async function sheet(rows: string[][]) {
  const w = new ExcelJS.Workbook(),
    s = w.addWorksheet("Danh sách");
  rows.forEach((r) => s.addRow(r));
  return Buffer.from(await w.xlsx.writeBuffer());
}
test("Admin login, role guard and notification popup", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/admin\/tai-khoan$/);
  await page.getByRole("button", { name: "Thông báo", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Thông báo" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Thông báo" })).toHaveCount(0);
  await page.goto("/sinh-vien/tong-quan");
  await expect(page).toHaveURL(/\/admin\/tai-khoan$/);
});
test("Excel errors block import; valid student must change password and can log in with it", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/tai-khoan/import");
  const input = page.getByLabel("File Excel (.xlsx)", { exact: true });
  await input.setInputFiles({
    name: "errors.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: await sheet([
      ["Mã SV", "Họ tên", "Email"],
      ["23110149", "Trùng mã", "new@example.edu"],
    ]),
  });
  await expect(
    page.getByText("Mã đã tồn tại hoặc trùng trong tệp", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Xác nhận nhập 1 tài khoản" }),
  ).toBeDisabled();
  await input.setInputFiles({
    name: "valid.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: await sheet([
      ["Mã SV", "Họ tên", "Email"],
      ["SVNEW", "Nguyễn An", "an@example.edu"],
    ]),
  });
  await page.getByRole("button", { name: "Xác nhận nhập 1 tài khoản" }).click();
  await expect(
    page.getByRole("heading", { name: "Đã nhập tài khoản" }),
  ).toBeVisible();
  await signOut(page);
  await login(page, "SVNEW");
  await expect(page).toHaveURL(/doi-mat-khau/);
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("MatKhauMoi999");
  await page
    .getByLabel("Nhập lại mật khẩu", { exact: true })
    .fill("MatKhauMoi999");
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(page).toHaveURL(/sinh-vien\/tong-quan/);
  await signOut(page);
  await login(page, "SVNEW", "MatKhauMoi999");
  await expect(page).toHaveURL(/sinh-vien\/tong-quan/);
});
test("disable blocks login and reset forces password change without losing account", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/tai-khoan/GV001");
  await page.getByRole("button", { name: "Vô hiệu hoá", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Kích hoạt lại" }),
  ).toBeVisible();
  await signOut(page);
  await login(page, "GV001");
  await expect(page.getByRole("alert")).toContainText("không đúng");
  await login(page);
  await page.goto("/admin/tai-khoan/GV001");
  await page.getByRole("button", { name: "Kích hoạt lại" }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await page
    .getByRole("button", { name: "Reset mật khẩu", exact: true })
    .click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await signOut(page);
  await login(page, "GV001");
  await expect(page).toHaveURL(/doi-mat-khau/);
});
test("create course and class with valid assignments, enroll student and retain on reload", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/hoc-phan/tao");
  await page.getByLabel("Mã học phần", { exact: true }).fill("CSE400");
  await page
    .getByLabel("Tên học phần", { exact: true })
    .fill("Kiểm thử phần mềm");
  await page.getByLabel("Khoa", { exact: true }).fill("Khoa CNTT");
  await page.getByRole("button", { name: "Lưu học phần", exact: true }).click();
  await page.getByRole("link", { name: "Tạo lớp", exact: true }).click();
  await page.getByLabel("Tên lớp", { exact: true }).fill("CSE400.01");
  await page.getByLabel("Giảng viên", { exact: true }).selectOption("GV001");
  await page
    .getByLabel("Trưởng nhóm HP", { exact: true })
    .selectOption("TN001");
  await page.getByRole("button", { name: "Lưu lớp", exact: true }).click();
  await page.getByRole("link", { name: "Import sinh viên vào lớp" }).click();
  await page.getByLabel("File Excel (.xlsx)", { exact: true }).setInputFiles({
    name: "class.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: await sheet([["Mã SV"], ["23110149"]]),
  });
  await page.getByRole("button", { name: "Xác nhận thêm vào lớp" }).click();
  await page.getByRole("link", { name: "Xem danh sách lớp" }).click();
  await page.reload();
  await expect(page.locator("tbody")).toContainText("Nguyễn Quang Anh");
});
test("AI uses valid sources, persists feedback and handles missing material", async ({
  page,
}) => {
  await login(page, "23110149");
  await page.goto("/sinh-vien/tro-ly-ai");
  await expect(page.locator(".ai-disclaimer")).toContainText("AI có thể mắc lỗi");
  await page
    .getByRole("button", { name: "Phân biệt PUT và PATCH", exact: true })
    .click();
  await expect(page.locator(".source-chip")).toContainText("Trang 2");
  await page.getByRole("button", { name: "Phản hồi hữu ích" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Phản hồi hữu ích" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Học phần", { exact: true }).selectOption("cs204");
  await page.getByLabel("Nhập câu hỏi AI").fill("Giải thích API");
  await page.getByRole("button", { name: "Gửi câu hỏi", exact: true }).click();
  await expect(page.locator(".chat-answer")).toContainText(
    "Chưa có học liệu phù hợp",
  );
  await expect(page.locator(".source-chip")).toHaveCount(0);
});
test("practice changes scope and set, gives feedback without grade entry", async ({
  page,
}) => {
  await login(page, "23110149");
  await page.goto("/sinh-vien/luyen-tap");
  await page
    .getByLabel("Phạm vi luyện tập", { exact: true })
    .selectOption("http");
  await page
    .getByRole("button", { name: "Tạo bộ luyện tập", exact: true })
    .click();
  const first = await page
    .locator(".ai-practice-question")
    .first()
    .textContent();
  await page.getByRole("button", { name: "Tạo bộ mới", exact: true }).click();
  expect(
    await page.locator(".ai-practice-question").first().textContent(),
  ).not.toBe(first);
  await expect(
    page.getByText("Không tính điểm", { exact: true }),
  ).toBeVisible();
});
test("24h queue email preview and log deduplicate; empty queue recovers", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/nhac-han");
  await page
    .getByLabel("Thời điểm kiểm tra", { exact: true })
    .fill("2027-01-31T12:00");
  await page.getByRole("button", { name: "Quét hạn trong 24 giờ" }).click();
  await expect(
    page.getByRole("heading", { name: "Xem trước email" }),
  ).toBeVisible();
  await expect(page.locator(".reminder-preview")).toContainText(
    "Nguyễn Quang Anh",
  );
  await page.getByRole("button", { name: "Ghi nhận nhắc mô phỏng" }).click();
  await page.getByRole("button", { name: "Ghi nhận nhắc mô phỏng" }).click();
  await expect(page.getByRole("status")).toContainText(
    "không tạo bản ghi trùng",
  );
  await page
    .getByRole("button", { name: "Nhật ký nhắc hạn", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.reload();
  await page
    .getByRole("button", { name: "Nhật ký nhắc hạn", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
});
test("teacher Excel import and assigned Dean role route the account without a role picker", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/tai-khoan/import");
  await page
    .getByLabel("Loại tài khoản", { exact: true })
    .selectOption("teacher");
  await page.getByLabel("File Excel (.xlsx)", { exact: true }).setInputFiles({
    name: "teachers.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: await sheet([
      ["Mã GV", "Họ tên", "Email", "Khoa"],
      ["GVNEW", "Giảng viên mới", "gvnew@example.edu", "Khoa CNTT"],
    ]),
  });
  await page.getByRole("button", { name: "Xác nhận nhập 1 tài khoản" }).click();
  await expect(
    page.getByRole("heading", { name: "Đã nhập tài khoản" }),
  ).toBeVisible();
  await page.goto("/admin/tai-khoan/GVNEW");
  await page.getByLabel("Vai trò", { exact: true }).selectOption("truong-khoa");
  await page.getByRole("button", { name: "Lưu vai trò", exact: true }).click();
  await signOut(page);
  await login(page, "GVNEW");
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("NewFaculty123");
  await page
    .getByLabel("Nhập lại mật khẩu", { exact: true })
    .fill("NewFaculty123");
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(page).toHaveURL(/truong-khoa\/tong-quan/);
  await expect(page.locator(".role-choice")).toHaveCount(0);
});
