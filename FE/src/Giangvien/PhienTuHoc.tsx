import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  CalendarDays,
  Clock3,
  MoreHorizontal,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import type { Session } from "../data/fixtures";
import { sessionState } from "../data/rules";
import { PageHeader, Panel, Button, Badge, Field, Dialog } from "../shared/UI";
import { CourseContext } from "../shared/CourseComponents";
export function PhienTuHoc() {
  const { data, setData, notify } = useDemo();
  const [edit, setEdit] = useState<Session | null>(null);
  const [error, setError] = useState("");
  return (
    <>
      <PageHeader
        title="Quản lý phiên tự học"
        description="Thiết lập thời gian, công bố và theo dõi việc chuẩn bị trước lớp."
        action={
          <Button
            onClick={() => {
              setError("");
              setEdit({
                id: "new",
                title: "",
                opens: "2026-10-16T08:00",
                closes: "2026-10-23T23:59",
                published: false,
                late: false,
              });
            }}
          >
            <Plus size={17} />
            Tạo phiên tự học
          </Button>
        }
      />
      <CourseContext />
      <Panel>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Phiên tự học</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((s) => {
                const state = sessionState(
                  Date.parse(s.opens),
                  Date.parse(s.closes),
                );
                return (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.title}</strong>
                      <p>4 trang · 3 câu hỏi · CSE301</p>
                    </td>
                    <td>
                      <div className="date-lines">
                        <span>
                          <CalendarDays size={14} />
                          {new Date(s.opens).toLocaleDateString("vi-VN")}
                        </span>
                        <span>
                          <Clock3 size={14} />
                          {new Date(s.closes).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge
                        tone={
                          !s.published
                            ? "neutral"
                            : state === "open"
                              ? "green"
                              : "amber"
                        }
                      >
                        {!s.published
                          ? "Bản nháp"
                          : state === "open"
                            ? "Đang mở"
                            : state === "scheduled"
                              ? "Chưa mở"
                              : "Đã đóng"}
                      </Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Cài đặt ${s.title}`}
                          onClick={() => {
                            setEdit(s);
                            setError("");
                          }}
                        >
                          <MoreHorizontal size={19} />
                        </button>
                        <Button
                          variant="secondary small"
                          onClick={() => {
                            if (
                              !s.published &&
                              data.questions.some((q) => !q.approved)
                            ) {
                              notify(
                                "Cần duyệt câu hỏi AI trước khi công bố phiên.",
                              );
                              return;
                            }
                            setData((d) => ({
                              ...d,
                              sessions: d.sessions.map((x) =>
                                x.id === s.id
                                  ? { ...x, published: !x.published }
                                  : x,
                              ),
                            }));
                          }}
                        >
                          {s.published ? "Ẩn phiên" : "Công bố"}
                        </Button>
                        <Link className="text-link" to="/giang-vien/tien-do">
                          Báo cáo
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="info-line">
        <CheckCircle2 size={17} />
        Trạng thái mở/đóng tự xác định theo thời gian. Phiên đã công bố chỉ cho
        gia hạn thời gian kết thúc.
      </div>
      {edit && (
        <Dialog
          title={
            edit.id === "new"
              ? "Tạo phiên tự học"
              : edit.published
                ? "Gia hạn phiên tự học"
                : "Cài đặt phiên"
          }
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (Date.parse(edit.closes) <= Date.parse(edit.opens)) {
                setError("Thời gian kết thúc phải sau thời gian bắt đầu.");
                return;
              }
              const original = data.sessions.find((s) => s.id === edit.id);
              if (
                original?.published &&
                Date.parse(edit.closes) < Date.parse(original.closes)
              ) {
                setError("Phiên đã công bố chỉ được gia hạn, không rút ngắn.");
                return;
              }
              setData((d) => ({
                ...d,
                sessions:
                  edit.id === "new"
                    ? [...d.sessions, { ...edit, id: crypto.randomUUID() }]
                    : d.sessions.map((s) => (s.id === edit.id ? edit : s)),
              }));
              setEdit(null);
              notify("Đã lưu cấu hình phiên tự học.");
            }}
          >
            <Field label="Tên phiên">
              <input
                required
                disabled={edit.published}
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
            </Field>
            <Field label="Bài học">
              <select disabled={edit.published}>
                <option>Thiết kế RESTful API</option>
              </select>
            </Field>
            <div className="form-grid">
              <Field label="Bắt đầu">
                <input
                  required
                  disabled={edit.published}
                  type="datetime-local"
                  value={edit.opens}
                  onChange={(e) => setEdit({ ...edit, opens: e.target.value })}
                />
              </Field>
              <Field label="Kết thúc">
                <input
                  required
                  type="datetime-local"
                  value={edit.closes}
                  onChange={(e) => setEdit({ ...edit, closes: e.target.value })}
                />
              </Field>
            </div>
            <label className="checkbox-field">
              <input
                type="checkbox"
                disabled={edit.published}
                checked={edit.late}
                onChange={(e) => setEdit({ ...edit, late: e.target.checked })}
              />
              Cho phép xem và học sau hạn
            </label>
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <Button>Lưu phiên tự học</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
