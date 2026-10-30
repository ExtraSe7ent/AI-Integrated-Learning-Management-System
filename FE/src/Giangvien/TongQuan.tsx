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
import { Schedule } from "../shared/CourseComponents";
import { courses, students, demoDate } from "../data/fixtures";
import { useDemo } from "../data/DemoProvider";
export function TongQuanGiangVien() {
  const { data } = useDemo();
  const pending =
    data.feedback.filter((f) => !f.resolved).length +
    data.appeals.filter((a) => a.status === "pending").length;
  return (
    <>
      <PageHeader
        title="Không gian giảng dạy"
        description={`Thứ Sáu, ${demoDate} · Chào thầy Minh Anh`}
        action={
          <Link className="button" to="/giang-vien/soan-bai">
            <Plus size={17} />
            Chuẩn bị bài học
          </Link>
        }
      />
      <div className="dashboard-grid">
        <div className="dashboard-primary">
          <section className="teaching-agenda">
            <div className="agenda-head">
              <span className="live-dot" />
              Lớp học tiếp theo<span>Hôm nay · 13:00</span>
            </div>
            <div className="agenda-body">
              <div className="course-stamp">
                CSE
                <br />
                <strong>301</strong>
              </div>
              <div>
                <h2>Phát triển ứng dụng nâng cao</h2>
                <p>Tuần 07 · Thiết kế RESTful API</p>
                <div className="inline-meta">
                  <span>
                    <Users size={15} />
                    36 sinh viên
                  </span>
                  <span>P.402 · Mỹ Đình</span>
                </div>
              </div>
            </div>
            <div className="agenda-footer">
              <Link to="/giang-vien/soan-bai">
                <FileText size={17} />
                Xem học liệu
              </Link>
              <Link className="button" to="/giang-vien/tren-lop">
                <Radio size={17} />
                Bắt đầu hỏi trên lớp
              </Link>
            </div>
          </section>
          <MetricStrip
            items={[
              {
                label: "Lớp phụ trách",
                value: "03",
                note: "Học kỳ I · 2026–2027",
              },
              {
                label: "Sinh viên",
                value: "110",
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
              {courses.map((c) => (
                <Link
                  key={c.id}
                  to={`/giang-vien/lop-hoc/${c.id}`}
                  className="class-row"
                >
                  <span className={`course-initial ${c.color}`}>
                    {c.code.slice(-3)}
                  </span>
                  <div>
                    <strong>{c.title}</strong>
                    <p>
                      {c.code} · {c.students} sinh viên
                    </p>
                  </div>
                  <div className="class-progress">
                    <span>Tiến độ tự học</span>
                    <Progress value={c.progress} label />
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
                  {students
                    .filter((s) => s.progress < 50)
                    .map((s) => (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.name}</strong>
                          <p>{s.code}</p>
                        </td>
                        <td>CSE301</td>
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
          <Panel title="Lịch dạy hôm nay" action={<CalendarDays size={18} />}>
            <Schedule />
          </Panel>
          <Panel title="Đang chờ xử lý">
            <Link className="action-row" to="/giang-vien/cham-bai">
              <span className="task-icon">
                <FileText size={18} />
              </span>
              <div>
                <strong>Bài nộp cần chấm</strong>
                <p>
                  {data.assessments.a1?.result
                    ? "Có bài tự luận mới"
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
