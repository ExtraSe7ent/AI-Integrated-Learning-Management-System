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
import { useDemo } from "../data/DemoProvider";
import { sessionState } from "../data/rules";
export function TuHoc() {
  const { data } = useDemo();
  const sessions = data.sessions.filter((s) => s.published);
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
          const complete = studyFor(data, s.id).progress === 4;
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
                  <span>CSE301 · Tuần 07</span>
                </div>
                <h2>{s.title}</h2>
                <p>Phát triển ứng dụng nâng cao · 4 trang · 3 câu hỏi</p>
                <div className="session-facts">
                  <span>
                    <Clock3 size={15} />
                    Hạn: {new Date(s.closes).toLocaleString("vi-VN")}
                  </span>
                  <span>
                    <CheckCircle2 size={15} />
                    {s.late
                      ? "Cho phép xem lại và học muộn"
                      : "Hoàn thành đúng hạn để tính điểm"}
                  </span>
                </div>
                <Progress
                  value={(studyFor(data, s.id).progress / 4) * 100}
                  label
                />
              </div>
              <Link
                className="button"
                to={`/sinh-vien/hoc/cs301?phien=${s.id}`}
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
