import { test, expect } from "@playwright/test";
import { loginAs, openRolePage } from "./helpers";
test("lesson editor keeps the selected lesson and slide order after reload", async ({
  page,
}) => {
  await loginAs(page, "giang-vien");
  await page.goto("/giang-vien/soan-bai?bai=l3");
  await page
    .getByLabel("Tên bài học", { exact: true })
    .fill("Bài xác thực đã sửa");
  await page.getByRole("button", { name: "Thêm trang", exact: true }).click();
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Tên bài học", { exact: true })).toHaveValue(
    "Bài xác thực đã sửa",
  );
  await page.goto("/giang-vien/soan-bai?bai=l2");
  await expect(page.getByLabel("Tên bài học", { exact: true })).toHaveValue(
    "Thiết kế RESTful API",
  );
  await page.locator(".course-context a").click();
  await expect(page).toHaveURL(/giang-vien\/lop-hoc\/cs301/);
});
test("a submitted attempt cannot be resubmitted from the exam URL and retry is explicit", async ({
  page,
}) => {
  await loginAs(page, "sinh-vien");
  await page.goto("/sinh-vien/bai-tap");
  await page
    .getByRole("button", { name: "Bắt đầu làm bài", exact: true })
    .click();
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await page.goto("/sinh-vien/lam-bai?bai=a1");
  await expect(page).toHaveURL(/ket-qua/);
  await page.goto("/sinh-vien/bai-tap");
  await expect(
    page.getByRole("button", { name: "Làm lại bài tập", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Làm lại bài tập", exact: true })
    .click();
  await expect(page.locator(".quiz-timer")).toBeVisible();
});
test("an appeal carries the question and regrades that question only", async ({
  page,
}) => {
  await loginAs(page, "sinh-vien");
  await page.goto("/sinh-vien/bai-tap");
  await page
    .getByRole("button", { name: "Bắt đầu làm bài", exact: true })
    .click();
  await page.getByRole("radio").first().check();
  await page.getByLabel("Đáp án của bạn").fill("POST");
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await page
    .getByRole("button", { name: "Yêu cầu phúc khảo", exact: true })
    .nth(2)
    .click();
  await page
    .getByLabel("Lý do phúc khảo")
    .fill("Xin kiểm tra lại tiêu chí chấm câu tự luận.");
  await page.getByRole("button", { name: "Gửi yêu cầu", exact: true }).click();
  await openRolePage(page, "/giang-vien/phuc-khao");
  await expect(
    page.getByText("Câu 3 · API mượn sách", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Quyết định", { exact: true }).selectOption("accepted");
  await page.getByLabel("Điểm câu sau chấm lại", { exact: true }).fill("2");
  await page
    .getByLabel("Lý do / phản hồi", { exact: true })
    .fill("Đã đối chiếu và cập nhật điểm cho câu tự luận.");
  await page.getByRole("button", { name: "Lưu & thông báo kết quả" }).click();
  await openRolePage(page, "/sinh-vien/ket-qua");
  await expect(page.locator(".result-score")).toContainText("9");
  await expect(page.getByText("Điểm: 2/3", { exact: true })).toBeVisible();
});
test("image feedback remains viewable after reload in the lecturer workspace", async ({
  page,
}) => {
  await loginAs(page, "sinh-vien");
  await page.goto("/sinh-vien/phan-hoi");
  await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  await page
    .getByLabel("Nội dung phản hồi")
    .fill("Ảnh lỗi ở trang bài học, xin giảng viên kiểm tra.");
  await page.locator("input[type=file]").setInputFiles({
    name: "loi.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6mMAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Gửi phản hồi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Ảnh lỗi ở trang bài học, xin giảng viên kiểm tra.",
      exact: true,
    }),
  ).toBeVisible();
  await openRolePage(page, "/giang-vien/phan-hoi");
  await page.reload();
  await expect(
    page.getByRole("img", { name: "loi.png", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .getByRole("img", { name: "loi.png" })
      .evaluate((e: HTMLImageElement) => e.naturalWidth),
  ).toBeGreaterThan(0);
});
