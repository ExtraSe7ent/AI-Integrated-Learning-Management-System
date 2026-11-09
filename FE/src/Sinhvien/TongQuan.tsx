import { Link } from "react-router-dom";
import { ArrowRight, Clock3, CalendarDays, Sun, CheckCircle2, FileText, ChevronRight } from "lucide-react";
import { useScope } from "../shared/useScope";
import { studyCompletion, studyFor } from "../data/study";
import { useDemo } from "../data/DemoProvider";
import { lessonOf, questionsOf } from "../data/content";
import { sessionState } from "../data/rules";
import { PageHeader, Panel, TextLink, Badge, Progress, Journey, MetricStrip, Empty } from "../shared/UI";
import { CourseCard } from "../shared/CourseComponents";

const today = () =>
  new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const when = (iso: string) => new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

/** Everything here comes from the student's own classes; an empty system shows empty states, not samples. */
export function TongQuan() {
  const { data } = useDemo();
  const { courses, lessons } = useScope();
  const sessions = data.sessions.filter((s) => s.published && lessons.some((l) => l.id === lessonOf(s)));
  const lessonFor = (lessonId: string) => lessons.find((l) => l.id === lessonId);
  const pagesOf = (lessonId: string) => lessonFor(lessonId)?.slides?.length || 4;
  const open = sessions.filter((s) => sessionState(Date.parse(s.opens), Date.parse(s.closes)) === "open");
  const current = open.find((s) => !studyFor(data, s.id).completedAt) ?? open[0];
  const onTime = sessions.filter((s) => studyCompletion(studyFor(data, s.id), s) === "on-time").length;
  const assignments = data.assignments.filter((a) => a.published);
  const scores = assignments
    .map((a) => data.assessments[a.id]?.result?.score)
    .filter((x): x is number => typeof x === "number");
  const average = scores.length ? Math.round((scores.reduce((n, x) => n + x, 0) / scores.length) * 10) / 10 : null;
  const tasks = [
    ...assignments
      .filter((a) => !data.assessments[a.id]?.result && Date.parse(a.closes) > Date.now())
      .map((a) => ({ key: a.id, title: a.title, kind: "Bài tập tính điểm", due: a.closes, to: "/sinh-vien/bai-tap" })),
    ...open
      .filter((s) => !studyFor(data, s.id).completedAt)
      .map((s) => ({
        key: s.id,
        title: s.title,
        kind: "Phiên tự học",
        due: s.closes,
        to: `/sinh-vien/hoc/${lessonOf(s)}?phien=${s.id}`,
      })),
  ].sort((a, b) => Date.parse(a.due) - Date.parse(b.due));
  return (
    <>
      <PageHeader
        title="Học tập hôm nay"
        description={today()}
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
            Chào {data.profile.name}. <strong>Xem các việc cần hoàn thành.</strong>
          </p>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-primary">
          {current ? (
            <section className="continue-panel">
              <div className="continue-content">
                <div className="inline-meta">
                  <Badge tone="red">Đang mở</Badge>
                  <span>Hạn {when(current.closes)}</span>
                </div>
                <h2>{lessonFor(lessonOf(current))?.title}</h2>
                <p>{current.title}</p>
                <Journey />
                <div className="continue-progress">
                  <Progress
                    value={Math.round((studyFor(data, current.id).progress / pagesOf(lessonOf(current))) * 100)}
                    label
                  />
                  <span>Tiến độ phiên của bạn</span>
                </div>
                <Link className="button" to={`/sinh-vien/hoc/${lessonOf(current)}?phien=${current.id}`}>
                  {studyFor(data, current.id).completedAt ? "Xem lại" : "Tiếp tục học"}
                  <ArrowRight size={17} />
                </Link>
              </div>
              <div className="lesson-preview">
                <div className="preview-top">
                  <span>BÀI HỌC</span>
                  <FileText size={18} />
                </div>
                <strong>{lessonFor(lessonOf(current))?.title}</strong>
                <div className="preview-foot">
                  <span>{pagesOf(lessonOf(current))} trang bài học</span>
                  <span>{questionsOf(data.questions, lessonOf(current)).length} câu hỏi</span>
                </div>
              </div>
            </section>
          ) : (
            <Panel>
              <Empty
                title="Chưa có phiên tự học đang mở"
                description="Phiên tự học giảng viên công bố cho lớp của bạn sẽ hiện ở đây."
              />
            </Panel>
          )}
          <MetricStrip
            items={[
              { label: "Khóa học đang học", value: String(courses.length).padStart(2, "0"), note: "Theo lớp được ghi danh" },
              { label: "Phiên tự học", value: `${onTime}/${sessions.length}`, note: "Đã hoàn thành đúng hạn" },
              {
                label: "Điểm bài tập",
                value: average === null ? "—" : String(average),
                note: average === null ? "Chưa có bài đã chấm" : "Trung bình · thang 10",
              },
            ]}
          />
          <Panel
            title="Khóa học của tôi"
            action={<TextLink to="/sinh-vien/khoa-hoc">Tất cả khóa học</TextLink>}
            className="transparent-panel"
          >
            {courses.length ? (
              <div className="course-grid">
                {courses.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            ) : (
              <Empty title="Chưa có khóa học" description="Bạn chưa được ghi danh vào lớp nào." />
            )}
          </Panel>
          <Panel title="Việc cần hoàn thành" action={<TextLink to="/sinh-vien/bai-tap">Xem tất cả</TextLink>}>
            {tasks.length ? (
              tasks.slice(0, 6).map((t) => (
                <Link className="task-row" to={t.to} key={t.key}>
                  <span className={`task-icon ${t.kind === "Phiên tự học" ? "sage" : ""}`}>
                    {t.kind === "Phiên tự học" ? <CheckCircle2 size={19} /> : <FileText size={19} />}
                  </span>
                  <div>
                    <strong>{t.title}</strong>
                    <p>{t.kind}</p>
                  </div>
                  <span className="muted">Hạn {when(t.due)}</span>
                  <ChevronRight size={18} />
                </Link>
              ))
            ) : (
              <Empty title="Không có việc cần hoàn thành" description="Bài tập và phiên tự học còn hạn sẽ hiện ở đây." />
            )}
          </Panel>
        </div>
        <aside className="dashboard-secondary">
          <Panel title="Hạn sắp tới" action={<CalendarDays size={18} />}>
            {tasks.length ? (
              tasks.slice(0, 4).map((t) => (
                <div className="notification-preview" key={t.key}>
                  <span className="small-dot" />
                  <div>
                    <strong>{t.title}</strong>
                    <small>
                      <Clock3 size={12} />
                      {when(t.due)}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Không có hạn nào sắp tới.</p>
            )}
          </Panel>
          <Panel title="Thông báo mới" action={<span className="count-label">{data.notices.length}</span>}>
            {data.notices.length ? (
              data.notices
                .slice(-3)
                .reverse()
                .map((n, i) => (
                  <div className="notification-preview" key={i}>
                    <span className="small-dot" />
                    <div>
                      <strong>{n}</strong>
                    </div>
                  </div>
                ))
            ) : (
              <p className="muted">Chưa có thông báo.</p>
            )}
            <Link className="text-link" to="/sinh-vien/tong-quan" state={{ notifications: true }}>
              Xem thông báo
            </Link>
          </Panel>
        </aside>
      </div>
    </>
  );
}
