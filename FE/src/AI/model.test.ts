import { it, expect } from "vitest";
import { answerFromMaterial, reminderEmail } from "./model";
it("never attaches invented sources outside available course material", () => {
  expect(answerFromMaterial("cs204", "Giải thích API").sources).toEqual([]);
  expect(answerFromMaterial("cs301", "Thời tiết hôm nay").sources).toEqual([]);
  expect(answerFromMaterial("cs301", "Phân biệt PUT và PATCH").sources).toEqual(
    [2],
  );
});
import { initialData } from "../data/fixtures";
it("writes the reminder email from the server's candidate", () => {
  const email = reminderEmail({
    key: "k",
    studentId: "sv",
    studentName: "An",
    email: "an@example.edu",
    className: "CSE301.01",
    kind: "session",
    itemId: "s1",
    title: "RESTful API",
    due: "2026-10-31T18:00:00",
    progress: "50% hoàn thành",
  });
  expect(email.subject).toBe("Nhắc hạn tự học · CSE301.01");
  expect(email.body).toContain("Tiến độ hiện tại: 50% hoàn thành");
});
import { materialSourceAvailable, recordChatFeedback } from "./model";
it("stops citing the old slide source after material structure changes and persists reports", () => {
  const data = {
    ...initialData,
    lessons: initialData.lessons.map((l) =>
      l.id === "l2" ? { ...l, slides: ["Một trang mới"] } : l,
    ),
  };
  expect(materialSourceAvailable(data)).toBe(false);
  expect(
    answerFromMaterial("cs301", "Mã trạng thái HTTP", false).sources,
  ).toEqual([]);
  const chat = {
    ...initialData,
    chat: [{ question: "REST?", answer: "Nội dung", page: 1 }],
  };
  const once = recordChatFeedback(chat, 0, "reported");
  expect(once.chat[0].rating).toBe("reported");
  expect(once.feedback).toHaveLength(initialData.feedback.length + 1);
  expect(recordChatFeedback(once, 0, "reported").feedback).toHaveLength(
    once.feedback.length,
  );
});
