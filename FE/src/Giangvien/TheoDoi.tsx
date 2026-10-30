import { learningSummary } from "../data/learningSummary";
import { LearningInsights } from "../AI/Insights";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Bell, CheckCircle2 } from "lucide-react";
import { students } from "../data/fixtures";
import {
  assessmentFor,
  updateAssessment,
  regradeQuestion,
} from "../data/assessment";
import { useDemo } from "../data/DemoProvider";
import {
  PageHeader,
  Panel,
  Button,
  Badge,
  SearchField,
  Progress,
  MetricStrip,
  Field,
  Empty,
} from "../shared/UI";
import { CourseContext } from "../shared/CourseComponents";
import { exportWorkbook } from "../shared/Grades";
export function TheoDoi() {
  const { data, setData, notify } = useDemo();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const summary = learningSummary(data);
  const normalized = students.map((s) =>
    s.id === "sv1"
      ? { ...s, progress: summary.progress, grade: summary.average }
      : s,
  );
  const rows = normalized.filter(
    (s) =>
      (s.name + s.code).toLowerCase().includes(query.toLowerCase()) &&
      (filter !== "risk" || s.progress < 50 || s.grade < 5),
  );
  return (
    <>
      <PageHeader
        title="Theo dõi học tập"
        description="Nhìn rõ tiến độ, nhận biết sinh viên cần hỗ trợ và hành động kịp thời."
        action={
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await exportWorkbook(
                  "Tien-do",
                  ["Mã SV", "Họ và tên", "Tiến độ (%)", "Điểm bài tập"],
                  rows.map((s) => [s.code, s.name, s.progress, s.grade]),
                );
              } catch {
                notify("Không thể xuất báo cáo. Hãy thử lại.");
              }
            }}
          >
            <Download size={17} />
            Xuất báo cáo
          </Button>
        }
      />
      <CourseContext />
      <MetricStrip
        items={[
          {
            label: "Sinh viên trong mẫu",
            value: String(normalized.length),
            note: "Danh sách minh họa",
          },
          {
            label: "Tiến độ trung bình",
            value:
              Math.round(
                normalized.reduce((n, s) => n + s.progress, 0) /
                  normalized.length,
              ) + "%",
            note: "Phiên RESTful API",
          },
          {
            label: "Cần hỗ trợ",
            value: String(
              normalized.filter((s) => s.progress < 50 || s.grade < 5).length,
            ),
            note: "Tiến độ dưới 50% hoặc điểm dưới 5",
          },
        ]}
      />
      <LearningInsights />
      <Panel>
        <div className="toolbar">
          <div className="tabs">
            <button
              className={filter === "all" ? "selected" : ""}
              onClick={() => setFilter("all")}
            >
              Tất cả sinh viên
            </button>
            <button
              className={filter === "risk" ? "selected" : ""}
              onClick={() => setFilter("risk")}
            >
              Cần hỗ trợ
            </button>
          </div>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Tìm sinh viên…"
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Tiến độ tự học</th>
                <th>Điểm bài tập</th>
                <th>Hoạt động</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="table-title">
                      <span className="avatar small">
                        {s.name.split(" ").slice(-1)[0].slice(0, 1)}
                      </span>
                      <div>
                        <strong>{s.name}</strong>
                        <p>
                          {s.code} · {s.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Progress value={s.progress} label />
                  </td>
                  <td>
                    {s.grade}
                    /10
                  </td>
                  <td>
                    <Badge
                      tone={s.progress < 50 || s.grade < 5 ? "amber" : "green"}
                    >
                      {s.progress < 50 || s.grade < 5
                        ? "Cần nhắc học"
                        : "Đang học tốt"}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="secondary small"
                      onClick={() => {
                        setData((d) => ({
                          ...d,
                          notices: [
                            ...d.notices,
                            `Nhắc học minh họa cho ${s.name}: hãy hoàn thành phiên tự học.`,
                          ],
                          readNotices: false,
                        }));
                        notify(`Đã tạo thông báo nhắc học cho ${s.name}.`);
                      }}
                    >
                      <Bell size={14} />
                      Nhắc học
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <Empty
              title="Không tìm thấy sinh viên"
              description="Đổi từ khóa hoặc bộ lọc."
            />
          )}
        </div>
      </Panel>
      <div className="two-columns">
        <Panel title="Câu hỏi theo trang">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Trang</th>
                  <th>Câu hỏi</th>
                  <th>Kiến thức mờ</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((page) => (
                  <tr key={page}>
                    <td>Trang {page}</td>
                    <td>
                      {data.questions.filter((q) => q.page === page).length}
                    </td>
                    <td>
                      {
                        data.gaps.filter((g) => g.page === page && !g.response)
                          .length
                      }{" "}
                      chưa giải đáp
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Tương tác cần theo dõi">
          <dl className="detail-list">
            <div>
              <dt>Lượt hỏi AI mẫu</dt>
              <dd>{data.chat.length}</dd>
            </div>
            <div>
              <dt>Phản hồi chưa giải quyết</dt>
              <dd>{data.feedback.filter((f) => !f.resolved).length}</dd>
            </div>
            <div>
              <dt>Kiến thức mờ</dt>
              <dd>{data.gaps.filter((g) => !g.response).length}</dd>
            </div>
          </dl>
          <Link className="text-link" to="/giang-vien/phan-hoi">
            Mở phản hồi & giải đáp
          </Link>
        </Panel>
      </div>
    </>
  );
}
export function PhucKhao() {
  const { data, setData, notify } = useDemo();
  return (
    <>
      <PageHeader
        title="Yêu cầu phúc khảo"
        description="Xem xét bài làm, giải thích quyết định và cập nhật kết quả."
      />
      {!data.appeals.length ? (
        <Empty
          title="Chưa có yêu cầu phúc khảo"
          description="Yêu cầu từ màn kết quả bài tập của sinh viên sẽ hiển thị tại đây."
          action={
            <Link className="button secondary" to="/giang-vien/cham-bai">
              Xem bài nộp
            </Link>
          }
        />
      ) : (
        data.appeals.map((a) => (
          <Panel key={a.id}>
            <div className="panel-heading">
              <div>
                <h2>Nguyễn Quang Anh · 23110149</h2>
                <p>{a.question}</p>
              </div>
              <Badge tone={a.status === "pending" ? "amber" : "green"}>
                {a.status === "pending"
                  ? "Đang chờ xử lý"
                  : a.status === "accepted"
                    ? "Đã chấm lại"
                    : "Giữ nguyên điểm"}
              </Badge>
            </div>
            <div className="reply-block">
              <strong>Lý do của sinh viên</strong>
              <p>{a.reason}</p>
              <p>Bài làm: {a.answer || "Chưa ghi nhận"}</p>
              <p>
                Điểm trước phúc khảo: {a.previousPoints ?? "—"}/
                {a.maxPoints ?? 3}
              </p>
            </div>
            {a.status === "pending" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const accepted = f.get("decision") === "accepted";
                  const score = Number(f.get("score"));
                  const response = String(f.get("response"));
                  setData((d) => ({
                    ...(accepted && assessmentFor(d, a.assignmentId).result
                      ? updateAssessment(d, a.assignmentId, {
                          result: {
                            ...regradeQuestion(
                              assessmentFor(d, a.assignmentId).result!,
                              a.questionIndex ?? 2,
                              score,
                            ),
                          },
                        })
                      : d),
                    appeals: d.appeals.map((x) =>
                      x.id === a.id
                        ? {
                            ...x,
                            status: accepted ? "accepted" : "rejected",
                            response,
                            grade: accepted
                              ? score
                              : assessmentFor(d, a.assignmentId).result?.score,
                          }
                        : x,
                    ),
                    notices: [
                      ...d.notices,
                      "Yêu cầu phúc khảo đã có kết quả. Xem lại điểm bài tập.",
                    ],
                    readNotices: false,
                  }));
                  notify("Đã lưu kết quả phúc khảo và cập nhật điểm.");
                }}
              >
                <div className="form-grid">
                  <Field label="Quyết định">
                    <select name="decision" aria-label="Quyết định">
                      <option value="rejected">Giữ nguyên điểm</option>
                      <option value="accepted">Chấm lại</option>
                    </select>
                  </Field>
                  <Field label="Điểm câu sau chấm lại">
                    <input
                      type="number"
                      min={0}
                      max={a.maxPoints ?? 3}
                      step="0.1"
                      required
                      defaultValue={a.previousPoints ?? 0}
                      name="score"
                    />
                  </Field>
                </div>
                <Field label="Lý do / phản hồi">
                  <textarea required minLength={10} rows={3} name="response" />
                </Field>
                <Button>
                  <CheckCircle2 size={16} />
                  Lưu & thông báo kết quả
                </Button>
              </form>
            ) : (
              <p>
                <strong>Phản hồi của giảng viên:</strong> {a.response}
              </p>
            )}
          </Panel>
        ))
      )}
    </>
  );
}
