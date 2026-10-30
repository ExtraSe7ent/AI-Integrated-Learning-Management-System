import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  CalendarDays,
  Sun,
  CheckCircle2,
  FileText,
  ChevronRight,
} from "lucide-react";
import { courses, demoDate } from "../data/fixtures";
import { studyFor } from "../data/study";
import { useDemo } from "../data/DemoProvider";
import {
  PageHeader,
  Panel,
  TextLink,
  Badge,
  Progress,
  Journey,
  MetricStrip,
} from "../shared/UI";
import { CourseCard, Schedule } from "../shared/CourseComponents";
export function TongQuan() {
  const { data } = useDemo();
  return (
    <>
      <PageHeader
        title="Học tập hôm nay"
        description={`Thứ Sáu, ${demoDate}`}
        action={
          <Link className="button secondary" to="/sinh-vien/tu-hoc">
            <CalendarDays size={17} />
            Kế hoạch học tập
          </Link>
        }
      />
      <div className="welcome-line">
        <div>
          <Sun size={19} className="sun-mark" />
          <p>
            Chào {data.profile.name}.{" "}
            <strong>Xem lịch học và các việc cần hoàn thành.</strong>
          </p>
        </div>
        <span>Tuần học 07</span>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-primary">
          <section className="continue-panel">
            <div className="continue-content">
              <div className="inline-meta">
                <Badge tone="red">Đang học</Badge>
                <span>CSE301 · Tuần 07</span>
              </div>
              <h2>Thiết kế RESTful API</h2>
              <p>Phát triển ứng dụng nâng cao</p>
              <Journey />
              <div className="continue-progress">
                <Progress
                  value={Math.round((studyFor(data, "s1").progress / 4) * 100)}
                  label
                />
                <span>Tiến độ bài học của bạn</span>
              </div>
              <Link className="button" to="/sinh-vien/hoc/cs301">
                Tiếp tục học
                <ArrowRight size={17} />
              </Link>
            </div>
            <div className="lesson-preview">
              <div className="preview-top">
                <span>BÀI HỌC 02</span>
                <FileText size={18} />
              </div>
              <strong>
                RESTful
                <br />
                API
              </strong>
              <div className="method-row">
                <span>GET</span>
                <span>POST</span>
                <span>PUT</span>
              </div>
              <p>Từ nguyên lý đến thực hành</p>
              <div className="preview-foot">
                <span>4 trang bài học</span>
                <span>3 câu hỏi</span>
              </div>
            </div>
          </section>
          <MetricStrip
            items={[
              {
                label: "Khóa học đang học",
                value: "03",
                note: "Học kỳ hiện tại",
              },
              {
                label: "Phiên tự học",
                value: `${studyFor(data, "s1").progress === 4 ? "09" : "08"}/12`,
                note: "Đã hoàn thành đúng hạn",
              },
              {
                label: "Điểm bài tập",
                value: data.assessments.a1?.result
                  ? String(data.assessments.a1?.result.score)
                  : "8.5",
                note: "Trung bình · thang 10",
              },
            ]}
          />
          <Panel
            title="Khóa học của tôi"
            action={
              <TextLink to="/sinh-vien/khoa-hoc">Tất cả khóa học</TextLink>
            }
            className="transparent-panel"
          >
            <div className="course-grid">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </Panel>
          <Panel
            title="Việc cần hoàn thành"
            action={<TextLink to="/sinh-vien/bai-tap">Xem tất cả</TextLink>}
          >
            <Link className="task-row" to="/sinh-vien/bai-tap">
              <span className="task-icon">
                <FileText size={19} />
              </span>
              <div>
                <strong>Thiết kế API quản lý thư viện</strong>
                <p>CSE301 · Bài tập tính điểm</p>
              </div>
              <Badge tone="amber">Chưa làm</Badge>
              <ChevronRight size={18} />
            </Link>
            <Link className="task-row" to="/sinh-vien/tu-hoc">
              <span className="task-icon sage">
                <CheckCircle2 size={19} />
              </span>
              <div>
                <strong>Ôn tập mô hình dữ liệu quan hệ</strong>
                <p>CSE204 · Phiên tự học</p>
              </div>
              <span className="muted">Tuần 07</span>
              <ChevronRight size={18} />
            </Link>
          </Panel>
        </div>
        <aside className="dashboard-secondary">
          <Panel title="Lịch học hôm nay" action={<CalendarDays size={18} />}>
            <div className="calendar-strip">
              <span>Tháng 10, 2026</span>
              <div>
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d, i) => (
                  <div key={d} className={i === 4 ? "today" : ""}>
                    <small>{d}</small>
                    <strong>{12 + i}</strong>
                  </div>
                ))}
              </div>
            </div>
            <Schedule />
          </Panel>
          <Panel
            title="Thông báo mới"
            action={<span className="count-label">3</span>}
          >
            <div className="notification-preview">
              <span className="small-dot" />
              <div>
                <strong>Học liệu tuần 07 đã sẵn sàng</strong>
                <p>Lớp Phát triển ứng dụng nâng cao</p>
                <small>
                  <Clock3 size={12} />2 giờ trước
                </small>
              </div>
            </div>
            <Link
              className="text-link"
              to="/sinh-vien/tong-quan"
              state={{ notifications: true }}
            >
              Xem thông báo
            </Link>
          </Panel>
        </aside>
      </div>
    </>
  );
}
