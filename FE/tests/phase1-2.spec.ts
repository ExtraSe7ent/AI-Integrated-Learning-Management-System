import { readFile } from "node:fs/promises";
import { test, expect } from "./base";
import { loginAs } from "./helpers";

/** Phase 1–2 (UC-G02, UC-A01, UC-A02, UC-A04) against the real backend: every change survives a reload. */

test("UC-G02: a new lesson is saved by the server; a lesson with student data cannot be deleted", async ({ page }) => {
  await loginAs(page, "giang-vien");
  await page.goto("/giang-vien/bai-hoc");
  await expect(page.getByRole("button", { name: "Xóa Kiến trúc ứng dụng web hiện đại" })).toBeDisabled();
  await page.getByRole("button", { name: "Tạo bài học", exact: true }).click();
  await page.getByLabel("Tên bài học", { exact: true }).fill("4.1 Kiểm thử API");
  const created = page.waitForResponse((r) => r.url().endsWith("/api/lessons") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
  expect((await created).status()).toBe(201);
  await page.reload();
  await expect(page.getByText("4.1 Kiểm thử API", { exact: true })).toBeVisible();
  const deleted = page.waitForResponse((r) => r.url().includes("/api/lessons/") && r.request().method() === "DELETE");
  await page.getByRole("button", { name: "Xóa 4.1 Kiểm thử API" }).click();
  expect((await deleted).status()).toBe(204);
  await page.reload();
  await expect(page.getByText("4.1 Kiểm thử API", { exact: true })).toHaveCount(0);
});

test("UC-A01: questions belong to their lesson; a bad import row saves nothing; pending ones block publishing", async ({
  page,
}) => {
  await loginAs(page, "giang-vien");
  await page.goto("/giang-vien/ngan-hang-cau-hoi?bai=l3");
  await expect(page.getByText("Chưa có câu hỏi phù hợp", { exact: false })).toBeVisible();

  const header = "Câu hỏi,A,B,C,D,Đáp án (0–3),Trang,Giải thích";
  const upload = (rows: string[]) =>
    page.locator('input[type="file"][accept=".xlsx,.csv"]').setInputFiles({
      name: "cau-hoi.csv",
      mimeType: "text/csv",
      buffer: Buffer.from([header, ...rows].join("\n")),
    });
  await upload(["JWT gồm mấy phần?,1,2,3,4,2,1,Header payload signature", "Câu lỗi,A,B,C,,0,1,Thiếu D"]);
  await expect(page.getByRole("status")).toContainText("Không đọc được tệp");

  await upload(["JWT gồm mấy phần?,1,2,3,4,2,1,Header payload signature"]);
  await expect(page.getByRole("status")).toContainText("Đã nhập 1 câu hỏi");
  await page.reload();
  await expect(page.getByText("JWT gồm mấy phần?", { exact: false })).toBeVisible();
  await expect(page.getByText("Chờ giảng viên duyệt", { exact: true })).toBeVisible();

  // The demo lesson's bank does not show the other lesson's question.
  await page.getByLabel("Bài học", { exact: true }).selectOption("l2");
  await expect(page.getByText("JWT gồm mấy phần?", { exact: false })).toHaveCount(0);

  await page.goto("/giang-vien/soan-bai?bai=l3");
  await page.getByRole("button", { name: "Công bố", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Cần duyệt tất cả câu hỏi của bài này");
});

test("UC-A01: duplicate options are refused before reaching the server", async ({ page }) => {
  await loginAs(page, "giang-vien");
  await page.goto("/giang-vien/ngan-hang-cau-hoi?bai=l2");
  await page.getByRole("button", { name: "Thêm câu hỏi", exact: true }).click();
  await page.getByLabel("Câu hỏi", { exact: true }).fill("Mã 201 nghĩa là gì?");
  for (const [label, value] of [["A", "Created"], ["B", "Created"], ["C", "OK"], ["D", "Not Found"]])
    await page.getByLabel(`Đáp án ${label}`, { exact: true }).fill(value);
  await page.getByLabel("Giải thích", { exact: true }).fill("201 là tạo mới thành công.");
  await page.getByRole("button", { name: "Lưu câu hỏi", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("không được trùng nhau");
});

test("UC-A02: a session is created for the chosen lesson and kept after reload", async ({ page }) => {
  await loginAs(page, "giang-vien");
  await page.goto("/giang-vien/phien-tu-hoc");
  await page.getByRole("button", { name: "Tạo phiên tự học", exact: true }).click();
  await page.getByLabel("Tên phiên", { exact: true }).fill("Ôn xác thực JWT");
  await page.getByLabel("Bài học của phiên", { exact: true }).selectOption("l3");
  await page.getByRole("button", { name: "Lưu phiên tự học", exact: true }).click();
  await page.reload();
  const row = page.locator("tr").filter({ hasText: "Ôn xác thực JWT" });
  await expect(row).toContainText("Xác thực và phân quyền");
});

test("UC-A04 / UC-B08: an uploaded reference is reordered, then downloaded by a student", async ({ page }) => {
  await loginAs(page, "giang-vien");
  await page.goto("/giang-vien/tai-lieu");
  await page.getByRole("button", { name: "Thêm liên kết", exact: true }).click();
  await page.getByLabel("Tên tài liệu", { exact: true }).fill("Video sai nguồn");
  await page.locator('select[name="kind"]').selectOption("video");
  await page.getByLabel("Liên kết", { exact: true }).fill("https://vimeo.com/123");
  await page.getByRole("button", { name: "Thêm tài liệu", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Video phải là liên kết YouTube");
  await page.getByRole("button", { name: "Đóng", exact: true }).click();

  await page.getByRole("button", { name: "Tải tệp lên", exact: true }).click();
  await page.locator('dialog[open] input[name="title"]').fill("Đề cương CSE301");
  await page.locator('input[name="file"]').setInputFiles({
    name: "de-cuong.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Đề cương học phần CSE301"),
  });
  await page.getByRole("button", { name: "Tải lên", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã tải tài liệu lên");
  const rows = page.locator("tbody tr");
  await expect(rows.last()).toContainText("Đề cương CSE301");
  const moved = page.waitForResponse((r) => r.url().includes("/api/resources/") && r.request().method() === "PUT");
  await page.getByRole("button", { name: "Đưa Đề cương CSE301 lên" }).click();
  await moved;
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(rows.nth((await rows.count()) - 2)).toContainText("Đề cương CSE301");

  await page.goto("/dang-nhap");
  await loginAs(page, "sinh-vien");
  await page.goto("/sinh-vien/tai-lieu");
  const row = page.locator("tr").filter({ hasText: "Đề cương CSE301" });
  const download = page.waitForEvent("download");
  await row.getByRole("button", { name: "Tải xuống" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("de-cuong.txt");
  expect(await readFile(await file.path(), "utf8")).toBe("Đề cương học phần CSE301");
});

async function signIn(page: import("@playwright/test").Page, id: string) {
  await page.goto("/dang-nhap");
  await page.evaluate(() => sessionStorage.clear());
  await page.goto("/dang-nhap");
  await page.getByLabel("Mã tài khoản", { exact: true }).fill(id);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.includes("dang-nhap"));
}

test("UC-G06: a course Admin creates and assigns appears for its lecturer and course leader", async ({ page }) => {
  test.setTimeout(90_000);
  await signIn(page, "AD001");
  await page.goto("/admin/hoc-phan/tao");
  await page.locator('input[name="code"]').fill("TEST01");
  await page.locator('input[name="title"]').fill("Học phần tester");
  await page.locator('input[name="faculty"]').fill("Khoa học và Kỹ thuật máy tính");
  const course = page.waitForResponse((r) => r.url().endsWith("/api/courses") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Lưu học phần", exact: true }).click();
  expect((await course).status()).toBe(201);
  await page.getByRole("link", { name: "Tạo lớp", exact: true }).click();
  await page.locator('input[name="name"]').fill("TEST01.01");
  await page.locator('select[name="teacher"]').selectOption("GV002");
  await page.locator('select[name="leader"]').selectOption("TN001");
  const cls = page.waitForResponse((r) => r.url().endsWith("/api/class-info") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Lưu lớp", exact: true }).click();
  expect((await cls).status()).toBe(201);

  // The assigned lecturer sees the course and can create a lesson in its class.
  await signIn(page, "GV002");
  await page.goto("/giang-vien/lop-hoc");
  await expect(page.getByText("TEST01", { exact: true }).first()).toBeVisible();
  await page.getByText("Học phần tester").first().click();
  await expect(page.getByText("Chưa có bài học", { exact: true })).toBeVisible();
  await page.goto("/giang-vien/bai-hoc");
  await page.getByRole("button", { name: "Tạo bài học", exact: true }).click();
  const picker = page.locator('dialog[open] select[aria-label="Lớp học phần"]');
  const testClass = await picker.locator("option", { hasText: "TEST01.01" }).getAttribute("value");
  await picker.selectOption(testClass!);
  await page.getByLabel("Tên bài học", { exact: true }).fill("Bài của học phần tester");
  const lesson = page.waitForResponse((r) => r.url().endsWith("/api/lessons") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
  expect((await lesson).status()).toBe(201);
  await page.reload();
  await expect(page.getByText("Bài của học phần tester", { exact: true })).toBeVisible();
  // GV002 does not teach CSE301, so its lessons are not listed for them.
  await expect(page.getByText("Thiết kế RESTful API", { exact: true })).toHaveCount(0);

  // A lecturer who is not assigned does not see it.
  await signIn(page, "GV001");
  await page.goto("/giang-vien/lop-hoc");
  await expect(page.getByText("Học phần tester")).toHaveCount(0);

  // The assigned course leader can pick it.
  await signIn(page, "TN001");
  await page.goto("/truong-nhom-hp/tong-quan");
  await expect(page.getByLabel("Học phần", { exact: true }).locator("option", { hasText: "TEST01" })).toHaveCount(1);
});
