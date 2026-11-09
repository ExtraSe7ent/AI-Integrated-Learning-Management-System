import { describe, it, expect } from "vitest";
import {
  initialAdmin,
  previewAccounts,
  importAccounts,
  saveCourse,
  saveClass,
  enrollStudents,
  updateUser,
} from "./model";
describe("Admin registry", () => {
  it("validates the whole spreadsheet before creating any account", () => {
    const rows = [
      ["Mã SV", "Họ tên", "Email"],
      ["SVNEW", "Nguyễn An", "an@example.edu"],
      ["23110149", "Trùng mã", "other@example.edu"],
    ];
    const preview = previewAccounts(initialAdmin, rows, "student");
    expect(preview[0].errors).toEqual([]);
    expect(preview[1].errors.join()).toContain("đã tồn tại");
    expect(() => importAccounts(initialAdmin, preview)).toThrow(/dòng lỗi/);
    const next = importAccounts(initialAdmin, preview.slice(0, 1));
    expect(next.users.find((u) => u.id === "SVNEW")).toMatchObject({
      role: "sinh-vien",
      active: true,
      mustChange: true,
    });
  });
});
it("preserves an account when disabled and restricts manager roles to teachers", () => {
  const next = updateUser(initialAdmin, "GV001", { active: false });
  expect(next.users).toHaveLength(initialAdmin.users.length);
  expect(next.users.find((u) => u.id === "GV001")?.active).toBe(false);
  expect(() =>
    updateUser(initialAdmin, "23110149", { role: "truong-khoa" }),
  ).toThrow(/giảng viên/);
  expect(
    updateUser(initialAdmin, "GV001", { role: "truong-khoa" }).users.find(
      (u) => u.id === "GV001",
    )?.role,
  ).toBe("truong-khoa");
});
it("rejects duplicate courses, invalid assignments and duplicate enrollment", () => {
  expect(() =>
    saveCourse(initialAdmin, {
      id: "new",
      code: "cse301",
      title: "Mới",
      faculty: "Khoa",
    }),
  ).toThrow(/tồn tại/);
  expect(() =>
    saveClass(initialAdmin, {
      ...initialAdmin.classes[0],
      teacherId: "23110149",
    }),
  ).toThrow(/giảng viên/);
  expect(() =>
    enrollStudents(initialAdmin, "CSE301.01", [
      { id: "23110149", line: 2, name: "QA", error: "" },
    ]),
  ).toThrow(/đổi/);
});
