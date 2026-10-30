import { useEffect, useState } from "react";
async function openFiles() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("vju-feedback-files", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(Error("Không mở được bộ nhớ ảnh trên trình duyệt."));
  });
}
export async function storeImages(files: File[]) {
  if (!files.length) return [];
  const db = await openFiles();
  const ids = files.map(() => crypto.randomUUID());
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      files.forEach((file, i) => tx.objectStore("files").put(file, ids[i]));
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(
          Error("Không lưu được ảnh. Kiểm tra bộ nhớ trình duyệt rồi thử lại."),
        );
      tx.onabort = tx.onerror;
    });
    return ids;
  } finally {
    db.close();
  }
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
      const db = await openFiles();
      try {
        const values = await Promise.all(
          ids.map(
            (id) =>
              new Promise<Blob | undefined>((resolve, reject) => {
                const r = db.transaction("files").objectStore("files").get(id);
                r.onsuccess = () => resolve(r.result);
                r.onerror = () => reject(r.error);
              }),
          ),
        );
        const rows = values.flatMap((blob, i) => {
          if (!blob) return [];
          const url = URL.createObjectURL(blob);
          urls.push(url);
          return [{ id: ids[i], url, name: names[i] || "Ảnh đính kèm" }];
        });
        if (active) {
          setItems(rows);
          if (rows.length < ids.length)
            setError("Một số ảnh không còn trong bộ nhớ trình duyệt.");
        }
      } finally {
        db.close();
      }
    })().catch(() => {
      if (active) setError("Không đọc được ảnh trên trình duyệt này.");
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
