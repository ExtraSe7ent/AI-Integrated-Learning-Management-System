// Tạo lại các file test thủ công trong test-data/. Chạy ở thư mục gốc dự án: node test-data/_tao-du-lieu.mjs .
import { createRequire } from "node:module";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { deflateSync, crc32 } from "node:zlib";
import path from "node:path";

const repo = path.resolve(process.argv[2] || ".");
const require = createRequire(path.join(repo, "FE", "package.json"));
const ExcelJS = require("exceljs");
const { chromium } = require("@playwright/test");
const out = path.join(repo, "test-data");
const dirs = ["1-tai-khoan", "2-ghi-danh", "3-cau-hoi", "4-bai-giang", "5-tai-lieu", "6-phan-hoi"];
// Only the generated folders are replaced; README.md and this script stay.
for (const d of dirs) {
  await rm(path.join(out, d), { recursive: true, force: true });
  await mkdir(path.join(out, d), { recursive: true });
}
const file = (dir, name) => path.join(out, dir, name);

async function xlsx(target, header, rows) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Danh sách");
  sheet.addRow(header);
  rows.forEach((r) => sheet.addRow(r));
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((c) => (c.width = 30));
  await book.xlsx.writeFile(target);
}

// 1. Tài khoản
const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô"];
const ten = ["Minh Anh", "Gia Bảo", "Thu Hà", "Quốc Huy", "Ngọc Lan", "Đức Long", "Thảo My", "Hải Nam", "Phương Thảo", "Tuấn Vũ"];
const students = ho.map((h, i) => [`SV26${String(i + 1).padStart(2, "0")}`, `${h} ${ten[i]}`, `sv26${String(i + 1).padStart(2, "0")}@test.vju.edu.vn`]);
await xlsx(file("1-tai-khoan", "01_sinh-vien_HOP-LE_10-nguoi.xlsx"), ["Mã SV", "Họ tên", "Email"], students);
// Accounts nobody has imported yet, for the account flow after a "keep accounts" reset.
await xlsx(file("1-tai-khoan", "00_sinh-vien_MOI_3-nguoi.xlsx"), ["Mã SV", "Họ tên", "Email"], [
  ["SV3001", "Phan Thị Mai", "sv3001@test.vju.edu.vn"],
  ["SV3002", "Trịnh Văn Khoa", "sv3002@test.vju.edu.vn"],
  ["SV3003", "Lý Thu Trang", "sv3003@test.vju.edu.vn"],
]);
await xlsx(file("1-tai-khoan", "00_giang-vien_MOI_1-nguoi.xlsx"), ["Mã GV", "Họ tên", "Email", "Khoa"], [
  ["GV301", "TS. Đinh Công Thành", "gv301@test.vju.edu.vn", "Khoa học và Kỹ thuật máy tính"],
]);
await xlsx(file("1-tai-khoan", "02_sinh-vien_CO-LOI.xlsx"), ["Mã SV", "Họ tên", "Email"], [
  ["SV2701", "Lê Văn Đúng", "sv2701@test.vju.edu.vn"],
  ["SV2702", "Email Sai", "sv2702-khong-co-a-cong"],
  ["SV2703", "", "sv2703@test.vju.edu.vn"],
  ["23110149", "Trùng Mã Có Sẵn", "trungma@test.vju.edu.vn"],
  ["SV2705", "Trùng Email Trong Tệp", "sv2701@test.vju.edu.vn"],
  ["SV 2706", "Mã Có Dấu Cách", "sv2706@test.vju.edu.vn"],
]);
await xlsx(file("1-tai-khoan", "03_giang-vien_HOP-LE_3-nguoi.xlsx"), ["Mã GV", "Họ tên", "Email", "Khoa"], [
  ["GV101", "TS. Nguyễn Hữu Phát", "gv101@test.vju.edu.vn", "Khoa học và Kỹ thuật máy tính"],
  ["GV102", "ThS. Trần Thị Hồng", "gv102@test.vju.edu.vn", "Khoa học và Kỹ thuật máy tính"],
  ["GV103", "PGS. Lê Minh Quân", "gv103@test.vju.edu.vn", "Khoa Kỹ thuật"],
]);
await xlsx(file("1-tai-khoan", "04_giang-vien_THIEU-KHOA.xlsx"), ["Mã GV", "Họ tên", "Email", "Khoa"], [
  ["GV201", "Giảng viên Có Khoa", "gv201@test.vju.edu.vn", "Khoa học và Kỹ thuật máy tính"],
  ["GV202", "Giảng viên Thiếu Khoa", "gv202@test.vju.edu.vn", ""],
]);
await xlsx(file("1-tai-khoan", "05_SAI-TEN-COT.xlsx"), ["Student ID", "Full name", "Mail"], [["SV2801", "Sai Cột", "sv2801@test.vju.edu.vn"]]);
await writeFile(file("1-tai-khoan", "06_KHONG-PHAI-EXCEL.csv"), "Mã SV,Họ tên,Email\nSV2901,Không Phải Excel,sv2901@test.vju.edu.vn\n");

