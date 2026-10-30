import { Link } from "react-router-dom";
import { useDemo } from "../data/DemoProvider";
import { Empty, Field, PageHeader, Panel, Progress } from "../shared/UI";
import { facultyClasses, supportRows } from "./data";
import { DeanIcon, TermFilter, useFacultyScope } from "./UI";

export function DeanAlerts() {
  const { data } = useDemo();
  const { term, link, params, setParams } = useFacultyScope();
  const classes = facultyClasses(data, term);
  const courseId = params.get("hp") || "",
    classId = params.get("lop") || "",
    query = params.get("q") || "";
  const courseOptions = [
    ...new Map(classes.map((c) => [c.course.id, c.course])).values(),
  ];
  const classOptions = classes.filter(
    (c) => !courseId || c.course.id === courseId,
  );
  const scoped = classOptions.filter((c) => !classId || c.id === classId);
  const rows = supportRows(scoped).filter((a) =>
    (a.student.name + a.student.code)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const students = new Set(rows.map((a) => a.student.id)).size;
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "hp") next.delete("lop");
    setParams(next, { replace: key === "q" });
  }
  return (
    <>
      <PageHeader
        title="Cảnh báo học tập"
        description={`${students} sinh viên cần hỗ trợ · ${rows.length} cảnh báo theo từng lớp`}
      />
      <div className="dean-filters">
        <TermFilter />
        <Field label="Học phần">
          <select
            aria-label="Học phần"
            value={courseId}
            onChange={(e) => change("hp", e.target.value)}
          >
            <option value="">Tất cả học phần</option>
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.title}
              </option>
            ))}
            {courseId && !courseOptions.some((c) => c.id === courseId) && (
              <option value={courseId}>Học phần ngoài phạm vi</option>
            )}
          </select>
        </Field>
        <Field label="Lớp học">
          <select
            aria-label="Lớp học"
            value={classId}
            onChange={(e) => change("lop", e.target.value)}
          >
            <option value="">Tất cả lớp</option>
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}
              </option>
            ))}
            {classId && !classOptions.some((c) => c.id === classId) && (
              <option value={classId}>Lớp ngoài phạm vi</option>
            )}
          </select>
        </Field>
      </div>
      <p className="dean-threshold">
        Ngưỡng theo dõi: hoàn thành tự học dưới 50% hoặc điểm bài tập dưới 5.
      </p>
      <Panel title="Sinh viên cần hỗ trợ">
        <div className="dean-alert-search">
          <Field label="Tìm sinh viên">
            <input
              value={query}
              placeholder="Tên hoặc mã sinh viên…"
              onChange={(e) => change("q", e.target.value)}
            />
          </Field>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Lớp học</th>
                  <th>Hoàn thành</th>
                  <th>Điểm bài tập</th>
                  <th>Lý do</th>
                  <th>
                    <span className="visually-hidden">Chi tiết</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ student: s, classroom: c, reason }) => (
                  <tr key={`${c.id}-${s.id}`}>
                    <td>
                      <strong>{s.name}</strong>
                      <p>{s.code}</p>
                    </td>
                    <td>{c.id}</td>
                    <td>
                      <Progress value={s.progress} label />
                    </td>
                    <td>{s.grade.toFixed(1)}</td>
                    <td>
                      <span className="dean-attention">{reason}</span>
                    </td>
                    <td>
                      <Link
                        aria-label={`Xem ${s.name} trong lớp ${c.id}`}
                        to={link(`hoc-phan/${c.course.id}/lop/${c.id}`, {
                          sv: s.code,
                        })}
                      >
                        <DeanIcon name="right" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Không có sinh viên cần hỗ trợ trong phạm vi này"
            description="Thử học kỳ, học phần hoặc lớp khác; bạn cũng có thể xóa bộ lọc hiện tại."
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
