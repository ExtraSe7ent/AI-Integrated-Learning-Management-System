import { it, expect } from "vitest";
import { isYouTube, lessonOf, moveResource, pagesOf, questionsOf, sortedResources } from "./content";
import type { Question, Resource } from "./fixtures";

const q = (id: string, lessonId?: string) =>
  ({ id, text: "?", options: ["A", "B", "C", "D"], correct: 0, explanation: "", page: 1, approved: true, lessonId }) as Question;
const r = (id: string, title: string, position?: number) =>
  ({ id, title, description: "", url: "https://a.b", kind: "link", position }) as Resource;

it("assigns rows without a lesson to the demo lesson, like the server", () => {
  expect(lessonOf({})).toBe("l2");
  expect(questionsOf([q("a"), q("b", "l3"), q("c", "l2")], "l2").map((x) => x.id)).toEqual(["a", "c"]);
});

it("counts pages from the lesson's own slides", () => {
  expect(pagesOf({ id: "l9", title: "", order: 1, published: false, activity: false, slides: ["1", "2"] })).toHaveLength(2);
  expect(pagesOf({ id: "l9", title: "", order: 1, published: false, activity: false })).toHaveLength(0);
  expect(pagesOf(undefined).length).toBeGreaterThan(0);
});

it("orders resources and renumbers only what moved", () => {
  const items = [r("x", "B", 2), r("y", "A", 1), r("z", "C")];
  expect(sortedResources(items).map((i) => i.id)).toEqual(["z", "y", "x"]);
  const moved = moveResource(items, "x", -1);
  expect(sortedResources(moved).map((i) => i.id)).toEqual(["z", "x", "y"]);
  expect(moved.find((i) => i.id === "z")).not.toBe(items[2]);
  expect(moveResource(items, "z", -1)).toBe(items);
});

it("accepts only YouTube video links", () => {
  expect(isYouTube("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
  expect(isYouTube("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
  expect(isYouTube("https://vimeo.com/123")).toBe(false);
});
