// Opens every route of every role against an empty-data server and reports crashes.
// Usage: node tests/empty-state.crawl.mjs http://127.0.0.1:5174
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://127.0.0.1:5174";
const roles = {
  AD001: ["admin/tai-khoan", "admin/tai-khoan/import", "admin/hoc-phan", "admin/hoc-phan/tao", "admin/lop/tao", "admin/nhac-han"],
  GV001: ["giang-vien/tong-quan", "giang-vien/lop-hoc", "giang-vien/lop-hoc/x", "giang-vien/bai-hoc", "giang-vien/soan-bai",
    "giang-vien/soan-bai?bai=x", "giang-vien/hoc-lieu-ai", "giang-vien/phien-tu-hoc", "giang-vien/ngan-hang-cau-hoi",
    "giang-vien/bai-tap", "giang-vien/tao-bai-tap", "giang-vien/cham-bai", "giang-vien/tren-lop", "giang-vien/tien-do",
    "giang-vien/diem-so", "giang-vien/phan-hoi", "giang-vien/phuc-khao", "giang-vien/tro-ly-ai", "giang-vien/tai-lieu",
    "giang-vien/ho-so"],
  "23110149": ["sinh-vien/tong-quan", "sinh-vien/khoa-hoc", "sinh-vien/khoa-hoc/x", "sinh-vien/tu-hoc", "sinh-vien/hoc/x",
    "sinh-vien/hoc/x?phien=y", "sinh-vien/bai-tap", "sinh-vien/lam-bai", "sinh-vien/ket-qua", "sinh-vien/luyen-tap",
    "sinh-vien/on-tap", "sinh-vien/tren-lop", "sinh-vien/diem-so", "sinh-vien/tro-ly-ai", "sinh-vien/tai-lieu",
    "sinh-vien/phan-hoi", "sinh-vien/ho-so"],
  TN001: ["truong-nhom-hp/tong-quan", "truong-nhom-hp/chuan-hoa", "truong-nhom-hp/chuan-hoa/x", "truong-nhom-hp/so-sanh",
    "truong-nhom-hp/yeu-cau", "truong-nhom-hp/hoc-lieu", "truong-nhom-hp/hoc-lieu/tao", "truong-nhom-hp/tai-lieu",
    "truong-nhom-hp/ho-so"],
  TK001: ["truong-khoa/tong-quan", "truong-khoa/hoc-phan", "truong-khoa/hoc-phan/x", "truong-khoa/hoc-phan/x/lop/y",
    "truong-khoa/canh-bao", "truong-khoa/ho-so"],
};

const browser = await chromium.launch();
let problems = 0;
for (const [id, routes] of Object.entries(roles)) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/dang-nhap");
  await page.getByLabel("Mã tài khoản", { exact: true }).fill(id);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.includes("dang-nhap"));
  for (const route of routes) {
    errors.length = 0;
    await page.goto(`${base}/${route}`);
    await page.waitForTimeout(700);
    const text = await page.locator("#root").innerText();
    const blank = text.trim().length < 20;
    // Demo leftovers that must not appear on an empty system.
    const leftovers = [...new Set(text.match(/CSE301|CSE204|RESTful|Tuần 0\d|16 tháng 10|P\.402|36 sinh viên/g) || [])];
    if (errors.length || blank || leftovers.length) {
      problems++;
      console.log(`✗ ${id} /${route} ${blank ? "[TRANG TRẮNG]" : ""} ${errors.slice(0, 2).join(" | ")} ${leftovers.length ? "[DEMO: " + leftovers.join(", ") + "]" : ""}`);
    }
  }
  await page.close();
}
await browser.close();
console.log(problems ? `${problems} trang có lỗi` : "Không trang nào lỗi");
