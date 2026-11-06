import type { Page } from "@playwright/test";
import { test, expect } from "./base";

async function login(page: Page, id: string, home: string) {
  await page.goto("/dang-nhap");
  await page.getByLabel("Mã tài khoản", { exact: true }).fill(id);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(`**/${home}/**`);
}
async function logout(page: Page) {
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
}

async function createExam(page: Page, title: string) {
  await page.goto("/giang-vien/tao-bai-tap");
  await page.getByLabel("Tên bài tập").fill(title);
  await page.getByLabel("Xóa câu 3").click();
  await page.getByLabel("Xóa câu 2").click();
  await page.getByLabel("Nội dung câu 1").fill("Mã nào nghĩa là đã tạo?");
  await page.getByLabel("Lựa chọn A câu 1").fill("200");
  await page.getByLabel("Lựa chọn B câu 1").fill("201");
  await page.getByLabel("Lựa chọn C câu 1").fill("404");
  await page.getByLabel("Lựa chọn D câu 1").fill("500");
  await page.getByLabel("Đáp án đúng B câu 1").check();
  await page.getByLabel("Điểm").first().fill("6");
  await page.getByRole("button", { name: "Tự luận" }).click();
  await page.getByLabel("Nội dung câu 2").fill("Giải thích PATCH.");
  await page
    .getByLabel(/Tiêu chí chấm/)
    .fill("Nêu cập nhật một phần = một phần; Nêu ví dụ = title");
  await page.getByLabel("Điểm").nth(1).fill("4");
  await page.getByRole("button", { name: "Lưu bài tập nháp" }).click();
  await page.waitForURL("**/giang-vien/bai-tap");
  const card = page.locator(".assignment-card", { hasText: title });
  await expect(card).toContainText("2 câu · 10 điểm");
  await card.getByRole("button", { name: "Công bố" }).click();
  await expect(card).toContainText("Đã công bố");
}

