import { beforeEach, expect, it, vi } from "vitest";
import { initialData } from "../data/fixtures";
import type { Assessment, DemoData } from "../data/fixtures";
import { api } from "./client";
import { pushChanges } from "./sync";

vi.mock("./client", () => ({ api: vi.fn() }));
beforeEach(() => vi.mocked(api).mockReset());

const draft = (answer: string): Assessment => ({
  attempts: 0,
  draft: { answers: [answer], deadline: 1000 },
  result: null,
});

it("does not overwrite a newer local answer with an older autosave response", async () => {
  const before = { ...initialData, assessments: {} };
  const target = { ...initialData, assessments: { a1: draft("a") } };
  let resolve!: (value: Assessment) => void;
  vi.mocked(api).mockImplementationOnce(() => new Promise((done) => { resolve = done as typeof resolve; }));
  const pending = pushChanges(before, target, { id: "23110149", role: "sinh-vien" });
  const latest: DemoData = { ...target, assessments: { a1: draft("abc") } };
  resolve({ ...target.assessments.a1, draft: { answers: ["a"], deadline: 2000 } });
  const patches = await pending;
  const next = patches.reduce((data, patch) => patch(data), latest);
  expect(next.assessments.a1.draft?.answers).toEqual(["abc"]);
});

it("applies the authoritative server deadline when that draft is still current", async () => {
  const before = { ...initialData, assessments: {} };
  const target: DemoData = { ...initialData, assessments: { a1: draft("a") } };
  const saved = { ...target.assessments.a1, draft: { answers: ["a"], deadline: 2000 } };
  vi.mocked(api).mockResolvedValueOnce(saved);
  const patches = await pushChanges(before, target, { id: "23110149", role: "sinh-vien" });
  expect(patches.reduce((data, patch) => patch(data), target).assessments.a1).toEqual(saved);
});
it("sends practice answers instead of resending the official result", async () => {
  const official={score:0,answers:["wrong"],submitted:"first"};
  const before:DemoData={...initialData,assessments:{a1:{attempts:1,draft:{answers:["right"],deadline:2000,mode:"practice"},result:official,practiceResults:[]}}};
  const after:DemoData={...before,assessments:{a1:{...before.assessments.a1,draft:null,practiceResults:[{score:0,answers:["right"],submitted:"practice"}]}}};
  vi.mocked(api).mockResolvedValueOnce(after.assessments.a1);
  await pushChanges(before,after,{id:"23110149",role:"sinh-vien"});
  expect(vi.mocked(api).mock.calls[0][1]?.body).toMatchObject({result:{answers:["right"]}});
});
