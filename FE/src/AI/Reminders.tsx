import { useState } from "react";
import { PageHeader, Panel, Field, Button, Empty, Badge } from "../shared/UI";
import { useDemo } from "../data/DemoProvider";
import { deadlineCandidates, reminderEmail, reminderRecords } from "./model";
import type { DeadlineCandidate } from "./model";
const inputNow = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export function AIReminders() {
  const { data, setData, notify } = useDemo();
  const [at, setAt] = useState(inputNow),
    [candidates, setCandidates] = useState<DeadlineCandidate[] | null>(null),
    [selected, setSelected] = useState<DeadlineCandidate | null>(null),
    [tab, setTab] = useState("queue"),
    [error, setError] = useState(""),
    [scannedAt, setScannedAt] = useState<number | null>(null);
  function scan() {
    const now = Date.parse(at);
    if (!Number.isFinite(now)) {
      setError("Chọn thời điểm kiểm tra hợp lệ.");
      return;
    }
    const rows = deadlineCandidates(data, now);
    setCandidates(rows);
    setSelected(rows[0] || null);
    setScannedAt(now);
    setError("");
  }
  function record() {
    if (!candidates || scannedAt === null) return;
    const current = deadlineCandidates(data, scannedAt);
    const next = reminderRecords(data.aiReminders, current, Date.now());
    const added = next.slice(data.aiReminders.length),
      notices = added
        .filter(
          (r) => r.channel === "in-app" && r.candidate.studentId === "23110149",
        )
        .map(
          (r) =>
            `${r.candidate.title} · ${r.candidate.className} sắp đến hạn ${new Date(r.candidate.due).toLocaleString("vi-VN")}.`,
        );
    setData((d) => ({
      ...d,
      aiReminders: next,
      notices: [...d.notices, ...notices],
      readNotices: notices.length ? false : d.readNotices,
    }));
    notify(
      added.length
        ? `Đã ghi ${added.length} bản ghi; email chỉ mô phỏng, chưa gửi.`
        : "Các mục này đã được ghi nhận; không tạo bản ghi trùng.",
    );
  }
  return (
    <>
      <PageHeader
        title="Nhắc hạn học tập"
        description="Kiểm tra công việc đến hạn trong 24 giờ và xem trước nội dung nhắc."
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
                Đang kiểm tra CSE301.01. Mốc thời gian cho phép xem trước hàng
                đợi; chưa có lịch chạy tự động trên máy chủ.
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
                  <Button onClick={record}>Ghi nhận nhắc mô phỏng</Button>
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
                    <Badge tone="amber">Chưa gửi email</Badge>
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
                        <Badge tone={r.channel === "email" ? "amber" : "green"}>
                          {r.channel === "email"
                            ? "Mô phỏng · Chưa gửi"
                            : "Đã ghi nhận"}
                        </Badge>
                        <small className="admin-line">Khóa: {r.key}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Chưa có bản ghi nhắc hạn"
              description="Quét hạn và ghi nhận hàng đợi để tạo nhật ký."
            />
          )}
        </Panel>
      )}
      <p className="ai-safety-note">
        Thông báo trong hệ thống được lưu trên trình duyệt. Email và tác vụ quét
        định kỳ cần backend Java.
      </p>
    </>
  );
}
