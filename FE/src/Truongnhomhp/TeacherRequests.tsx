import { useState } from "react";
import { useDemo } from "../data/DemoProvider";
import { useAccount } from "../shared/AccountProvider";
import { Button, Field, Panel } from "../shared/UI";
import { allClassesScope, classLabel } from "../data/scope";
import { replyToRequest } from "./model";
export function TeacherAdjustmentRequests() {
  const { data, setData, notify } = useDemo();
  const { account } = useAccount();
  const [editing, setEditing] = useState<string | null>(null);
  // Who teaches a class comes from the admin registry, so a newly assigned lecturer sees the request.
  const scope = allClassesScope(data);
  const rows = data.coordination.requests
    .map((r) => ({
      r,
      item: data.coordination.items.find((i) => i.id === r.itemId),
    }))
    .filter(
      ({ r, item }) =>
        !r.closed &&
        item &&
        scope.classes.find((c) => c.id === item.classId)?.teacherId === account?.id,
    );
  if (!rows.length) return null;
  return (
    <Panel title="Yêu cầu từ Trưởng nhóm HP">
      {rows.map(({ r, item }) => (
        <div className="leader-teacher-request" key={r.id}>
          <strong>
            {classLabel(data, item!.classId)} · {item!.title}
          </strong>
          <p>{r.body}</p>
          {r.reply && (
            <p className="muted">
              Đã phản hồi: {r.reply} · Chờ Trưởng nhóm HP rà soát.
            </p>
          )}
          {editing !== r.id ? (
            <Button variant="secondary small" onClick={() => setEditing(r.id)}>
              Chỉnh sửa và phản hồi
            </Button>
          ) : (
            <form
              className="leader-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                try {
                  const next = replyToRequest(
                    data.coordination,
                    r.id,
                    account!.id,
                    String(f.get("reply")),
                    String(f.get("body")),
                    scope,
                  );
                  setData((d) => ({
                    ...d,
                    coordination: next,
                    readLeaderNotices: false,
                  }));
                  setEditing(null);
                  notify(
                    "Đã cập nhật học liệu và gửi phản hồi để rà soát lại.",
                  );
                } catch (error) {
                  notify((error as Error).message);
                }
              }}
            >
              <Field label="Nội dung học liệu sau chỉnh sửa">
                <textarea
                  name="body"
                  required
                  rows={8}
                  defaultValue={item!.body}
                />
              </Field>
              <Field label="Phản hồi điều chỉnh">
                <textarea
                  name="reply"
                  required
                  rows={3}
                  defaultValue={r.reply}
                />
              </Field>
              <div className="row-actions">
                <Button variant="secondary">Gửi phản hồi</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(null)}
                >
                  Hủy
                </Button>
              </div>
            </form>
          )}
        </div>
      ))}
    </Panel>
  );
}
