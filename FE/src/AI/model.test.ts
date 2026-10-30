import { it, expect } from "vitest";
import {
  answerFromMaterial,
  practiceSet,
  deadlineCandidates,
  reminderRecords,
} from "./model";
it("never attaches invented sources outside available course material", () => {
  expect(answerFromMaterial("cs204", "Giải thích API").sources).toEqual([]);
  expect(answerFromMaterial("cs301", "Thời tiết hôm nay").sources).toEqual([]);
  expect(answerFromMaterial("cs301", "Phân biệt PUT và PATCH").sources).toEqual(
    [2],
  );
});
import { initialData } from "../data/fixtures";
it("selects a new practice set within the requested slide scope", () => {
  const first = practiceSet("http", 0),
    next = practiceSet("http", 1);
  expect(first.every((q) => [2, 3].includes(q.page))).toBe(true);
  expect(first.map((q) => q.id)).not.toEqual(next.map((q) => q.id));
});
it("only reminds incomplete work due within 24h and deduplicates each channel", () => {
  const data = {
    ...initialData,
    sessions: [{ ...initialData.sessions[0], closes: "2026-10-31T18:00:00" }],
    assignments: [],
  };
  const now = Date.parse("2026-10-30T19:00:00"),
    c = deadlineCandidates(data, now);
  expect(c).toHaveLength(1);
  const once = reminderRecords([], c, now);
  expect(once).toHaveLength(2);
  expect(reminderRecords(once, c, now)).toHaveLength(2);
  expect(deadlineCandidates(data, now - 86400000)).toHaveLength(0);
  expect(
    deadlineCandidates(
      {
        ...data,
        studySessions: {
          s1: { progress: 4, answers: {}, completedAt: "2026-10-30T18:00:00" },
        },
      },
      now,
    ),
  ).toHaveLength(0);
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
