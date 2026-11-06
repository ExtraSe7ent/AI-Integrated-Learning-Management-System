import { Link } from "react-router-dom";
import { Clock3, FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  PageHeader,
  Panel,
  Badge,
  Progress,
  Journey,
  Empty,
} from "../shared/UI";
import { CourseContext } from "../shared/CourseComponents";
import { studyFor } from "../data/study";
import { lessonOf, questionsOf } from "../data/content";
import { useScope } from "../shared/useScope";
import { useDemo } from "../data/DemoProvider";
import { sessionState } from "../data/rules";
export function TuHoc() {
  const { data } = useDemo();
  const { lessons } = useScope();
  // Only sessions of published lessons in the student's own classes.
  const sessions = data.sessions.filter(
    (s) => s.published && lessons.some((l) => l.id === lessonOf(s)),
  );
  const lessonFor = (s: (typeof sessions)[number]) => lessons.find((l) => l.id === lessonOf(s));
  const pages = (s: (typeof sessions)[number]) => {
    const l = lessonFor(s);
    return l?.slides?.length || 4;
  };
  const courseCode = (s: (typeof sessions)[number]) => {
    const cls = data.admin.classes.find((c) => c.id === (lessonFor(s)?.classId || "CSE301.01"));
    return data.admin.courses.find((c) => c.id === cls?.courseId)?.code ?? "CSE301";
  };
  return (
    <>
      <PageHeader
        title="Phiên tự học"
        description="Chuẩn bị kiến thức trước lớp, học theo nhịp của bạn."
      />
      <CourseContext />
      <Journey />
      <div className="toolbar">
        <h2>Phiên học của bạn</h2>
        <span className="muted">{sessions.length} phiên đã công bố</span>
      </div>
      {sessions.length ? (
        sessions.map((s) => {
          const status = sessionState(
            Date.parse(s.opens),
            Date.parse(s.closes),
          );
          const complete = Boolean(studyFor(data, s.id).completedAt);
          const total = pages(s);
          return (
            <Panel key={s.id} className="session-card">
              <div className="session-symbol">
                <FileText size={28} />
              </div>
              <div className="session-main">
                <div className="inline-meta">
                  <Badge
                    tone={
                      complete ? "green" : status === "open" ? "red" : "neutral"
                    }
                  >
                    {complete
                      ? "Đã hoàn thành"
                      : status === "open"
                        ? "Đang mở"
                        : status === "scheduled"
                          ? "Chưa mở"
                          : "Đã hết hạn"}
                  </Badge>
                  <span>{courseCode(s)}</span>
                </div>
                <h2>{s.title}</h2>
                <p>
                  {lessonFor(s)?.title} · {total} trang ·{" "}
                  {questionsOf(data.questions, lessonOf(s)).filter((q) => q.approved).length} câu hỏi
                </p>
                <div className="session-facts">
                  <span>
                    <Clock3 size={15} />
                    Hạn: {new Date(s.closes).toLocaleString("vi-VN")}
                  </span>
                  <span>
                    <CheckCircle2 size={15} />
                    {status === "closed" && !complete
                      ? s.late
                        ? "Đã hết hạn · Vẫn học được nhưng không tính điểm tự học"
                        : "Đã hết hạn · Chỉ xem lại, không ghi nhận tiến độ"
                      : "Hoàn thành đúng hạn để tính điểm"}
                  </span>
                </div>
                <Progress
                  value={
                    (Math.min(studyFor(data, s.id).progress, total) / total) *
                    100
                  }
                  label
                />
              </div>
              <Link
                className="button"
                to={`/sinh-vien/hoc/${lessonOf(s)}?phien=${s.id}`}
              >
                {complete
                  ? "Xem lại"
                  : studyFor(data, s.id).progress
                    ? "Tiếp tục"
                    : "Bắt đầu học"}
                <ArrowRight size={16} />
              </Link>
            </Panel>
          );
        })
      ) : (
        <Empty
          title="Chưa có phiên tự học"
          description="Phiên học sẽ hiển thị khi giảng viên công bố."
        />
      )}
      <div className="info-line">
        Phiên hoàn thành muộn vẫn xem lại được nhưng không tính vào điểm tự học
        đúng hạn.
      </div>
    </>
  );
}
