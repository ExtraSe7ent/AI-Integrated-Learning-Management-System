import { ApiError, api, getToken } from "./client";
import type { Resource } from "../data/fixtures";

export const RESOURCE_FILE_TYPES = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg";

/** UC-A04: the server encrypts and stores the file, then lists it like any other reference. */
export function uploadResource(file: File, title: string, description: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("title", title);
  form.append("description", description);
  return api<Resource>("/api/resources/upload", { method: "POST", form });
}

/** Uploaded files need the login token, so a plain link cannot open them; download through fetch instead. */
export async function downloadResource(resource: Resource) {
  const response = await fetch(resource.url, {
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
  });
  if (!response.ok) throw new ApiError(response.status, "Không tải được tệp tài liệu.");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = resource.fileName || resource.title;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export const isUploaded = (r: Resource) => r.url.startsWith("/api/resources/");
