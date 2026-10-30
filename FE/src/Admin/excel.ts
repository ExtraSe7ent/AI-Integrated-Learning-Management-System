export async function readSheet(file: File): Promise<string[][]> {
  if (!file.name.toLowerCase().endsWith(".xlsx"))
    throw Error("Chọn file Excel .xlsx theo mẫu.");
  if (file.size > 5 * 1024 * 1024) throw Error("File tối đa 5 MB.");
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  try {
    await book.xlsx.load(await file.arrayBuffer());
  } catch {
    throw Error("Không đọc được file Excel. Tải mẫu rồi thử lại.");
  }
  const sheet = book.worksheets[0];
  if (!sheet || sheet.rowCount > 5001)
    throw Error("Danh sách cần từ 1 đến 5000 dòng dữ liệu.");
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const cells: string[] = [];
    for (let n = 1; n <= Math.min(sheet.columnCount, 30); n++)
      cells.push(row.getCell(n).text.trim());
    rows.push(cells);
  });
  return rows;
}
export async function downloadTemplate(kind: "student" | "teacher" | "enroll") {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook(),
    sheet = book.addWorksheet("Danh sách");
  sheet.addRow(
    kind === "enroll"
      ? ["Mã SV"]
      : kind === "student"
        ? ["Mã SV", "Họ tên", "Email"]
        : ["Mã GV", "Họ tên", "Email", "Khoa"],
  );
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((c) => (c.width = 28));
  const buffer = await book.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `mau-${kind}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
