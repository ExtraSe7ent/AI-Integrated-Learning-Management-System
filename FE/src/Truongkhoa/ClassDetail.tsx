import { Link, useParams } from "react-router-dom";
import { useDemo } from "../data/DemoProvider";
import { Empty, Field, PageHeader, Panel, Progress } from "../shared/UI";
import { facultyClasses, summarize, supportReason } from "./data";
import { FacultyMetrics, useFacultyScope } from "./UI";

export function DeanClassDetail() {
  const { courseId, classId } = useParams();
  const { data } = useDemo();
  const { term, link, params, setParams } = useFacultyScope();
  const classroom = facultyClasses(data, term).find(
    (c) => c.id === classId && c.course.id === courseId,
  );
  if (!classroom)
    return (
      <Empty
        title="Không tìm thấy lớp học trong phạm vi này"
        description="Kiểm tra lại học phần, lớp học hoặc học kỳ đã chọn."
        action={
          <Link className="button secondary" to={link("hoc-phan")}>
            Về danh sách học phần
          </Link>
        }
      />
    );
  const stats = summarize([classroom]),
    query = params.get("sv") || "",
    supportOnly = params.get("loc") === "can-ho-tro";
  const rows = classroom.students.filter(
    (s) =>
      (s.name + s.code).toLowerCase().includes(query.toLowerCase()) &&
      (!supportOnly || supportReason(s)),
  );
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  }
  return (
    <>
      <PageHeader
        title={`Lớp ${classroom.id}`}
        description={`${classroom.course.title} · ${classroom.teacher}`}
      />
      <nav className="dean-breadcrumbs" aria-label="Vị trí trong khoa">
        <Link to={link("hoc-phan")}>Học phần</Link>
        <span>/</span>
        <Link to={link(`hoc-phan/${courseId}`)}>{classroom.course.code}</Link>
        <span>/</span>
        <span>{classroom.id}</span>
      </nav>
      <FacultyMetrics
        items={[
          {
            label: "Sinh viên",
            value: String(stats.students).padStart(2, "0"),
            note: "Trong lớp",
          },
          {
            label: "Hoàn thành tự học",
            value: `${stats.completion}%`,
            note: "Trung bình của lớp",
          },
          {
            label: "Cần hỗ trợ",
            value: String(stats.support).padStart(2, "0"),
            note: "Sinh viên trong lớp",
          },
        ]}
      />
      <Panel title="Danh sách sinh viên">
        <div className="dean-filters">
          <Field label="Tìm sinh viên">
            <input
              placeholder="Tên hoặc mã sinh viên…"
              value={query}
              onChange={(e) => update("sv", e.target.value)}
            />
          </Field>
          <Field label="Trạng thái">
            <select
              aria-label="Trạng thái"
              value={supportOnly ? "can-ho-tro" : "tat-ca"}
              onChange={(e) => update("loc", e.target.value)}
            >
              <option value="tat-ca">Tất cả sinh viên</option>
              <option value="can-ho-tro">Cần hỗ trợ</option>
            </select>
          </Field>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Mã sinh viên</th>
                  <th>Hoàn thành</th>
                  <th>Điểm bài tập</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                    </td>
                    <td>{s.code}</td>
                    <td>
                      <Progress value={s.progress} label />
                    </td>
                    <td>{s.grade.toFixed(1)}</td>
                    <td>
                      <span
                        className={supportReason(s) ? "dean-attention" : ""}
                      >
                        {supportReason(s) ||
                          (s.progress === 100 ? "Hoàn thành" : "Đang học")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Không có sinh viên phù hợp"
            description="Thay đổi tên tìm kiếm hoặc bộ lọc trạng thái."
            action={
              <button
                className="button secondary"
                onClick={() => setParams({ ky: term })}
              >
                Xóa bộ lọc
              </button>
            }
          />
        )}
      </Panel>
    </>
  );
}
