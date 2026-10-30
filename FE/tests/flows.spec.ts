import { openRolePage } from "./helpers";
import { test, expect } from "@playwright/test";
test("student confirms a question, advances and resumes after reload", async ({
  page,
}) => {
  await openRolePage(page, "/sinh-vien/hoc/cs301");
  await expect(
    page.getByRole("button", { name: "Trang tiếp theo", exact: true }),
  ).toBeDisabled();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Xác nhận đáp án" }).click();
  await page
    .getByRole("button", { name: "Trang tiếp theo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Tài nguyên và HTTP methods",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Tài nguyên và HTTP methods",
      exact: true,
    }),
  ).toBeVisible();
});
test("a newly published assignment keeps its own title, timer and attempts", async ({
  page,
}) => {
  await openRolePage(page, "/giang-vien/tao-bai-tap");
  await page
    .getByLabel("Tên bài tập", { exact: true })
    .fill("Bài kiểm tra riêng số 2");
  await page.getByLabel("Thời gian làm (phút)").fill("5");
  await page.getByRole("button", { name: "Lưu bài tập nháp" }).click();
  const row = page
    .locator(".assignment-card")
    .filter({ hasText: "Bài kiểm tra riêng số 2" });
  await row.getByRole("button", { name: "Công bố", exact: true }).click();
  await openRolePage(page, "/sinh-vien/bai-tap");
  await page
    .locator(".assignment-card")
    .filter({ hasText: "Bài kiểm tra riêng số 2" })
    .getByRole("button", { name: "Bắt đầu làm bài" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Bài kiểm tra riêng số 2",
  );
  await expect(page.locator(".quiz-timer")).toContainText("04:");
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await openRolePage(page, "/sinh-vien/bai-tap");
  await expect(
    page
      .locator(".assignment-card")
      .filter({ hasText: "Thiết kế API quản lý thư viện" })
      .getByRole("button", { name: "Bắt đầu làm bài" }),
  ).toBeVisible();
});
test("lecturer grade and feedback appear in student results", async ({
  page,
}) => {
  await openRolePage(page, "/sinh-vien/bai-tap");
  await page.getByRole("button", { name: "Bắt đầu làm bài" }).click();
  await page.getByRole("radio").first().check();
  await page.getByLabel("Đáp án của bạn").fill("POST");
  await page
    .getByLabel("Bài làm", { exact: true })
    .fill("POST /api/loans, trả về 201 Created.");
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await openRolePage(page, "/giang-vien/cham-bai");
  await page
    .getByLabel("Nhận xét cho sinh viên")
    .fill("Đã duyệt bài làm, cần bổ sung xử lý lỗi.");
  await page.getByRole("button", { name: "Duyệt & công bố điểm" }).click();
  await openRolePage(page, "/sinh-vien/ket-qua");
  await expect(
    page.getByText("Điểm đã được giảng viên duyệt và công bố."),
  ).toBeVisible();
  await expect(
    page.getByText("Đã duyệt bài làm, cần bổ sung xử lý lỗi."),
  ).toBeVisible();
  await expect(page.locator(".result-score")).toContainText("9.5");
  await openRolePage(page, "/sinh-vien/diem-so");
  await expect(
    page.getByRole("cell", {
      name: "Đã duyệt bài làm, cần bổ sung xử lý lỗi.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Điểm tạm tính; tự luận chờ duyệt.")).toHaveCount(
    0,
  );
});
test("published lesson title reaches the student reader", async ({ page }) => {
  await openRolePage(page, "/giang-vien/soan-bai");
  await page
    .getByLabel("Tên bài học", { exact: true })
    .fill("RESTful API — phiên bản đã chỉnh");
  await page.getByRole("button", { name: "Công bố", exact: true }).click();
  await openRolePage(page, "/sinh-vien/hoc/cs301");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "RESTful API — phiên bản đã chỉnh",
  );
});
test("student feedback is answered by the lecturer", async ({ page }) => {
  await openRolePage(page, "/sinh-vien/phan-hoi");
  await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  await page
    .getByLabel("Nội dung phản hồi")
    .fill("Tôi muốn thêm ví dụ về API phân trang.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Gửi phản hồi", exact: true })
    .click();
  await openRolePage(page, "/giang-vien/phan-hoi");
  const card = page
    .locator(".feedback-card")
    .filter({ hasText: "Tôi muốn thêm ví dụ về API phân trang." });
  await card
    .getByLabel("Trả lời sinh viên")
    .fill("Thầy sẽ bổ sung ví dụ phân trang vào bài tiếp theo.");
  await card
    .getByRole("button", { name: "Trả lời & đánh dấu đã xử lý" })
    .click();
  await openRolePage(page, "/sinh-vien/phan-hoi");
  await expect(
    page.getByText("Thầy sẽ bổ sung ví dụ phân trang vào bài tiếp theo."),
  ).toBeVisible();
});
test("local live class rejects invalid code and accepts a student answer", async ({
  page,
  context,
}) => {
  await openRolePage(page, "/giang-vien/tren-lop");
  await page
    .getByRole("button", { name: "Bắt đầu phiên", exact: true })
    .click();
  const student = await context.newPage();
  await openRolePage(student, "/sinh-vien/tren-lop");
  await student.getByLabel("Mã phiên gồm 6 chữ số").fill("111111");
  await student.getByRole("button", { name: "Tham gia phiên" }).click();
  await expect(student.getByRole("alert")).toContainText("Mã phiên không đúng");
  await student.getByLabel("Mã phiên gồm 6 chữ số").fill("261016");
  await student.getByRole("button", { name: "Tham gia phiên" }).click();
  await student.bringToFront();
  await student.locator(".live-options button").first().click();
  await student.getByRole("button", { name: "Xác nhận câu trả lời" }).click();
  await expect(
    student.getByText("Đã gửi câu trả lời", { exact: true }),
  ).toBeVisible();
  await page.bringToFront();
  await page.getByRole("button", { name: "Hiện đáp án" }).click();
  await expect(student.locator(".correct-option")).toHaveCount(1);
});
const routes = [
  "sinh-vien/tong-quan",
  "sinh-vien/khoa-hoc",
  "sinh-vien/khoa-hoc/cs301",
  "sinh-vien/tu-hoc",
  "sinh-vien/hoc/cs301",
  "sinh-vien/bai-tap",
  "sinh-vien/ket-qua",
  "sinh-vien/luyen-tap",
  "sinh-vien/tren-lop",
  "sinh-vien/diem-so",
  "sinh-vien/tro-ly-ai",
  "sinh-vien/tai-lieu",
  "sinh-vien/phan-hoi",
  "sinh-vien/ho-so",
  "sinh-vien/thong-bao",
  "giang-vien/tong-quan",
  "giang-vien/lop-hoc",
  "giang-vien/lop-hoc/cs301",
  "giang-vien/bai-hoc",
  "giang-vien/soan-bai",
  "giang-vien/phien-tu-hoc",
  "giang-vien/ngan-hang-cau-hoi",
  "giang-vien/bai-tap",
  "giang-vien/tao-bai-tap",
  "giang-vien/cham-bai",
  "giang-vien/tren-lop",
  "giang-vien/tien-do",
  "giang-vien/diem-so",
  "giang-vien/phan-hoi",
  "giang-vien/phuc-khao",
  "giang-vien/tro-ly-ai",
  "giang-vien/tai-lieu",
  "giang-vien/ho-so",
  "giang-vien/thong-bao",
  "dang-nhap",
  "doi-mat-khau",
];
for (const width of [1440, 390])
  test(`all routes render without errors or page overflow at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of routes) {
      await openRolePage(page, "/" + route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("body")).not.toContainText(
        /\bDemo\b|Bản trải nghiệm|Dữ liệu mẫu|Frontend demo/i,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        route,
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  });
