import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Download,
  FileText,
  Link2,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import type { Resource } from "../data/fixtures";
import { isYouTube, moveResource, sortedResources } from "../data/content";
import { RESOURCE_FILE_TYPES, downloadResource, isUploaded, uploadResource } from "../api/resources";
import { Badge, Button, Dialog, Empty, Field, PageHeader, Panel, SearchField } from "./UI";

const KIND_LABEL: Record<Resource["kind"], string> = {
  link: "Liên kết",
  video: "Video",
  pdf: "PDF",
  file: "Tệp",
};
const MAX_MB = 50;

/** UC-A04 (giảng viên: thêm, sửa, sắp xếp, xóa) và UC-B08 (sinh viên: xem, tải). */
export function TaiLieu({ teacher = false }: { teacher?: boolean }) {
  const { data, setData, notify, reload } = useDemo();
  const [search, setSearch] = useState(""),
    [mode, setMode] = useState<"link" | "file" | null>(null),
    [edit, setEdit] = useState<Resource | null>(null),
    [busy, setBusy] = useState(false);
  const all = sortedResources(data.resources);
  const items = all.filter((r) =>
    `${r.title} ${r.description}`.toLowerCase().includes(search.toLowerCase()),
  );

  async function open(r: Resource) {
    if (!isUploaded(r)) {
      window.open(r.url, "_blank", "noreferrer");
      return;
    }
    try {
      await downloadResource(r);
    } catch (e) {
      notify((e as Error).message);
    }
  }

  async function submitFile(form: FormData) {
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) {
      notify("Chọn tệp tài liệu.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      notify(`Tệp tối đa ${MAX_MB} MB.`);
      return;
    }
    setBusy(true);
    try {
      await uploadResource(file, String(form.get("title") || ""), String(form.get("description") || ""));
      // The server created the row; reloading avoids the sync layer posting it a second time.
      await reload();
      setMode(null);
      notify("Đã tải tài liệu lên.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function submitLink(form: FormData) {
    const url = String(form.get("url")).trim();
    const video = form.get("kind") === "video";
    if (!/^https?:\/\/\S+$/.test(url)) {
      notify("Vui lòng nhập liên kết bắt đầu bằng https:// hoặc http://.");
      return;
    }
    if (video && !isYouTube(url)) {
      notify("Video phải là liên kết YouTube.");
      return;
    }
    setData((d) => ({
      ...d,
      resources: [
        ...d.resources,
        {
          id: crypto.randomUUID(),
          title: String(form.get("title")).trim(),
          description: String(form.get("description") || "").trim(),
          url,
          kind: video ? "video" : "link",
          position: Math.max(0, ...d.resources.map((r) => r.position ?? 0)) + 1,
        },
      ],
    }));
    setMode(null);
  }

  return (
    <>
      <PageHeader
        title="Tài liệu tham khảo"
        description="Nguồn học liệu bổ sung, tập trung theo học phần."
        action={
          teacher && (
            <div className="row-actions">
              <Button variant="secondary" onClick={() => setMode("link")}>
                <Link2 size={17} />
                Thêm liên kết
              </Button>
              <Button onClick={() => setMode("file")}>
                <Plus size={17} />
                Tải tệp lên
              </Button>
            </div>
          )
        }
      />
      <div className="toolbar">
        <Badge>{all.length} tài liệu</Badge>
        <SearchField value={search} onChange={setSearch} placeholder="Tìm tài liệu…" />
      </div>
      <Panel>
        {items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tài liệu</th>
                  <th>Loại</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const index = all.findIndex((x) => x.id === r.id);
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="table-title">
                          <span className="task-icon">
                            {r.kind === "video" ? <Video size={20} /> : <FileText size={20} />}
                          </span>
                          <div>
                            <strong>{r.title}</strong>
                            <p>
                              {r.description}
                              {r.fileName && (
                                <small className="muted">
                                  {" "}
                                  · {r.fileName}
                                  {r.fileSize ? ` · ${Math.max(1, Math.round(r.fileSize / 1024))} KB` : ""}
                                </small>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge>{KIND_LABEL[r.kind] ?? r.kind}</Badge>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Button variant="secondary small" onClick={() => open(r)}>
                            {isUploaded(r) ? "Tải xuống" : "Mở"}
                            {isUploaded(r) ? <Download size={15} /> : <ArrowUpRight size={15} />}
                          </Button>
                          {teacher && (
                            <>
                              <button
                                className="icon-button"
                                aria-label={`Đưa ${r.title} lên`}
                                disabled={index === 0 || Boolean(search)}
                                onClick={() => setData((d) => ({ ...d, resources: moveResource(d.resources, r.id, -1) }))}
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button
                                className="icon-button"
                                aria-label={`Đưa ${r.title} xuống`}
                                disabled={index === all.length - 1 || Boolean(search)}
                                onClick={() => setData((d) => ({ ...d, resources: moveResource(d.resources, r.id, 1) }))}
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button className="icon-button" aria-label={`Sửa ${r.title}`} onClick={() => setEdit(r)}>
                                <Pencil size={16} />
                              </button>
                              <button
                                className="icon-button danger"
                                aria-label={`Xóa ${r.title}`}
                                onClick={() => {
                                  if (!window.confirm(`Xóa tài liệu “${r.title}”?`)) return;
                                  setData((d) => ({ ...d, resources: d.resources.filter((x) => x.id !== r.id) }));
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={all.length ? "Không tìm thấy tài liệu" : "Chưa có tài liệu tham khảo"}
            description={all.length ? "Hãy thử từ khóa khác." : "Giảng viên chưa thêm tài liệu cho học phần."}
          />
        )}
      </Panel>
      {mode === "link" && (
        <Dialog title="Thêm liên kết tham khảo" onClose={() => setMode(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitLink(new FormData(e.currentTarget));
            }}
          >
            <Field label="Tên tài liệu">
              <input name="title" required maxLength={200} />
            </Field>
            <Field label="Mô tả ngắn">
              <input name="description" maxLength={500} />
            </Field>
            <Field label="Loại">
              <select name="kind" defaultValue="link">
                <option value="link">Liên kết</option>
                <option value="video">Video YouTube</option>
              </select>
            </Field>
            <Field label="Liên kết">
              <input name="url" type="url" required placeholder="https://…" />
            </Field>
            <Button>Thêm tài liệu</Button>
          </form>
        </Dialog>
      )}
      {mode === "file" && (
        <Dialog title="Tải tệp tham khảo" onClose={() => setMode(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitFile(new FormData(e.currentTarget));
            }}
          >
            <Field label="Tên tài liệu" hint="Để trống sẽ dùng tên tệp.">
              <input name="title" maxLength={200} />
            </Field>
            <Field label="Mô tả ngắn">
              <input name="description" maxLength={500} />
            </Field>
            <Field label="Tệp" hint={`PDF, Word, PowerPoint, Excel, ảnh, TXT hoặc ZIP · tối đa ${MAX_MB} MB`}>
              <input name="file" type="file" required accept={RESOURCE_FILE_TYPES} />
            </Field>
            <Button disabled={busy}>{busy ? "Đang tải lên…" : "Tải lên"}</Button>
          </form>
        </Dialog>
      )}
      {edit && (
        <Dialog title="Sửa tài liệu" onClose={() => setEdit(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const url = isUploaded(edit) ? edit.url : String(f.get("url")).trim();
              if (!isUploaded(edit) && !/^(https?:\/\/\S+|\/[\w./-]+)$/.test(url)) {
                notify("Vui lòng nhập liên kết bắt đầu bằng https:// hoặc http://.");
                return;
              }
              if (edit.kind === "video" && !isYouTube(url)) {
                notify("Video phải là liên kết YouTube.");
                return;
              }
              const next = {
                ...edit,
                title: String(f.get("title")).trim(),
                description: String(f.get("description") || "").trim(),
                url,
              };
              setData((d) => ({ ...d, resources: d.resources.map((r) => (r.id === edit.id ? next : r)) }));
              setEdit(null);
            }}
          >
            <Field label="Tên tài liệu">
              <input name="title" required maxLength={200} defaultValue={edit.title} />
            </Field>
            <Field label="Mô tả ngắn">
              <input name="description" maxLength={500} defaultValue={edit.description} />
            </Field>
            {isUploaded(edit) ? (
              <p className="muted">Tệp: {edit.fileName}. Muốn thay tệp, hãy xóa rồi tải tệp mới.</p>
            ) : (
              <Field label="Liên kết">
                <input name="url" required defaultValue={edit.url} />
              </Field>
            )}
            <Button>Lưu</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
