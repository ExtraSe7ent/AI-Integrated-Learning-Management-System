import { test, expect } from "./base";
import type { Page } from "@playwright/test";
import { loginAs } from "./helpers";
async function login(page: Page) {
  await page.goto("/dang-nhap");
  await page.getByLabel("Mã tài khoản", { exact: true }).fill("TN001");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/truong-nhom-hp\/tong-quan$/);
}
async function logout(page: Page) {
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  await page.getByRole("link", { name: "Đăng xuất", exact: true }).click();
}
test("assigned CourseLeader account restores and rejects other role routes", async ({
  page,
}) => {
  await login(page);
  await expect(page.locator(".leader-workspace")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tổng quan chuẩn hoá",
  );
  await page.goto("/truong-khoa/tong-quan");
  await expect(page).toHaveURL(/truong-nhom-hp\/tong-quan$/);
  await logout(page);
  await page.goto("/truong-nhom-hp/so-sanh");
  await expect(page).toHaveURL(/dang-nhap$/);
  await loginAs(page, "sinh-vien");
  await page.goto("/truong-nhom-hp/hoc-lieu");
  await expect(page).toHaveURL(/sinh-vien\/tong-quan$/);
});
test("course scope, review content and read-only edits stay constrained", async ({
  page,
}) => {
  await login(page);
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page
    .getByRole("link", { name: "Rà soát lớp CSE301.02", exact: true })
    .click();
  await page
    .getByRole("link", {
      name: "Rà soát REST và thiết kế tài nguyên",
      exact: true,
    })
    .click();
  await expect(page.locator(".leader-material-content")).toContainText(
    "/loans",
  );
  await expect(
    page.getByRole("link", { name: "Chỉnh sửa nội dung", exact: true }),
  ).toHaveCount(0);
  await page.goto(
    "/truong-nhom-hp/hoc-lieu/api2-slides/sua?hp=cs301&lop=CSE301.02",
  );
  await expect(
    page.getByRole("heading", { name: "Bạn chỉ có quyền xem học liệu này" }),
  ).toBeVisible();
  await page.goto(
    "/truong-nhom-hp/chuan-hoa/CSE301.01/hoc-lieu/api-slides?hp=cs204",
  );
  await expect(
    page.getByText("Không tìm thấy nội dung trong phạm vi phân công", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Về học phần được phân công" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
});
test("comparison shows actual same-kind content and recovers invalid selections", async ({
  page,
}) => {
  await login(page);
  await page.goto("/truong-nhom-hp/so-sanh");
  await expect(page.locator(".leader-compare-grid .panel")).toHaveCount(2);
  await expect(page.locator(".leader-compare-grid")).toContainText("PATCH");
  await expect(page.locator(".leader-compare-grid")).toContainText("/loans");
  await page.getByLabel("Loại học liệu", { exact: true }).selectOption("quiz");
  await expect(page.locator(".leader-compare-grid")).toContainText(
    "Đáp án: B. 404",
  );
  await page
    .getByLabel("Lớp thứ hai", { exact: true })
    .selectOption("CSE301.01");
  await expect(
    page.getByText("Chọn hai lớp khác nhau trong cùng học phần", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Đặt lại lựa chọn" }).click();
  await page.getByLabel("Học phần", { exact: true }).selectOption("cs204");
  await expect(
    page.getByText("Học phần hiện chỉ có một lớp", { exact: true }),
  ).toBeVisible();
});
test("adjustment request reaches the lecturer and returns to M1 until re-reviewed", async ({
  page,
}) => {
  await login(page);
  await page.goto("/truong-nhom-hp/chuan-hoa/CSE301.01/hoc-lieu/api-slides");
  await page
    .getByLabel("Yêu cầu điều chỉnh", { exact: true })
    .fill("Bổ sung ví dụ PATCH cho sách.");
  await page
    .getByRole("button", { name: "Gửi yêu cầu cho GV", exact: true })
    .click();
  await expect(page.getByLabel("Mức xử lý", { exact: true })).toHaveValue("2");
  await page.getByLabel("Mức xử lý", { exact: true }).selectOption("3");
  await page.getByRole("button", { name: "Lưu mức xử lý" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Chờ giảng viên phản hồi",
  );
  await logout(page);
  await loginAs(page, "giang-vien");
  await page.goto("/giang-vien/bai-hoc");
  const request = page
    .locator(".leader-teacher-request")
    .filter({ hasText: "Bổ sung ví dụ PATCH cho sách." });
  await request.getByRole("button", { name: "Chỉnh sửa và phản hồi" }).click();
  await request
    .getByLabel("Nội dung học liệu sau chỉnh sửa")
    .fill("PATCH /books/1 cập nhật riêng tiêu đề.");
  await request
    .getByLabel("Phản hồi điều chỉnh")
    .fill("Đã bổ sung ví dụ PATCH.");
  await request
    .getByRole("button", { name: "Gửi phản hồi", exact: true })
    .click();
  await logout(page);
  await login(page);
  await page.goto("/truong-nhom-hp/chuan-hoa/CSE301.01/hoc-lieu/api-slides");
  await expect(page.getByLabel("Mức xử lý", { exact: true })).toHaveValue("1");
  await expect(page.locator(".leader-material-content")).toContainText(
    "PATCH /books/1",
  );
  await page
    .getByLabel("Yêu cầu điều chỉnh", { exact: true })
    .fill("Bổ sung mã lỗi 404 cho sách không tồn tại.");
  await page
    .getByRole("button", { name: "Gửi yêu cầu cho GV", exact: true })
    .click();
  await expect(page.getByLabel("Mức xử lý", { exact: true })).toHaveValue("2");
  await expect(
    page.getByText("Đã đóng yêu cầu", { exact: true }),
  ).toBeVisible();
  await logout(page);
  await loginAs(page, "giang-vien");
  await page.goto("/giang-vien/bai-hoc");
  const followup = page
    .locator(".leader-teacher-request")
    .filter({ hasText: "Bổ sung mã lỗi 404 cho sách không tồn tại." });
  await followup.getByRole("button", { name: "Chỉnh sửa và phản hồi" }).click();
  await followup
    .getByLabel("Nội dung học liệu sau chỉnh sửa")
    .fill("PATCH /books/1 cập nhật tiêu đề. Trả 404 khi không tìm thấy sách.");
  await followup
    .getByLabel("Phản hồi điều chỉnh")
    .fill("Đã bổ sung ví dụ và mã lỗi 404.");
  await followup
    .getByRole("button", { name: "Gửi phản hồi", exact: true })
    .click();
  await logout(page);
  await login(page);
  await page.goto("/truong-nhom-hp/chuan-hoa/CSE301.01/hoc-lieu/api-slides");
  await expect(page.getByLabel("Mức xử lý", { exact: true })).toHaveValue("1");
  await page.getByLabel("Mức xử lý", { exact: true }).selectOption("3");
  await page.getByRole("button", { name: "Lưu mức xử lý" }).click();
  await expect(page.getByText("Đã đóng yêu cầu", { exact: true })).toHaveCount(
    2,
  );
  await page.reload();
  await expect(page.getByLabel("Mức xử lý", { exact: true })).toHaveValue("3");
});
test("completion is gated and editing reopens a completed class", async ({
  page,
}) => {
  await login(page);
  await page.goto("/truong-nhom-hp/chuan-hoa/CSE301.01");
  await expect(
    page.getByRole("button", { name: "Hoàn thành chuẩn hoá", exact: true }),
  ).toBeDisabled();
  await page.goto("/truong-nhom-hp/chuan-hoa/CSE204.01?hp=cs204");
  await page
    .getByRole("button", { name: "Hoàn thành chuẩn hoá", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Đã hoàn thành chuẩn hoá", exact: true }),
  ).toBeDisabled();
  await page.goto("/truong-nhom-hp/hoc-lieu/db-slides/sua?hp=cs204");
  await page
    .getByLabel("Nội dung", { exact: true })
    .fill("Bảng và khóa ngoại: ví dụ đã cập nhật.");
  await page.getByRole("button", { name: "Lưu học liệu", exact: true }).click();
  await expect(page.getByLabel("Mức xử lý", { exact: true })).toHaveValue("1");
  await page.goto("/truong-nhom-hp/chuan-hoa/CSE204.01?hp=cs204");
  await expect(
    page.getByRole("button", { name: "Hoàn thành chuẩn hoá", exact: true }),
  ).toBeDisabled();
});
test("creates each content kind in its chosen class without modifying another class", async ({
  page,
}) => {
  await login(page);
  for (const kind of ["slides", "quiz", "assignment"]) {
    await page.goto("/truong-nhom-hp/hoc-lieu/tao?hp=cs301&lop=CSE301.02");
    await page.getByLabel("Loại học liệu", { exact: true }).selectOption(kind);
    await page
      .getByLabel("Tiêu đề", { exact: true })
      .fill("Nội dung mới " + kind);
    await page
      .getByLabel("Nội dung", { exact: true })
      .fill("Câu hỏi, đáp án hoặc tiêu chí đã ghi rõ.");
    await page
      .getByRole("button", { name: "Lưu học liệu", exact: true })
      .click();
    await expect(page.getByLabel("Mức xử lý", { exact: true })).toHaveValue(
      "0",
    );
  }
  await page.goto("/truong-nhom-hp/chuan-hoa/CSE301.02");
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await page.goto("/truong-nhom-hp/chuan-hoa/CSE301.01");
  await expect(page.locator("tbody tr")).toHaveCount(3);
});
test("references validate URLs, edit and persist without leaking course scope", async ({
  page,
}) => {
  await login(page);
  await page.goto("/truong-nhom-hp/tai-lieu");
  await page.getByLabel("Tên tài liệu", { exact: true }).fill("Tài liệu mới");
  await page
    .getByLabel("Đường dẫn", { exact: true })
    .fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Lưu tài liệu", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("URL http/https");
  await page
    .getByLabel("Đường dẫn", { exact: true })
    .fill("/materials/demo-lesson.pdf");
  await page.getByRole("button", { name: "Lưu tài liệu", exact: true }).click();
  await page.reload();
  const row = page.locator("tbody tr").filter({ hasText: "Tài liệu mới" });
  await expect(row.getByRole("link", { name: "Mở tài liệu" })).toHaveAttribute(
    "href",
    "/materials/demo-lesson.pdf",
  );
  await row.getByRole("button", { name: "Chỉnh sửa" }).click();
  await page
    .getByLabel("Tên tài liệu", { exact: true })
    .fill("Tài liệu đã sửa");
  await page.getByRole("button", { name: "Lưu tài liệu", exact: true }).click();
  await expect(page.locator("tbody")).toContainText("Tài liệu đã sửa");
  await page.getByLabel("Học phần", { exact: true }).selectOption("cs204");
  await expect(page.locator("tbody tr")).toHaveCount(0);
});
test("profile is separate; bell is a dismissible popup with local read state", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Thông báo", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Thông báo", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/tong-quan$/);
  await page.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Thông báo", exact: true }),
  ).toBeFocused();
  await expect(page.locator(".notification-button i")).toHaveCount(0);
  await page.goto("/truong-nhom-hp/ho-so");
  await page.getByLabel("Họ và tên", { exact: true }).fill("Lê Thanh Hà Linh");
  await page.getByRole("button", { name: "Lưu thông tin" }).click();
  await page.reload();
  await expect(page.locator(".user-block")).toContainText("Lê Thanh Hà Linh");
  await logout(page);
  await loginAs(page, "giang-vien");
  await page.goto("/giang-vien/ho-so");
  await expect(page.getByLabel("Họ và tên", { exact: true })).toHaveValue(
    "Nguyễn Minh Anh",
  );
});
for (const width of [1440, 390])
  test("CourseLeader routes/assets/keyboard at " + width, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 1000 });
    await login(page);
    for (const path of [
      "tong-quan",
      "chuan-hoa",
      "chuan-hoa/CSE301.01",
      "chuan-hoa/CSE301.01/hoc-lieu/api-slides",
      "so-sanh",
      "yeu-cau",
      "hoc-lieu",
      "hoc-lieu/tao",
      "hoc-lieu/api-slides/sua",
      "tai-lieu",
      "ho-so",
    ]) {
      await page.goto("/truong-nhom-hp/" + path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      expect(
        await page
          .locator("img")
          .evaluateAll((images) =>
            images.every((i) => i.complete && i.naturalWidth > 0),
          ),
      ).toBe(true);
    }
    if (width === 390) {
      const menu = page.getByRole("button", { name: "Mở menu", exact: true });
      await page.locator(".skip-link").focus();
      await page.keyboard.press("Tab");
      await expect(menu).toBeFocused();
      await menu.click();
      await page.keyboard.press("Escape");
      await expect(menu).toBeFocused();
      await menu.click();
      await page
        .locator(".sidebar")
        .getByRole("link", { name: "Tổng quan", exact: true })
        .click();
      await expect(page.locator(".sidebar")).toBeHidden();
    }
    expect(errors).toEqual([]);
  });
