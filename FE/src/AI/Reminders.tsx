import { useState } from "react";
import { PageHeader, Panel, Field, Button, Empty, Badge } from "../shared/UI";
import { useDemo } from "../data/DemoProvider";
import { reminderEmail } from "./model";
import type { DeadlineCandidate, ReminderRecord } from "./model";
import { reminderCandidates, scanReminders } from "../api/learning";

const inputNow = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
const statusLabel: Record<ReminderRecord["status"], [string, "green" | "amber" | "red"]> = {
  recorded: ["Đã ghi nhận", "green"],
  sent: ["Đã gửi email", "green"],
  skipped: ["Chưa cấu hình SMTP", "amber"],
  failed: ["Gửi lỗi · Sẽ thử lại", "red"],
};
export function AIReminders() {
  const { data, notify, reload } = useDemo();
  const [at, setAt] = useState(inputNow),
    [candidates, setCandidates] = useState<DeadlineCandidate[] | null>(null),
    [selected, setSelected] = useState<DeadlineCandidate | null>(null),
    [tab, setTab] = useState("queue"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function scan() {
    try {
      const rows = await reminderCandidates(at);
      setCandidates(rows);
      setSelected(rows[0] || null);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function send() {
    setBusy(true);
    try {
      const added = await scanReminders(at);
      const emails = added.filter((r) => r.channel === "email");
      notify(
        added.length
          ? `Đã xử lý ${added.length} nhắc hạn; gửi được ${emails.filter((r) => r.status === "sent").length}/${emails.length} email.`
          : "Các mục này đã được nhắc; không tạo bản ghi trùng.",
      );
      await reload();
      setTab("history");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Nhắc hạn học tập"
        description="Máy chủ tự quét mỗi giờ và nhắc công việc đến hạn trong 24 giờ."
      />
      <div className="tabs">
        <button
          className={tab === "queue" ? "selected" : ""}
          onClick={() => setTab("queue")}
        >
          Hàng đợi nhắc hạn
        </button>
        <button
          className={tab === "history" ? "selected" : ""}
          onClick={() => setTab("history")}
        >
          Nhật ký nhắc hạn
        </button>
      </div>
      {tab === "queue" ? (
        <>
          <Panel title="Thời điểm kiểm tra">
            <div className="admin-form">
              <Field label="Thời điểm kiểm tra">
                <input
                  aria-label="Thời điểm kiểm tra"
                  type="datetime-local"
                  value={at}
                  onChange={(e) => {
                    setAt(e.target.value);
                    setCandidates(null);
                    setSelected(null);
                  }}
                />
              </Field>
              <p className="muted">
                Chọn một mốc để xem trước hàng đợi của mọi lớp. Lịch tự động
                luôn dùng thời điểm hiện tại.
              </p>
              <Button onClick={scan}>Quét hạn trong 24 giờ</Button>
              {error && (
                <p role="alert" className="error-text">
                  {error}
                </p>
              )}
            </div>
          </Panel>
          {candidates !== null &&
            (candidates.length ? (
              <>
                <Panel title={`Danh sách cần nhắc · ${candidates.length}`}>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Sinh viên / Lớp</th>
                          <th>Nội dung</th>
                          <th>Hạn nộp</th>
                          <th>Tiến độ</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.map((c) => (
                          <tr key={c.key}>
                            <td>
                              <strong>{c.studentName}</strong>
                              <small className="admin-line">
                                {c.className}
                              </small>
                            </td>
                            <td>{c.title}</td>
                            <td>{new Date(c.due).toLocaleString("vi-VN")}</td>
                            <td>{c.progress}</td>
                            <td>
                              <Button
                                variant="secondary small"
                                onClick={() => setSelected(c)}
                              >
                                Xem email
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button disabled={busy} onClick={send}>
                    Gửi nhắc ngay
                  </Button>
                </Panel>
                {selected && (
                  <Panel title="Xem trước email">
                    <p>
                      <strong>Người nhận:</strong> {selected.email}
                    </p>
                    <p>
                      <strong>Tiêu đề:</strong>{" "}
                      {reminderEmail(selected).subject}
                    </p>
                    <div className="reminder-preview">
                      {reminderEmail(selected).body}
                    </div>
                  </Panel>
                )}
              </>
            ) : (
              <Empty
                title="Không có công việc cần nhắc trong 24 giờ"
                description="Các công việc đã hoàn thành, quá hạn hoặc còn hơn 24 giờ không nằm trong hàng đợi."
              />
            ))}
        </>
      ) : (
        <Panel title="Lịch sử nhắc hạn">
          {data.aiReminders.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Người nhận</th>
                    <th>Bài / Lớp</th>
                    <th>Kênh</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.aiReminders].reverse().map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.createdAt).toLocaleString("vi-VN")}</td>
                      <td>{r.candidate.studentId}</td>
                      <td>
                        {r.candidate.title}
                        <small className="admin-line">
                          {r.candidate.className}
                        </small>
                      </td>
                      <td>
                        {r.channel === "email" ? "Email" : "Trong hệ thống"}
                      </td>
                      <td>
                        <Badge tone={statusLabel[r.status][1]}>
                          {statusLabel[r.status][0]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Chưa có bản ghi nhắc hạn"
              description="Quét hạn và gửi nhắc để tạo nhật ký."
            />
          )}
        </Panel>
      )}
    </>
  );
}
