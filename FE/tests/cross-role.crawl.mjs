// Runs the core of KICH-BAN-TEST-LIEN-VAI-TRO.md (flows 2–5 and 7) on an empty system and checks every
// cross-role expectation. Usage: node tests/cross-role.crawl.mjs http://127.0.0.1:5174
import { chromium } from "@playwright/test";
import path from "node:path";

const base = process.argv[2] || "http://127.0.0.1:5174";
const data = path.resolve("../test-data");
const browser = await chromium.launch();
let failures = 0;
const check = async (label, fn) => {
  try {
    await fn();
    console.log("✓ " + label);
  } catch (e) {
    failures++;
    console.log("✗ " + label + " — " + String(e.message).split("\n")[0]);
  }
};

async function as(id) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.goto(base + "/dang-nhap");
  await page.getByLabel("Mã tài khoản", { exact: true }).fill(id);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.includes("dang-nhap"));
  return page;
}
const settle = (page) => page.waitForLoadState("networkidle").then(() => page.waitForTimeout(800));
const text = async (page, route) => {
  await page.goto(base + route);
  await settle(page);
  return page.locator("#root").innerText();
};
const expectHas = (t, s) => {
  if (!t.includes(s)) throw new Error(`không thấy "${s}"`);
};
const expectNot = (t, s) => {
  if (t.includes(s)) throw new Error(`không được thấy "${s}"`);
};

