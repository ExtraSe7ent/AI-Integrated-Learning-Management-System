import { Link } from "react-router-dom";
import { useDemo } from "../data/DemoProvider";
import { Empty, PageHeader, Panel } from "../shared/UI";
import { facultyClasses, facultyName, summarize, supportRows } from "./data";
import { CourseTable } from "./Courses";
import {
  FacultyMetrics,
  NoFacultyData,
  TermFilter,
  useFacultyScope,
} from "./UI";

export function DeanOverview() {
  const { data } = useDemo();
  const { term, link } = useFacultyScope();
  const classes = facultyClasses(data, term),
    stats = summarize(classes);
  const grouped = [...new Set(supportRows(classes).map((a) => a.student.id))]
    .map((id) => {
      const rows = supportRows(classes).filter((a) => a.student.id === id);
      return { student: rows[0].student, classes: rows.length };
    })
    .sort((a, b) => b.classes - a.classes);
  return (
    <>
      <PageHeader
        title="Tổng quan khoa"
        description={`${facultyName} · Theo dõi học tập toàn khoa`}
      />
      <div className="dean-filters">
        <TermFilter />
      </div>
      <FacultyMetrics
        items={[
          {
            label: "Học phần",
            value: String(stats.courses).padStart(2, "0"),
            note: "Trong học kỳ",
          },
          {
            label: "Lớp học",
            value: String(stats.classes).padStart(2, "0"),
            note: "Đang theo dõi",
          },
          {
            label: "Sinh viên",
            value: String(stats.students),
            note: "Không tính trùng lớp",
          },
          {
            label: "Hoàn thành tự học",
            value: `${stats.completion}%`,
            note: "Trung bình theo lượt học",
          },
        ]}
      />
      {!classes.length ? (
        <NoFacultyData />
      ) : (
        <div className="dean-overview-grid">
          <CourseTable
            classes={classes}
            compact
            title="Tiến độ theo học phần"
          />
          <Panel title="Sinh viên cần hỗ trợ" className="dean-support-panel">
            <strong className="dean-support-total">
              {String(stats.support).padStart(2, "0")}
            </strong>
            <p className="muted">
              Sinh viên có tiến độ dưới 50% hoặc điểm bài tập dưới 5.
            </p>
            <hr />
            {grouped.length ? (
              grouped.slice(0, 2).map(({ student, classes }) => (
                <div className="dean-support-person" key={student.id}>
                  <strong>{student.name}</strong>
                  <p className="muted">Cần hỗ trợ ở {classes} lớp học</p>
                </div>
              ))
            ) : (
              <Empty
                title="Chưa có cảnh báo"
                description="Không có sinh viên dưới ngưỡng theo dõi."
              />
            )}
            <Link className="button secondary" to={link("canh-bao")}>
              Xem cảnh báo
            </Link>
          </Panel>
        </div>
      )}
    </>
  );
}
