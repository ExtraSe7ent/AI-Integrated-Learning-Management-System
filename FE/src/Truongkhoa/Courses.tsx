import { Link, useParams } from "react-router-dom";
import { courses } from "../data/fixtures";
import { useDemo } from "../data/DemoProvider";
import { Empty, Field, PageHeader, Panel, Progress } from "../shared/UI";
import { facultyClasses, facultyName, summarize, terms } from "./data";
import type { FacultyClass } from "./data";
import {
  DeanIcon,
  FacultyMetrics,
  NoFacultyData,
  TermFilter,
  useFacultyScope,
} from "./UI";

export function CourseTable({
  classes,
  compact = false,
  title,
}: {
  classes: FacultyClass[];
  compact?: boolean;
  title: string;
}) {
  const { link } = useFacultyScope();
  const ids = [...new Set(classes.map((c) => c.course.id))];
  return (
    <Panel title={title}>
      <div className="table-wrap">
        <table
          className={
            compact ? "dean-course-table compact" : "dean-course-table"
          }
        >
          <thead>
            <tr>
              <th>Học phần</th>
              <th>Số lớp</th>
              {!compact && <th>Sinh viên</th>}
              <th>Hoàn thành</th>
              <th>Cần hỗ trợ</th>
              <th>
                <span className="visually-hidden">Chi tiết</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => {
              const group = classes.filter((c) => c.course.id === id),
                course = group[0].course,
                stats = summarize(group);
              return (
                <tr key={id}>
                  <td>
                    <Link className="dean-row-link" to={link(`hoc-phan/${id}`)}>
                      {course.code} · {course.title}
                    </Link>
                  </td>
                  <td>
                    {stats.classes}
                    {compact ? " lớp" : ""}
                  </td>
                  {!compact && <td>{stats.students}</td>}
                  <td>
                    <Progress value={stats.completion} label />
                  </td>
                  <td>
                    <Link
                      className={stats.support ? "dean-attention" : "muted"}
                      to={link("canh-bao", { hp: id })}
                    >
                      {stats.support} {compact ? "cần hỗ trợ" : "sinh viên"}
                    </Link>
                  </td>
                  <td>
                    <Link
                      aria-label={`Xem học phần ${course.code}`}
                      to={link(`hoc-phan/${id}`)}
                    >
                      <DeanIcon name="right" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
export function DeanCourses() {
  const { data } = useDemo();
  const { term, params, setParams } = useFacultyScope();
  const query = params.get("q") || "";
  const classes = facultyClasses(data, term);
  const filtered = classes.filter((c) =>
    (c.course.code + " " + c.course.title)
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Học phần"
        description="Mở học phần để xem các lớp và mức hoàn thành của từng lớp."
      />
      <div className="dean-filters">
        <TermFilter />
      </div>
      <div className="dean-course-search">
        <Field label="Tìm học phần">
          <input
            value={query}
            placeholder="Nhập mã hoặc tên học phần…"
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set("q", e.target.value);
              setParams(next, { replace: true });
            }}
          />
        </Field>
      </div>
      {!classes.length ? (
        <NoFacultyData />
      ) : filtered.length ? (
        <CourseTable
          classes={filtered}
          title={`${summarize(filtered).courses} học phần`}
        />
      ) : (
        <Empty
          title="Không tìm thấy học phần"
          description="Thử tìm bằng mã hoặc tên học phần khác."
          action={
            <button
              className="button secondary"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("q");
                setParams(next);
              }}
            >
              Xóa tìm kiếm
            </button>
          }
        />
      )}
    </>
  );
}
export function DeanCourseDetail() {
  const { courseId } = useParams();
  const { data } = useDemo();
  const { term, link } = useFacultyScope();
  const course = courses.find((c) => c.id === courseId);
  const classes = facultyClasses(data, term).filter(
      (c) => c.course.id === courseId,
    ),
    stats = summarize(classes);
  if (!course)
    return (
      <Empty
        title="Không tìm thấy học phần"
        description="Học phần không tồn tại hoặc không thuộc phạm vi khoa."
        action={
          <Link className="button secondary" to={link("hoc-phan")}>
            Về danh sách học phần
          </Link>
        }
      />
    );
  return (
    <>
      <PageHeader
        title={course.title}
        description={`${course.code} · ${facultyName} · ${terms.find((t) => t.id === term)?.label}`}
      />
      <nav className="dean-breadcrumbs" aria-label="Vị trí trong khoa">
        <Link to={link("hoc-phan")}>Học phần</Link>
        <span>/</span>
        <span>{course.code}</span>
      </nav>
      <div className="dean-filters">
        <TermFilter />
      </div>
      <FacultyMetrics
        items={[
          {
            label: "Lớp học",
            value: String(stats.classes).padStart(2, "0"),
            note: "Trong học phần",
          },
          {
            label: "Sinh viên",
            value: String(stats.students),
            note: "Theo danh sách lớp",
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
        <Panel title="Các lớp của học phần">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lớp học</th>
                  <th>Giảng viên</th>
                  <th>Sinh viên</th>
                  <th>Hoàn thành</th>
                  <th>Cần hỗ trợ</th>
                  <th>
                    <span className="visually-hidden">Chi tiết</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => {
                  const summary = summarize([c]);
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link
                          className="dean-row-link"
                          to={link(`hoc-phan/${course.id}/lop/${c.id}`)}
                        >
                          {c.id}
                        </Link>
                      </td>
                      <td>{c.teacher}</td>
                      <td>{summary.students}</td>
                      <td>
                        <Progress value={summary.completion} label />
                      </td>
                      <td>{summary.support} sinh viên</td>
                      <td>
                        <Link
                          aria-label={`Xem lớp ${c.id}`}
                          to={link(`hoc-phan/${course.id}/lop/${c.id}`)}
                        >
                          <DeanIcon name="right" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}