// Setup on a fresh server: the students the test-data files refer to (already present on a reset real system).
async function api(pathname, token, body) {
  const r = await fetch(base + pathname, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json().catch(() => ({}));
}
const admin = (await api("/api/auth/login", null, { username: "AD001", password: "12345678" })).token;
const ids = Array.from({ length: 10 }, (_, i) => "SV26" + String(i + 1).padStart(2, "0"));
await api("/api/users/import", admin, ids.map((id) => ({ id, name: "Sinh viên " + id, email: id.toLowerCase() + "@test.vju.edu.vn", kind: "student" })));
for (const id of ["SV2601", "SV2606"]) {
  const t = (await api("/api/auth/login", null, { username: id, password: "12345678" })).token;
  await api("/api/auth/change-password", t, { oldPassword: "12345678", newPassword: "12345678x" });
  await api("/api/auth/change-password", (await api("/api/auth/login", null, { username: id, password: "12345678x" })).token,
    { oldPassword: "12345678x", newPassword: "12345678" }).catch(() => {});
}
const ad = await as("AD001");
const gv = await as("GV001");
const gv2 = await as("GV002");
const tn = await as("TN001");
const tk = await as("TK001");
const sv = await as("23110149");
const out = await as("SV2606");

// Flow 2: course, class, enrollment
await check("2.1 Admin tạo học phần CSE310 và lớp CSE310.01 (GV001, TN001)", async () => {
  await ad.goto(base + "/admin/hoc-phan/tao");
  await ad.locator('input[name="code"]').fill("CSE310");
  await ad.locator('input[name="title"]').fill("Kiểm thử phần mềm");
  await ad.locator('input[name="faculty"]').fill("Khoa học và Kỹ thuật máy tính");
  await ad.getByRole("button", { name: "Lưu học phần", exact: true }).click();
  await ad.getByRole("link", { name: "Tạo lớp", exact: true }).click();
  await ad.locator('input[name="name"]').fill("CSE310.01");
  await ad.locator('select[name="teacher"]').selectOption("GV001");
  await ad.locator('select[name="leader"]').selectOption("TN001");
  await ad.getByRole("button", { name: "Lưu lớp", exact: true }).click();
  await settle(ad);
});
await check("2.1 GV001 thấy CSE310 ở Lớp giảng dạy", async () => expectHas(await text(gv, "/giang-vien/lop-hoc"), "CSE310"));
await check("2.1 GV002 không thấy CSE310", async () => expectNot(await text(gv2, "/giang-vien/lop-hoc"), "CSE310"));
await check("2.1 TN001 có CSE310 trong ô Học phần", async () => expectHas(await text(tn, "/truong-nhom-hp/tong-quan"), "CSE310"));
await check("2.1 TK001 thấy CSE310", async () => expectHas(await text(tk, "/truong-khoa/hoc-phan"), "CSE310"));
await check("2.1 SV chưa ghi danh chưa thấy CSE310", async () => expectNot(await text(sv, "/sinh-vien/khoa-hoc"), "CSE310"));
await check("2.2 Admin ghi danh 6 SV từ file 07", async () => {
  await ad.getByRole("button", { name: "Import sinh viên vào lớp" }).or(ad.getByRole("link", { name: "Import sinh viên vào lớp" })).first().click();
  await ad.locator('input[type="file"]').setInputFiles(path.join(data, "2-ghi-danh/07_ghi-danh_HOP-LE_6-sv.xlsx"));
  await ad.getByRole("button", { name: "Xác nhận thêm vào lớp" }).click();
  await settle(ad);
});
await check("2.2 SV thấy sĩ số thật của lớp (6 sinh viên)", async () => expectHas(await text(sv, "/sinh-vien/khoa-hoc"), "6 sinh viên"));
await check("2.2 TNHP thấy tên lớp CSE310.01, không phải mã nội bộ", async () => {
  const t = await text(tn, "/truong-nhom-hp/tong-quan");
  expectHas(t, "CSE310.01");
  if (/[0-9a-f]{8}-[0-9a-f]{4}-/.test(t)) throw new Error("còn mã UUID trên màn");
});
await check("2.2 SV 23110149 thấy CSE310", async () => expectHas(await text(sv, "/sinh-vien/khoa-hoc"), "CSE310"));
await check("2.2 SV2606 (ngoài lớp) không thấy CSE310", async () => expectNot(await text(out, "/sinh-vien/khoa-hoc"), "CSE310"));
await check("2.2 GV Theo dõi học tập có 23110149", async () => expectHas(await text(gv, "/giang-vien/tien-do"), "23110149"));

// Flow 3: lesson, PDF, questions, publish
await check("3.1 GV tạo bài học trong lớp CSE310.01", async () => {
  await gv.goto(base + "/giang-vien/bai-hoc");
  await gv.getByRole("button", { name: "Tạo bài học", exact: true }).click();
  await gv.getByLabel("Tên bài học", { exact: true }).fill("Bài 1. Xác thực và JWT");
  await gv.getByRole("button", { name: "Lưu bài học", exact: true }).click();
  await settle(gv);
  expectHas(await text(gv, "/giang-vien/bai-hoc"), "Bài 1. Xác thực và JWT");
});
await check("3.1 GV002 không thấy bài học", async () => expectNot(await text(gv2, "/giang-vien/bai-hoc"), "Bài 1. Xác thực và JWT"));
let lessonUrl = "";
await check("3.2 GV thêm 4 trang và upload PDF vào lớp của bài", async () => {
  await gv.goto(base + "/giang-vien/bai-hoc");
  await gv.locator(".lesson-row").filter({ hasText: "Bài 1. Xác thực và JWT" }).getByRole("link", { name: /Soạn bài/ }).click();
  lessonUrl = gv.url();
  for (let i = 0; i < 3; i++) await gv.getByRole("button", { name: "Thêm trang", exact: true }).click();
  await gv.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await settle(gv);
  await gv.locator('input[aria-label="Upload bài giảng PDF"]').setInputFiles(path.join(data, "4-bai-giang/12_bai-giang_Xac-thuc-JWT_4-trang.pdf"));
  await gv.getByText(/Đã lưu PDF vào bài học/).waitFor();
});
await check("3.2 PDF và thay đổi chưa bấm lưu vẫn còn khi quay lại màn soạn bài", async () => {
  await gv.getByRole("combobox", { name: "Tuần học" }).selectOption("3");
  // Leave at once, before the delayed auto-save, through the "Câu hỏi" tab link.
  await gv.getByRole("button", { name: "Câu hỏi", exact: true }).click();
  await gv.getByRole("link", { name: /Soạn & duyệt câu hỏi/ }).click();
  await gv.getByRole("link", { name: /Quay lại soạn bài/ }).click();
  await settle(gv);
  if ((await gv.getByRole("combobox", { name: "Tuần học" }).inputValue()) !== "3") throw new Error("tuần học không được lưu");
  expectHas(await gv.locator("#root").innerText(), "Đã lưu: 12_bai-giang_Xac-thuc-JWT_4-trang.pdf");
  await gv.locator('iframe[title="Xem trước PDF đã chọn"]').waitFor();
});
await check("3.3 Import 4 câu, bị chặn công bố khi chưa duyệt, duyệt xong thì công bố được", async () => {
  const lessonId = new URL(lessonUrl).searchParams.get("bai");
  await gv.goto(`${base}/giang-vien/ngan-hang-cau-hoi?bai=${lessonId}`);
  await gv.locator('input[type="file"][accept=".xlsx,.csv"]').setInputFiles(path.join(data, "3-cau-hoi/09_cau-hoi_HOP-LE_4-cau.xlsx"));
  await gv.getByText(/Đã nhập 4 câu hỏi/).waitFor();
  await settle(gv);
  await gv.goto(lessonUrl);
  await gv.getByRole("button", { name: "Công bố", exact: true }).click();
  await gv.getByText(/Cần duyệt tất cả câu hỏi/).waitFor();
  await gv.goto(`${base}/giang-vien/ngan-hang-cau-hoi?bai=${lessonId}`);
  for (let i = 0; i < 4; i++) {
    await gv.getByRole("button", { name: /Duyệt câu hỏi/ }).first().click();
    await gv.waitForTimeout(400);
  }
  await settle(gv);
  await gv.goto(lessonUrl);
  await gv.getByRole("button", { name: "Công bố", exact: true }).click();
  await gv.getByText(/Đã công bố học liệu/).waitFor();
  await settle(gv);
});
await check("3.3 SV thấy bài đã công bố trong CSE310", async () => {
  await sv.goto(base + "/sinh-vien/khoa-hoc");
  await settle(sv);
  await sv.getByText("Kiểm thử phần mềm").first().click();
  await settle(sv);
  expectHas(await sv.locator("#root").innerText(), "Bài 1. Xác thực và JWT");
});

// Flow 4: session
await check("4.1 GV tạo và công bố phiên tự học", async () => {
  await gv.goto(base + "/giang-vien/phien-tu-hoc");
  await gv.getByRole("button", { name: "Tạo phiên tự học", exact: true }).click();
  await gv.getByLabel("Tên phiên", { exact: true }).fill("Tự học tuần 1");
  const now = new Date(Date.now() - 3600_000), later = new Date(Date.now() + 7 * 86400_000);
  const local = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  await gv.locator('input[type="datetime-local"]').first().fill(local(now));
  await gv.locator('input[type="datetime-local"]').nth(1).fill(local(later));
  await gv.getByRole("button", { name: "Lưu phiên tự học", exact: true }).click();
  await settle(gv);
  await gv.locator("tr").filter({ hasText: "Tự học tuần 1" }).getByRole("button", { name: "Công bố" }).click();
  await settle(gv);
});
await check("4.1 SV thấy phiên với đúng bài, 4 trang, 4 câu hỏi", async () => {
  const t = await text(sv, "/sinh-vien/tu-hoc");
  expectHas(t, "Tự học tuần 1");
  expectHas(t, "Bài 1. Xác thực và JWT · 4 trang");
  expectHas(t, "4 câu hỏi");
});
await check("4.1 SV2606 không thấy phiên", async () => expectNot(await text(out, "/sinh-vien/tu-hoc"), "Tự học tuần 1"));
await check("4.2 SV trả lời trang 1 (sai) rồi sang trang 2; GV thấy tiến độ và câu sai trang 1", async () => {
  await sv.goto(base + "/sinh-vien/tu-hoc");
  await settle(sv);
  await sv.getByRole("link", { name: /Bắt đầu học/ }).click();
  await settle(sv);
  if (!(await sv.getByRole("button", { name: /Trang tiếp theo/ }).isDisabled())) throw new Error("nút Trang tiếp theo không bị khóa");
  await sv.getByRole("radio").nth(0).check({ force: true });
  await sv.getByRole("button", { name: "Xác nhận đáp án" }).click();
  await settle(sv);
  await sv.getByRole("button", { name: /Trang tiếp theo/ }).click();
  await settle(sv);
  const t = await text(gv, "/giang-vien/tien-do");
  expectHas(t, "25%");
  expectHas(t, "Trang 1");
});

// Flow 5: chat with the uploaded PDF
await check("5.1 SV hỏi Trợ lý AI về JWT, có nút nguồn Học liệu", async () => {
  await sv.goto(base + "/sinh-vien/tro-ly-ai");
  await settle(sv);
  await sv.getByLabel("Nhập câu hỏi AI").fill("JWT gồm mấy phần?");
  await sv.getByRole("button", { name: "Gửi câu hỏi", exact: true }).click();
  await sv.locator(".chat-answer").first().waitFor();
  await settle(sv);
  expectHas(await sv.locator(".chat-answer").first().innerText(), "signature");
  if (!(await sv.locator(".source-chip").count())) throw new Error("không có nút nguồn");
});
await check("5.1 Câu ngoài phạm vi bị từ chối", async () => {
  await sv.getByLabel("Nhập câu hỏi AI").fill("Thời tiết hôm nay thế nào?");
  await sv.getByRole("button", { name: "Gửi câu hỏi", exact: true }).click();
  await sv.waitForFunction(() => document.querySelectorAll(".chat-answer").length >= 2, null, { timeout: 15000 });
  await settle(sv);
  expectHas(await sv.locator(".chat-answer").last().innerText(), "Chưa có học liệu phù hợp");
});

// Flow 7: live class
await check("7 Lớp trực tiếp: SV trong lớp vào được, SV ngoài lớp bị từ chối", async () => {
  await gv.goto(base + "/giang-vien/tren-lop");
  await settle(gv);
  await gv.getByRole("button", { name: "Bắt đầu phiên", exact: true }).click();
  const code = (await gv.locator(".large-session-code").textContent()).trim();
  await out.goto(base + "/sinh-vien/tren-lop");
  await out.getByLabel("Mã phiên gồm 6 chữ số").fill(code);
  await out.getByRole("button", { name: "Tham gia phiên" }).click();
  await out.getByRole("alert").filter({ hasText: "dành cho lớp" }).waitFor();
  await sv.goto(base + "/sinh-vien/tren-lop");
  await sv.getByLabel("Mã phiên gồm 6 chữ số").fill(code);
  await sv.getByRole("button", { name: "Tham gia phiên" }).click();
  await sv.locator(".live-options button").first().waitFor();
  await sv.locator(".live-options button").first().click();
  await sv.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await sv.getByText("Đã gửi").or(sv.getByText(/Tỷ lệ đúng/)).first().waitFor();
  await gv.getByRole("button", { name: "Kết thúc phiên" }).click();
});
await check("7 GV xem lại kết quả câu hỏi trên lớp sau khi kết thúc phiên", async () => {
  await gv.goto(base + "/giang-vien/tren-lop");
  await settle(gv);
  const panel = gv.locator(".live-result").first();
  await panel.waitFor();
  expectHas(await panel.innerText(), "1/1 sinh viên đã trả lời");
  await panel.getByRole("button", { name: /Xem từng sinh viên/ }).click();
  expectHas(await panel.innerText(), "23110149");
});
await check("4.1 SV xem đúng file PDF của bài trong trang học", async () => {
  await sv.goto(base + "/sinh-vien/tu-hoc");
  await settle(sv);
  await sv.getByRole("link", { name: /Tiếp tục|Bắt đầu học|Xem lại/ }).first().click();
  await sv.locator("iframe.slide-pdf").waitFor();
});

await browser.close();
console.log(failures ? `${failures} bước không đạt` : "Tất cả bước đều đạt");
