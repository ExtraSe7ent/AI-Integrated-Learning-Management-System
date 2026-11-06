import { it, expect } from "vitest";
import { dueCards, explanationSections } from "./studyAi";
import type { Aid } from "./studyAi";

it("splits a lesson explanation into its headed sections", () => {
  expect(
    explanationSections("Ý chính\nREST dùng URI.\n\nVí dụ\nGET /books\n\nTóm tắt\nURI định danh."),
  ).toEqual([
    { heading: "Ý chính", text: "REST dùng URI." },
    { heading: "Ví dụ", text: "GET /books" },
    { heading: "Tóm tắt", text: "URI định danh." },
  ]);
  expect(explanationSections("Giảng viên tự viết.\n\n")).toEqual([
    { heading: "", text: "Giảng viên tự viết." },
  ]);
});

it("offers new and due cards, never FAQ entries or cards scheduled later", () => {
  const aid = (id: string, kind: Aid["kind"], due?: boolean): Aid => ({
    id,
    courseId: "cs301",
    kind,
    front: "Mặt trước",
    back: "Mặt sau",
    published: true,
    origin: "ai",
    review:
      due === undefined
        ? undefined
        : { repetitions: 1, intervalDays: 1, dueAt: "", due },
  });
  expect(
    dueCards([aid("new", "card"), aid("due", "card", true), aid("later", "card", false), aid("faq", "faq")]).map(
      (a) => a.id,
    ),
  ).toEqual(["new", "due"]);
});
