import { useState } from "react";
import { Button, Field, PageHeader, Panel, Empty } from "../shared/UI";
import { safeReferenceUrl } from "./model";
import { CourseFilter, MissingScope, useLeaderScope } from "./UI";
function ResourceList() {
  const { state, courseId, act } = useLeaderScope();
  const [editing, setEditing] = useState<string | null>(null),
    [error, setError] = useState("");
  const rows = state.references.filter((r) => r.courseId === courseId),
    item = rows.find((r) => r.id === editing);
  return (
    <>
      <Panel title="Tài liệu trong học phần">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tên tài liệu</th>
                <th>Loại</th>
                <th>Đường dẫn</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.url.endsWith(".pdf") ? "PDF" : "Liên kết"}</td>
                  <td>
                    {safeReferenceUrl(r.url) ? (
                      <a
                        className="text-link"
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở tài liệu
                      </a>
                    ) : (
                      <span>Đường dẫn không hợp lệ</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => {
                        setEditing(r.id);
                        setError("");
                      }}
                    >
                      Chỉnh sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <Empty title="Chưa có tài liệu trong học phần" />}
      </Panel>
      <Panel title={item ? "Chỉnh sửa tài liệu" : "Thêm tài liệu"}>
        <form
          key={editing || "new"}
          className="leader-form leader-resource-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              title = String(f.get("title")).trim(),
              url = String(f.get("url")).trim();
            if (!title || !safeReferenceUrl(url)) {
              setError(
                "Nhập tên tài liệu và URL http/https hoặc đường dẫn /materials/ hợp lệ.",
              );
              return;
            }
            const reference = {
              id: item?.id || crypto.randomUUID(),
              courseId,
              title,
              url,
            };
            if (
              act(
                (s) => ({
                  ...s,
                  references: item
                    ? s.references.map((r) =>
                        r.id === item.id ? reference : r,
                      )
                    : [...s.references, reference],
                }),
                "Đã lưu tài liệu của học phần.",
              )
            ) {
              setEditing(null);
              setError("");
              e.currentTarget.reset();
            }
          }}
        >
          <Field label="Tên tài liệu">
            <input
              name="title"
              required
              maxLength={160}
              defaultValue={item?.title || ""}
            />
          </Field>
          <Field label="Đường dẫn">
            <input
              name="url"
              required
              defaultValue={item?.url || ""}
              placeholder="https://… hoặc /materials/…"
            />
          </Field>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <div className="row-actions">
            <Button variant="secondary">Lưu tài liệu</Button>
            {item && (
              <Button
                variant="secondary"
                type="button"
                onClick={() => setEditing(null)}
              >
                Hủy chỉnh sửa
              </Button>
            )}
          </div>
        </form>
      </Panel>
    </>
  );
}
export function LeaderResources() {
  const { courseId, course } = useLeaderScope();
  return (
    <>
      <PageHeader
        title="Tài liệu tham khảo"
        description="Quản lý tài liệu và đường dẫn của học phần được phân công."
      />
      <CourseFilter />
      {course ? <ResourceList key={courseId} /> : <MissingScope />}
    </>
  );
}
