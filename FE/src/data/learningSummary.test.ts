import { it, expect } from "vitest";
import { initialData } from "./fixtures";
import { learningSummary } from "./learningSummary";
it("includes a newly published session and a second submitted assignment in totals", () => {
  const data = {
    ...initialData,
    sessions: [{ ...initialData.sessions[0], id: "new-session" }],
    studySessions: {
      "new-session": {
        progress: 4,
        answers: {},
        completedAt: "2026-10-30T12:00:00",
      },
    },
    gradeHistory: [],
    assignments: [{ ...initialData.assignments[0], id: "new-assignment" }],
    assessments: {
      "new-assignment": {
        attempts: 1,
        draft: null,
        result: { score: 6, answers: [], submitted: "now" },
      },
    },
  };
  expect(learningSummary(data)).toMatchObject({
    self: 10,
    average: 6,
    progress: 100,
  });
});
