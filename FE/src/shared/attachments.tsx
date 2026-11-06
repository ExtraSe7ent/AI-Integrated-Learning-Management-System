import { useEffect, useState } from "react";
import { api, getToken } from "../api/client";
async function openFiles() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("vju-feedback-files", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(Error("Không mở được bộ nhớ ảnh trên trình duyệt."));
  });
}
/** UC-E01: evidence images go to the server (encrypted there), so the lecturer sees them from any device. */
export async function storeImages(files: File[]) {
  if (!files.length) return [];
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  return api<string[]>("/api/feedback-images", { method: "POST", form });
}

/** Images saved by the earlier, browser-only version stay readable in the browser that stored them. */
async function legacyImage(id: string) {
  const db = await openFiles();
  try {
    return await new Promise<Blob | undefined>((resolve, reject) => {
      const r = db.transaction("files").objectStore("files").get(id);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}

async function loadImage(id: string): Promise<Blob | undefined> {
  const response = await fetch(`/api/feedback-images/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
  }).catch(() => undefined);
  if (response?.ok) return response.blob();
  return legacyImage(id).catch(() => undefined);
}
export function FeedbackImages({
  ids,
  names,
}: {
  ids: string[];
  names: string[];
}) {
  const [items, setItems] = useState<
      { id: string; url: string; name: string }[]
    >([]),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    void (async () => {
      {
        const values = await Promise.all(ids.map(loadImage));
        const rows = values.flatMap((blob, i) => {
          if (!blob) return [];
          const url = URL.createObjectURL(blob);
          urls.push(url);
          return [{ id: ids[i], url, name: names[i] || "Ảnh đính kèm" }];
        });
        if (active) {
          setItems(rows);
          if (rows.length < ids.length) setError("Không tải được một số ảnh đính kèm.");
        }
      }
    })().catch(() => {
      if (active) setError("Không tải được ảnh đính kèm.");
    });
    return () => {
      active = false;
      urls.forEach(URL.revokeObjectURL);
    };
  }, [ids, names]);
  return (
    <div className="feedback-images">
      {items.map((item) => (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
          <img src={item.url} alt={item.name} />
          <span>{item.name}</span>
        </a>
      ))}
      {error && <p role="status">{error}</p>}
    </div>
  );
}
