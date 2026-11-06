import { api } from "./client";

/** Flipped-classroom AI tools. Drafts stay hidden from students until a lecturer publishes them. */

export interface Explanation {
  id: string;
  courseId: string;
  page: number;
  content: string;
  published: boolean;
  edited: boolean;
  updatedAt: string;
}
export interface InsightTheme {
  title: string;
  pages: number[];
  explanation: string;
}
export interface Insights {
  mode: "ai" | "rules";
  summary: string;
  themes: InsightTheme[];
  discussion: { question: string; why: string; pages: number[] }[];
  activities: string[];
}
export interface MistakeExplanation {
  answer: string;
  pages: number[];
  mode: "ai" | "extractive";
}
export type AidKind = "card" | "faq";
export interface ReviewState {
  repetitions: number;
  intervalDays: number;
  dueAt: string;
  due: boolean;
}
export interface Aid {
  id: string;
  courseId: string;
  kind: AidKind;
  front: string;
  back: string;
  topic?: string;
  page?: number;
  published: boolean;
  origin: "ai" | "manual";
  review?: ReviewState;
}

const id = encodeURIComponent;
const lesson = (courseId: string) => `/api/ai/lessons/${id(courseId)}/explanations`;

export const explanationsOf = (courseId: string) => api<Explanation[]>(lesson(courseId));
export const generateExplanations = (
  courseId: string,
  body: { pages?: number[]; overwriteEdited?: boolean } = {},
) => api<Explanation[]>(`${lesson(courseId)}/generate`, { method: "POST", body });
export const saveExplanation = (
  courseId: string,
  page: number,
  body: { content?: string; published?: boolean },
) => api<Explanation>(`${lesson(courseId)}/${page}`, { method: "PUT", body });

export const classInsights = (courseId: string) =>
  api<Insights>("/api/ai/insights", { method: "POST", body: { courseId } });

export const explainMistake = (assignmentId: string, questionIndex: number, courseId = "cs301") =>
  api<MistakeExplanation>("/api/ai/mistake-explanation", {
    method: "POST",
    body: { courseId, assignmentId, questionIndex },
  });

export const aidsOf = (courseId: string, kind?: AidKind) =>
  api<Aid[]>(`/api/ai/aids?courseId=${id(courseId)}${kind ? `&kind=${kind}` : ""}`);
export const generateAids = (courseId: string, kind: AidKind) =>
  api<Aid[]>("/api/ai/aids/generate", { method: "POST", body: { courseId, kind } });
export const createAid = (body: {
  courseId: string;
  kind: AidKind;
  front: string;
  back: string;
  topic?: string;
  page?: number;
}) => api<Aid>("/api/ai/aids", { method: "POST", body });
export const updateAid = (
  aidId: string,
  body: { front?: string; back?: string; topic?: string; published?: boolean },
) => api<Aid>(`/api/ai/aids/${id(aidId)}`, { method: "PUT", body });
export const deleteAid = (aidId: string) =>
  api<void>(`/api/ai/aids/${id(aidId)}`, { method: "DELETE" });
export const reviewCard = (aidId: string, remembered: boolean) =>
  api<ReviewState>(`/api/ai/aids/${id(aidId)}/review`, {
    method: "POST",
    body: { remembered },
  });

/** Cards a student should review now: never reviewed, or due again. */
export const dueCards = (aids: Aid[]) =>
  aids.filter((a) => a.kind === "card" && (!a.review || a.review.due));

/** "Ý chính\n…\n\nVí dụ\n…" → headed sections, for rendering an explanation. */
export function explanationSections(content: string) {
  return content
    .split(/\n\s*\n/)
    .map((block) => {
      const [first, ...rest] = block.split("\n");
      const headed = ["Ý chính", "Ví dụ", "Tóm tắt"].includes(first.trim());
      return headed
        ? { heading: first.trim(), text: rest.join("\n").trim() }
        : { heading: "", text: block.trim() };
    })
    .filter((s) => s.text);
}
