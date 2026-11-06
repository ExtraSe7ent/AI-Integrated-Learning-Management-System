import { ApiError, api, getToken } from "./client";

/**
 * Stores the lesson PDF encrypted on the server for the lesson's class, publishes it and queues RAG indexing.
 * A lesson that already has a PDF gets a new version of the same material, so the AI never reads two copies.
 */
export async function uploadLessonPdf(
  file: File,
  title: string,
  classId: string,
  week?: number,
  materialId?: string,
): Promise<{ id: string; name: string }> {
  const form = new FormData();
  form.append("file", file);
  let id = materialId;
  if (id) {
    try {
      await api(`/api/materials/${id}/versions`, { method: "POST", form });
    } catch (e) {
      // The old material may have been deleted; start a new one then.
      if (!(e instanceof ApiError) || e.status !== 404) throw e;
      id = undefined;
    }
  }
  if (!id) {
    form.append("classId", classId);
    form.append("title", title);
    if (week) form.append("weekNumber", String(week));
    id = (await api<{ id: string }>("/api/materials", { method: "POST", form })).id;
  }
  await api(`/api/materials/${id}/publish`, { method: "POST" });
  await api(`/api/materials/${id}/index`, { method: "POST" });
  return { id, name: file.name };
}

/** The file needs the login token, so a plain link or iframe cannot open it; fetch it into a local URL. */
export async function materialFileUrl(materialId: string) {
  const response = await fetch(`/api/materials/${materialId}/file`, {
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
  });
  if (!response.ok) throw new ApiError(response.status, "Không tải được tệp PDF bài giảng.");
  return URL.createObjectURL(await response.blob());
}
