import { Link } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  FileText,
  MessageSquare,
  Radio,
  Clock3,
  ChevronRight,
  Users,
  CalendarDays,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  Badge,
  MetricStrip,
  TextLink,
  Progress,
} from "../shared/UI";
import { useDemo } from "../data/DemoProvider";
import { useScope } from "../shared/useScope";
import { lessonOf } from "../data/content";
import { sessionState } from "../data/rules";
import { Empty } from "../shared/UI";
export function TongQuanGiangVien() {
  const { data } = useDemo();
  const { classes: mine, lessons } = useScope();
  const classes = data.analytics.classes;
  // The first assigned class leads the page; nothing is shown from the demo when nothing is assigned.
  const first = mine[0];
  const firstCourse = data.admin.courses.find((c) => c.id === first?.courseId);
  const openSessions = data.sessions.filter(
    (x) =>
      x.published &&
      lessons.some((l) => l.id === lessonOf(x)) &&
      sessionState(Date.parse(x.opens), Date.parse(x.closes)) === "open",
  );
  const roster = classes.flatMap((c) =>
    c.students.map((s) => ({ ...s, classId: c.id, code: c.courseCode })),
  );
  const average = (values: number[]) =>
    values.length
      ? Math.round(values.reduce((n, v) => n + v, 0) / values.length)
      : 0;
  const pending =
    data.feedback.filter((f) => !f.resolved).length +
    data.appeals.filter((a) => a.status === "pending").length;
  return (
    <>
      <PageHeader
        title="Không gian giảng dạy"
        description={`${new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Chào ${data.teacherProfile.name}`}
        action={
          <Link className="button" to="/giang-vien/bai-hoc">
            <Plus size={17} />
            Chuẩn bị bài học
          </Link>
        }
      />
      <div className="dashboard-grid">
        <div className="dashboard-primary">
          {first ? (
            <section className="teaching-agenda">
              <div className="agenda-head">
                <span className="live-dot" />
                Lớp phụ trách<span>HK {first.term} · {first.year}</span>
              </div>
              <div className="agenda-body">
                <div className="course-stamp">
                  {firstCourse?.code.replace(/\d+$/, "") ?? ""}
                  <br />
                  <strong>{firstCourse?.code.match(/\d+$/)?.[0] ?? ""}</strong>
                </div>
                <div>
                  <h2>{firstCourse?.title ?? first.courseId}</h2>
                  <p>
                    Lớp {first.name}
                    {mine.length > 1 && ` · cùng ${mine.length - 1} lớp khác`}
                  </p>
                  <div className="inline-meta">
                    <span>
                      <Users size={15} />
                      {first.studentIds.length} sinh viên
                    </span>
                  </div>
                </div>
              </div>
              <div className="agenda-footer">
                <Link to="/giang-vien/bai-hoc">
                  <FileText size={17} />
                  Bài học & học liệu
                </Link>
                <Link className="button" to="/giang-vien/tren-lop">
                  <Radio size={17} />
                  Bắt đầu hỏi trên lớp
                </Link>
              </div>
            </section>
          ) : (
            <Panel>
              <Empty
                title="Chưa được phân công lớp"
                description="Lớp Admin phân công cho bạn sẽ hiện ở đây."
              />
            </Panel>
          )}
          <MetricStrip
            items={[
              {
                label: "Lớp phụ trách",
                value: String(classes.length).padStart(2, "0"),
                note: "Học kỳ I · 2026–2027",
              },
              {
                label: "Sinh viên",
                value: String(new Set(roster.map((s) => s.id)).size),
                note: "Trên các lớp phụ trách",
              },
              {
                label: "Cần phản hồi",
                value: String(pending).padStart(2, "0"),
                note: "Phản hồi và phúc khảo",
              },
            ]}
          />
          <Panel
            title="Lớp giảng dạy"
            action={
              <TextLink to="/giang-vien/lop-hoc">Tất cả lớp học</TextLink>
            }
          >
            <div className="class-table">
              {classes.map((c) => (
                <Link
                  key={c.id}
                  to={`/giang-vien/lop-hoc/${c.courseId}`}
                  className="class-row"
                >
                  <span className="course-initial rose">
                    {c.courseCode.slice(-3)}
                  </span>
                  <div>
                    <strong>{c.courseTitle}</strong>
                    <p>
                      {c.name} · {c.students.length} sinh viên
                    </p>
                  </div>
                  <div className="class-progress">
                    <span>Tiến độ tự học</span>
                    <Progress
                      value={average(c.students.map((s) => s.progress))}
                      label
                    />
                  </div>
                  <ChevronRight size={19} />
                </Link>
              ))}
            </div>
          </Panel>
          <Panel
            title="Sinh viên cần hỗ trợ"
            action={<TextLink to="/giang-vien/tien-do">Xem chi tiết</TextLink>}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sinh viên</th>
                    <th>Học phần</th>
                    <th>Tiến độ</th>
                    <th>Tín hiệu</th>
                  </tr>
                </thead>
                <tbody>
                  {roster
                    .filter((s) => s.progress < 50 || s.average < 5)
                    .map((s) => (
                      <tr key={s.classId + s.id}>
                        <td>
                          <strong>{s.name}</strong>
                          <p>{s.id}</p>
                        </td>
                        <td>{s.code}</td>
                        <td>
                          <Progress value={s.progress} label />
                        </td>
                        <td>
                          <Badge tone="amber">Cần nhắc học</Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        <aside className="dashboard-secondary">
          <Panel title="Phiên tự học đang mở" action={<CalendarDays size={18} />}>
            {openSessions.length ? (
              openSessions.map((x) => (
                <Link className="action-row" to="/giang-vien/phien-tu-hoc" key={x.id}>
                  <span className="task-icon sage">
                    <Clock3 size={18} />
                  </span>
                  <div>
                    <strong>{x.title}</strong>
                    <p>Hạn {new Date(x.closes).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</p>
                  </div>
                  <ChevronRight size={16} />
                </Link>
              ))
            ) : (
              <p className="muted">Không có phiên tự học nào đang mở.</p>
            )}
          </Panel>
          <Panel title="Đang chờ xử lý">
            <Link className="action-row" to="/giang-vien/cham-bai">
              <span className="task-icon">
                <FileText size={18} />
              </span>
              <div>
                <strong>Bài nộp cần chấm</strong>
                <p>
                  {Object.values(data.assessments).some(
                    (a) => a.result && !a.result.approved,
                  )
                    ? "Có bài chờ duyệt"
                    : "Xem bài nộp"}
                </p>
              </div>
              <ChevronRight size={16} />
            </Link>
            <Link className="action-row" to="/giang-vien/phan-hoi">
              <span className="task-icon sand">
                <MessageSquare size={18} />
              </span>
              <div>
                <strong>Kiến thức mờ</strong>
                <p>
                  {data.gaps.filter((g) => !g.response).length} câu chưa giải
                  đáp
                </p>
              </div>
              <ChevronRight size={16} />
            </Link>
            <Link className="action-row" to="/giang-vien/phuc-khao">
              <span className="task-icon sage">
                <Clock3 size={18} />
              </span>
              <div>
                <strong>Phúc khảo</strong>
                <p>
                  {data.appeals.filter((a) => a.status === "pending").length}{" "}
                  yêu cầu đang chờ
                </p>
              </div>
              <ChevronRight size={16} />
            </Link>
          </Panel>
          <section className="teaching-note">
            <span>Gợi ý cho buổi học</span>
            <h3>
              Dành 10 phút cho
              <br />
              PUT và PATCH.
            </h3>
            <p>
              Đây là nội dung sinh viên đang đặt câu hỏi trong phiên tự học.
            </p>
            <Link className="text-link" to="/giang-vien/phan-hoi">
              Xem kiến thức mờ
              <ArrowRight size={15} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
