import { slideTitles } from "./fixtures";
import type { DemoData, Lesson, Question, Resource } from "./fixtures";

/** Rows saved before lessons were tracked belong to the demo lesson, as on the server (TeachingScope). */
export const DEFAULT_LESSON = "l2";
export const lessonOf = (row: { lessonId?: string }) => row.lessonId || DEFAULT_LESSON;

export const questionsOf = (questions: Question[], lessonId: string) =>
  questions.filter((q) => lessonOf(q) === lessonId);

/** Slide titles of a lesson; the demo lesson falls back to its built-in four pages. */
export function pagesOf(lesson: Lesson | undefined) {
  if (lesson?.slides?.length) return lesson.slides;
  return !lesson || lesson.id === DEFAULT_LESSON ? slideTitles : [];
}

export const lessonTitle = (data: DemoData, lessonId: string) =>
  data.lessons.find((l) => l.id === lessonId)?.title ?? lessonId;

/** Lecturer-chosen order, then title, matching GET /api/resources; unordered legacy rows come first. */
export const sortedResources = (items: Resource[]) =>
  [...items].sort(
    (a, b) =>
      (a.position ?? 0) - (b.position ?? 0) ||
      a.title.localeCompare(b.title, "vi"),
  );

/** Swaps an item with its neighbour and renumbers positions 1..n, so only changed rows are synced. */
export function moveResource(items: Resource[], id: string, delta: -1 | 1) {
  const list = sortedResources(items);
  const i = list.findIndex((r) => r.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return items;
  [list[i], list[j]] = [list[j], list[i]];
  return list.map((r, k) => (r.position === k + 1 ? r : { ...r, position: k + 1 }));
}

const YOUTUBE = /^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{6,}/;
export const isYouTube = (url: string) => YOUTUBE.test(url.trim());

/** A slide may have several quizzes; never hide all but its first question. */
export function pageQuiz(questions: Question[], lessonId: string, page: number,
  answers: Record<string, number>, chosen?: string) {
  const items = questions.filter(q => lessonOf(q) === lessonId && q.page === page && q.approved);
  return {
    items,
    current: items.find(q => q.id === chosen) ?? items.find(q => answers[q.id] === undefined) ?? items[0],
    complete: items.every(q => answers[q.id] !== undefined),
  };
}