test("UC-A03 D01 D02 D03 D04: an exam goes from configuration to appeal", async ({
  page,
}) => {
  test.setTimeout(90000);
  const title = "Đề cấu hình E2E";
  await login(page, "GV001", "giang-vien");
  await createExam(page, title);
  await logout(page);

  await login(page, "23110149", "sinh-vien");
  const bootstrap = await page.request.get("/api/assignments", {
    headers: {
      Authorization: `Bearer ${await page.evaluate(
        () => sessionStorage.getItem("vju-token") ?? localStorage.getItem("vju-token"),
      )}`,
    },
  });
  if (bootstrap.ok()) expect(await bootstrap.text()).not.toContain('"correct"');
  await page.goto("/sinh-vien/bai-tap");
  const card = page.locator(".assignment-card", { hasText: title });
  await expect(card).toContainText("2 câu hỏi · 10 điểm");
  await card.getByRole("button", { name: "Bắt đầu làm bài" }).click();
  await page.waitForURL("**/sinh-vien/lam-bai**");
  await page.getByText("404", { exact: true }).click();
  await page.getByLabel("Bài làm").fill("PATCH sửa một phần tài nguyên.");
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await page.waitForURL("**/sinh-vien/ket-qua**");
  await expect(page.locator(".result-score")).toContainText("0");
  await expect(page.getByText("Sai", { exact: true })).toBeVisible();
  await expect(page.getByText(/Đáp án đúng:.*B\. 201/)).toBeVisible();
  await expect(page.getByText(/Tỷ lệ đúng 0%/)).toBeVisible();
  await page.getByRole("button", { name: "Yêu cầu phúc khảo" }).first().click();
  await page.getByLabel("Lý do phúc khảo").fill("Em xin chấm lại câu này ạ.");
  await page.getByRole("button", { name: "Gửi yêu cầu" }).click();
  await expect(page.getByText("Đã lưu yêu cầu phúc khảo.")).toBeVisible();
  await page.waitForTimeout(500);
  await logout(page);

  await login(page, "GV001", "giang-vien");
  await page.goto("/giang-vien/bai-tap");
  await page
    .locator(".assignment-card", { hasText: title })
    .getByRole("link", { name: "Chấm bài" })
    .click();
  await expect(page.getByText("Bài nộp · 1")).toBeVisible();
  await expect(page.getByText("Nguyễn Quang Anh")).toBeVisible();
  await expect(page.getByText(/Cần bổ sung: Nêu ví dụ/)).toBeVisible();
  await expect(page.getByLabel("Điểm câu 2 (0–4)")).toHaveValue("2");
  await page.getByLabel("Nhận xét cho sinh viên").fill("Cần thêm ví dụ.");
  await page.getByRole("button", { name: "Duyệt & công bố điểm" }).click();
  await expect(page.getByText("Đã công bố điểm và phản hồi.")).toBeVisible();

  await page.goto("/giang-vien/phuc-khao");
  const appeal = page.locator(".panel", { hasText: "Em xin chấm lại" });
  await expect(appeal).toContainText("Nguyễn Quang Anh");
  await appeal.getByLabel("Quyết định").selectOption("accepted");
  await appeal.getByLabel("Điểm câu sau chấm lại").fill("6");
  await appeal.getByLabel("Lý do / phản hồi").fill("Đồng ý chấm lại câu một.");
  await appeal.getByRole("button", { name: /Lưu & thông báo/ }).click();
  await expect(appeal).toContainText("Đồng ý chấm lại");
  await page.waitForTimeout(500);
  await logout(page);

  await login(page, "23110149", "sinh-vien");
  await page.goto("/sinh-vien/bai-tap");
  await page
    .locator(".assignment-card", { hasText: title })
    .getByRole("link", { name: "Xem kết quả" })
    .click();
  await expect(page.locator(".result-score")).toContainText("8");
  await expect(page.getByText("Đã chấm lại")).toBeVisible();
  await expect(page.getByText("Cần thêm ví dụ.")).toBeVisible();
  await logout(page);

  await login(page, "GV001", "giang-vien");
  await page.goto("/giang-vien/diem-so");
  await expect(page.getByRole("cell", { name: "23110149" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Anh", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "8", exact: true })).toBeVisible();
  await page.goto("/giang-vien/tien-do");
  await expect(page.getByText("student@example.edu")).toBeVisible();
  await logout(page);

  await login(page, "TK001", "truong-khoa");
  await page.goto("/truong-khoa/hoc-phan/cs301/lop/CSE301.01");
  await expect(page.getByText("Nguyễn Quang Anh")).toBeVisible();
});

test("UC-B07: practice is built from the approved bank and cannot be graded", async ({
  page,
}) => {
  await login(page, "23110149", "sinh-vien");
  await page.goto("/sinh-vien/luyen-tap");
  await page.getByRole("button", { name: "Tạo câu hỏi luyện tập" }).click();
  await expect(page.getByText("Câu 1 ·")).toBeVisible();
  await expect(page.getByText(/ngân hàng câu hỏi đã duyệt/)).toBeVisible();
  await page.getByLabel("Từ trang").fill("90");
  await page.getByRole("button", { name: "Tạo bộ mới" }).first().click();
  await expect(page.getByText("Nội dung học liệu chưa đủ")).toBeVisible();
});

test("UC-G03: a deadline scan records one reminder per channel", async ({
  page,
}) => {
  await login(page, "AD001", "admin");
  await page.goto("/admin/nhac-han");
  await page.getByLabel("Thời điểm kiểm tra").fill("2027-01-31T08:00");
  await page.getByRole("button", { name: "Quét hạn trong 24 giờ" }).click();
  await expect(page.getByText(/Danh sách cần nhắc · 2/)).toBeVisible();
  await page.getByRole("button", { name: "Gửi nhắc ngay" }).click();
  await expect(page.getByText(/Đã xử lý 4 nhắc hạn/)).toBeVisible();
  await expect(page.getByText("Chưa cấu hình SMTP").first()).toBeVisible();
  await page.getByRole("button", { name: "Hàng đợi nhắc hạn" }).click();
  await page.getByRole("button", { name: "Quét hạn trong 24 giờ" }).click();
  await page.getByRole("button", { name: "Gửi nhắc ngay" }).click();
  await expect(page.getByText(/không tạo bản ghi trùng/)).toBeVisible();
});
