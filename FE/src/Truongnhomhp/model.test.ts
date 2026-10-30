import { describe, it, expect } from "vitest";
import {
  initialCoordination,
  classItems,
  findItem,
  reviewItem,
  requestChange,
  replyToRequest,
  saveMaterial,
  canComplete,
  completeClass,
  safeReferenceUrl,
} from "./model";
const fresh = () => structuredClone(initialCoordination);
describe("CourseLeader standardization", () => {
  it("scopes class and material identity by the assigned course", () => {
    expect(classItems(fresh(), "cs301", "CSE301.01")).toHaveLength(3);
    expect(classItems(fresh(), "cs204", "CSE301.01")).toEqual([]);
    expect(
      findItem(fresh(), "cs204", "CSE301.01", "api-slides"),
    ).toBeUndefined();
  });
  it("requires all three content types and M3 with no pending request", () => {
    const state = fresh();
    expect(canComplete(state, "cs204", "CSE204.01")).toBe(true);
    expect(canComplete(state, "cs301", "CSE301.01")).toBe(false);
    expect(
      canComplete(
        { ...state, items: state.items.filter((i) => i.id !== "db-quiz") },
        "cs204",
        "CSE204.01",
      ),
    ).toBe(false);
    expect(() => completeClass(state, "cs301", "CSE301.01")).toThrow();
  });
  it("protects read-only material on direct edit and preserves the source", () => {
    const state = fresh(),
      item = state.items.find((i) => i.id === "api2-slides")!;
    expect(() =>
      saveMaterial(state, { ...item, body: "Replaced" }, true),
    ).toThrow(/quyền/);
    expect(findItem(state, "cs301", "CSE301.02", item.id)?.body).toBe(
      item.body,
    );
  });
  it("round-trips a request through the owning lecturer and requires re-review", () => {
    let state = requestChange(
      fresh(),
      "cs301",
      "CSE301.01",
      "api-slides",
      "Bổ sung ví dụ PATCH",
      "request-new",
    );
    expect(findItem(state, "cs301", "CSE301.01", "api-slides")?.level).toBe(2);
    expect(() =>
      reviewItem(state, "cs301", "CSE301.01", "api-slides", 3),
    ).toThrow(/phản hồi/);
    expect(() =>
      replyToRequest(state, "request-new", "GV999", "Đã sửa", "Nội dung mới"),
    ).toThrow(/quyền/);
    state = replyToRequest(
      state,
      "request-new",
      "GV001",
      "Đã thêm ví dụ",
      "Nội dung PATCH đã bổ sung",
    );
    expect(findItem(state, "cs301", "CSE301.01", "api-slides")?.level).toBe(1);
    state = reviewItem(state, "cs301", "CSE301.01", "api-slides", 3);
    expect(state.requests.find((r) => r.id === "request-new")?.closed).toBe(
      true,
    );
  });
  it("invalidates completion on content creation, editing and a new request", () => {
    let state = completeClass(fresh(), "cs204", "CSE204.01");
    expect(state.completed).toContain("CSE204.01");
    const item = state.items.find((i) => i.id === "db-slides")!;
    state = saveMaterial(state, { ...item, body: "Nội dung mới" }, true);
    expect(state.completed).not.toContain("CSE204.01");
    expect(state.items.find((i) => i.id === item.id)?.level).toBe(1);
    const approved = completeClass(fresh(), "cs204", "CSE204.01");
    expect(
      requestChange(
        approved,
        "cs204",
        "CSE204.01",
        "db-slides",
        "Cần thêm ví dụ",
        "r2",
      ).completed,
    ).toEqual([]);
    expect(
      saveMaterial(approved, { ...item, id: "new-slide" }, false).completed,
    ).toEqual([]);
  });
  it("allows a follow-up after a reply without approving the material", () => {
    let state=requestChange(fresh(),"cs301","CSE301.01","api-slides","Thêm PATCH","round-one");
    state=replyToRequest(state,"round-one","GV001","Đã sửa lần một","Ví dụ PATCH");
    state=requestChange(state,"cs301","CSE301.01","api-slides","Cần thêm mã lỗi","round-two");
    expect(state.requests.find(r=>r.id==="round-one")).toMatchObject({closed:true,reply:"Đã sửa lần một"});
    expect(state.requests.find(r=>r.id==="round-two")).toMatchObject({closed:false,reply:"",body:"Cần thêm mã lỗi"});
    expect(findItem(state,"cs301","CSE301.01","api-slides")?.level).toBe(2);
    expect(()=>reviewItem(state,"cs301","CSE301.01","api-slides",3)).toThrow(/phản hồi/);
  });
  it("rejects empty changes, invalid review levels and an open duplicate request", () => {
    const state = fresh();
    expect(() =>
      requestChange(state, "cs301", "CSE301.01", "api-slides", " ", "r"),
    ).toThrow();
    expect(() =>
      requestChange(state, "cs301", "CSE301.01", "api-assignment", "More", "r"),
    ).toThrow();
    expect(() =>
      reviewItem(state, "cs301", "CSE301.01", "api-slides", 8),
    ).toThrow();
  });
  it("permits https/http and local material references, rejects executable URLs", () => {
    expect(safeReferenceUrl("https://example.edu/a.pdf")).toBe(true);
    expect(safeReferenceUrl("/materials/demo-lesson.pdf")).toBe(true);
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,a",
      "//example.edu",
      "/dang-nhap",
    ])
      expect(safeReferenceUrl(url)).toBe(false);
  });
});