// 2. Ghi danh vào lớp
// The main test student 23110149 plus SV2601–SV2605 join the class created in the cross-role scenario.
await xlsx(file("2-ghi-danh", "07_ghi-danh_HOP-LE_6-sv.xlsx"), ["Mã SV"], [["23110149"], ...students.slice(0, 5).map((s) => [s[0]])]);
await xlsx(file("2-ghi-danh", "08_ghi-danh_CO-LOI.xlsx"), ["Mã SV"], [["SV2606"], ["SV9999"], ["SV2606"], ["GV001"]]);

// 3. Câu hỏi (cùng cấu trúc với nút "Xuất Excel" của Ngân hàng câu hỏi)
const qHeader = ["Câu hỏi", "A", "B", "C", "D", "Đáp án (0–3)", "Trang", "Giải thích"];
const questions = [
  ["JWT gồm mấy phần ngăn cách bởi dấu chấm?", "1", "2", "3", "4", 2, 1, "Header, payload và signature."],
  ["Mã HTTP nào báo chưa xác thực?", "200 OK", "401 Unauthorized", "403 Forbidden", "404 Not Found", 1, 2, "401 là chưa đăng nhập hoặc token sai."],
  ["Mã HTTP nào báo đã đăng nhập nhưng không đủ quyền?", "400 Bad Request", "401 Unauthorized", "403 Forbidden", "500 Internal Server Error", 2, 3, "403 là thiếu quyền truy cập tài nguyên."],
  ["Nên lưu mật khẩu người dùng thế nào?", "Văn bản thường", "Mã hóa Base64", "Băm bằng BCrypt", "Gửi kèm token", 2, 4, "Băm một chiều có salt, ví dụ BCrypt."],
];
await xlsx(file("3-cau-hoi", "09_cau-hoi_HOP-LE_4-cau.xlsx"), qHeader, questions);
await xlsx(file("3-cau-hoi", "10_cau-hoi_CO-LOI.xlsx"), qHeader, [
  questions[0],
  ["Câu thiếu đáp án D?", "A", "B", "C", "", 0, 1, "Thiếu D"],
  ["Đáp án đúng ngoài 0–3?", "A", "B", "C", "D", 5, 1, "Sai đáp án"],
  ["Trang không hợp lệ?", "A", "B", "C", "D", 0, 0, "Trang 0"],
]);
const csv = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
await writeFile(file("3-cau-hoi", "11_cau-hoi_HOP-LE.csv"),
  "﻿" + [qHeader,
    // Khác hẳn các câu của file 09, để bước E2 tìm được câu chưa duyệt một cách chắc chắn.
    ["Header Authorization thường gửi token theo dạng nào?", "Basic token", "Bearer token", "Cookie token", "Query token", 1, 1, "Authorization: Bearer <token>."],
    ["Token JWT hết hạn thì máy chủ nên trả mã nào?", "200 OK", "302 Found", "401 Unauthorized", "500 Internal Server Error", 2, 2, "Token hết hạn coi như chưa xác thực: 401."],
  ].map((r) => r.map(csv).join(",")).join("\n") + "\n");

// 4–6. PDF, ảnh: render HTML bằng Chromium (font hệ thống có dấu tiếng Việt)
const browser = await chromium.launch();
const page = await browser.newPage();
const slide = (n, title, body) => `<section><small>CSE301 · Bài 3 · Trang ${n}</small><h1>${title}</h1>${body}</section>`;
await page.setContent(`<html><head><style>
  @page { size: A4 landscape; margin: 0 } body { margin: 0; font-family: Arial, sans-serif }
  section { height: 100vh; box-sizing: border-box; padding: 60px 80px; page-break-after: always; border-top: 18px solid #a4262c }
  h1 { color: #a4262c; font-size: 40px } p, li { font-size: 22px; line-height: 1.5 } small { color: #777; font-size: 16px }
</style></head><body>
${slide(1, "Xác thực và phân quyền", "<p>Xác thực (authentication) trả lời câu hỏi: <b>bạn là ai?</b> Phân quyền (authorization) trả lời: <b>bạn được làm gì?</b></p><p>Hệ thống web thường xác thực một lần khi đăng nhập rồi gửi kèm token trong mỗi yêu cầu tiếp theo.</p>")}
${slide(2, "JSON Web Token (JWT)", "<p>JWT gồm ba phần ngăn cách bởi dấu chấm: header, payload và signature.</p><ul><li>Header: thuật toán ký, ví dụ HS256.</li><li>Payload: thông tin người dùng như mã, vai trò, thời hạn.</li><li>Signature: chữ ký giúp máy chủ phát hiện token bị sửa.</li></ul>")}
${slide(3, "Mã trạng thái 401 và 403", "<p>401 Unauthorized: chưa đăng nhập hoặc token không hợp lệ.</p><p>403 Forbidden: đã đăng nhập nhưng không đủ quyền, ví dụ sinh viên gọi API chỉ dành cho giảng viên.</p>")}
${slide(4, "Lưu mật khẩu an toàn", "<p>Không bao giờ lưu mật khẩu dạng văn bản thường. Hãy băm một chiều có salt bằng BCrypt hoặc Argon2.</p><p>Khi đăng nhập, máy chủ băm mật khẩu nhập vào rồi so sánh với giá trị đã lưu.</p>")}
</body></html>`);
await page.pdf({ path: file("4-bai-giang", "12_bai-giang_Xac-thuc-JWT_4-trang.pdf"), landscape: true, format: "A4", printBackground: true });
await writeFile(file("4-bai-giang", "13_GIA-MAO-khong-phai-pdf.pdf"), "Đây là tệp văn bản đổi đuôi thành .pdf, máy chủ phải từ chối.");

