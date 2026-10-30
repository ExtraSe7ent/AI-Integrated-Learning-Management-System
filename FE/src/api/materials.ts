import { api } from "./client";

const LESSON_CLASS = "CSE301.01";

/** Stores the PDF encrypted on the server, publishes it and queues RAG indexing. */
export async function uploadLessonPdf(file: File, title: string) {
  const form = new FormData();
  form.append("classId", LESSON_CLASS);
  form.append("title", title);
  form.append("file", file);
  const { id } = await api<{ id: string }>("/api/materials", {
    method: "POST",
    form,
  });
  await api(`/api/materials/${id}/publish`, { method: "POST" });
  await api(`/api/materials/${id}/index`, { method: "POST" });
}