await page.setContent(`<html><body style="font-family:Arial;padding:50px"><h1>Đề cương học phần CSE301 – Phát triển ứng dụng web</h1>
<p>Số tín chỉ: 3 · Hình thức: lớp học đảo ngược (tự học trước, thảo luận trên lớp).</p>
<ol><li>Kiến trúc ứng dụng web hiện đại</li><li>Thiết kế RESTful API</li><li>Xác thực và phân quyền</li></ol>
<p>Đánh giá: điểm tự học 30%, bài tập AI 70%.</p></body></html>`);
await page.pdf({ path: file("5-tai-lieu", "14_de-cuong_CSE301.pdf"), format: "A4" });

// Ảnh phản hồi: chụp màn hình lỗi giả lập
await page.setViewportSize({ width: 900, height: 500 });
for (const [i, msg] of [[1, "Slide trang 3 hiển thị sai mã trạng thái"], [2, "Chat AI trả lời không khớp học liệu"]]) {
  await page.setContent(`<html><body style="margin:0;font-family:Arial;background:#f7f6f2;display:grid;place-items:center;height:100vh">
  <div style="background:#fff;border:3px solid #a4262c;border-radius:12px;padding:40px;width:700px"><h2 style="color:#a4262c">Ảnh minh chứng ${i}</h2><p style="font-size:22px">${msg}</p></div></body></html>`);
  await page.screenshot({ path: file("6-phan-hoi", `${18 + i}_anh-minh-chung-${i}.png`) });
}
await browser.close();

// docx tối giản (Word mở được): zip chứa document.xml
const JSZip = require("jszip");
if (JSZip) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  const p = (t) => `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${p("Bài tập tham khảo: Thiết kế API đăng nhập")}${p("1. Viết endpoint POST /api/auth/login trả về JWT.")}${p("2. Giải thích khi nào trả 401, khi nào trả 403.")}</w:body></w:document>`);
  await writeFile(file("5-tai-lieu", "15_bai-tap-tham-khao.docx"), await zip.generateAsync({ type: "nodebuffer" }));
}
await writeFile(file("5-tai-lieu", "16_ghi-chu-on-tap.txt"), "Ghi chú ôn tập CSE301\n- 401: chưa xác thực\n- 403: không đủ quyền\n- JWT: header.payload.signature\n");
await xlsx(file("5-tai-lieu", "17_bang-ma-HTTP.xlsx"), ["Mã", "Ý nghĩa"], [[200, "OK"], [201, "Created"], [401, "Unauthorized"], [403, "Forbidden"], [404, "Not Found"]]);
await writeFile(file("5-tai-lieu", "18_KHONG-HOP-LE.exe"), Buffer.from("MZ - tệp thực thi giả lập, máy chủ phải từ chối"));

// Ảnh quá 5 MB: PNG nhiễu không nén được
function png(width, height, pixel) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) pixel(raw, y * (width * 3 + 1) + 1 + x * 3);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 0 })), chunk("IEND", Buffer.alloc(0))]);
}
await writeFile(file("6-phan-hoi", "21_anh-QUA-5MB.png"), png(1400, 1400, (b, i) => { b[i] = Math.random() * 256; b[i + 1] = Math.random() * 256; b[i + 2] = Math.random() * 256; }));
await writeFile(file("6-phan-hoi", "22_KHONG-PHAI-ANH.txt"), "Tệp văn bản, không phải hình ảnh.");
console.log("done");
