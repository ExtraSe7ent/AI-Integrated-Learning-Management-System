import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useDemo } from "../data/DemoProvider";
import {
  PageHeader,
  Panel,
  Field,
  Button,
  SearchField,
  Empty,
} from "../shared/UI";
import {
  saveCourse,
  saveClass,
  previewEnrollment,
  enrollStudents,
} from "./model";
import type { ManagedCourse, ManagedClass } from "./model";
import { readSheet, downloadTemplate } from "./excel";
export function AdminCourses() {
  const { data } = useDemo();
  const [query, setQuery] = useState("");
  const rows = data.admin.courses.filter((c) =>
    (c.code + " " + c.title + " " + c.faculty)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Học phần & lớp"
        description="Quản lý học phần, lớp mở và người phụ trách."
        action={
          <Link className="button" to="/admin/hoc-phan/tao">
            Tạo học phần
          </Link>
        }
      />
      <Panel>
        <div className="toolbar">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Tìm học phần…"
          />
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã học phần</th>
                  <th>Tên học phần</th>
                  <th>Khoa</th>
                  <th>Lớp</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.code}</strong>
                    </td>
                    <td>{c.title}</td>
                    <td>{c.faculty}</td>
                    <td>
                      {
                        data.admin.classes.filter((l) => l.courseId === c.id)
                          .length
                      }
                    </td>
                    <td>
                      <Link
                        className="text-link"
                        to={"/admin/hoc-phan/" + c.id}
                      >
                        Mở học phần
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Không tìm thấy học phần"
            description="Thử từ khóa khác hoặc tạo học phần mới."
          />
        )}
      </Panel>
    </>
  );
}
export function AdminCourseEditor() {
  const { courseId } = useParams(),
    { data, setData, notify } = useDemo();
  const navigate = useNavigate(),
    existing = data.admin.courses.find((c) => c.id === courseId);
  const [error, setError] = useState("");
  if (courseId && !existing)
    return (
      <Empty
        title="Không tìm thấy học phần"
        action={
          <Link className="button" to="/admin/hoc-phan">
            Về học phần
          </Link>
        }
      />
    );
  return (
    <>
      <PageHeader
        title={
          existing ? `${existing.code} · ${existing.title}` : "Tạo học phần"
        }
        action={
          <Link className="text-link" to="/admin/hoc-phan">
            Về danh sách
          </Link>
        }
      />
      <Panel title="Thông tin học phần">
        <form
          key={existing?.id || "new"}
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const c: ManagedCourse = {
              id: existing?.id || crypto.randomUUID(),
              code: String(f.get("code")),
              title: String(f.get("title")),
              faculty: String(f.get("faculty")),
            };
            try {
              const next = saveCourse(data.admin, c);
              setData((d) => ({ ...d, admin: next }));
              notify("Đã lưu học phần.");
              navigate("/admin/hoc-phan/" + c.id);
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <Field label="Mã học phần">
            <input
              name="code"
              required
              maxLength={30}
              defaultValue={existing?.code}
            />
          </Field>
          <Field label="Tên học phần">
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={existing?.title}
            />
          </Field>
          <Field label="Khoa">
            <input
              name="faculty"
              required
              maxLength={200}
              defaultValue={existing?.faculty}
            />
          </Field>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <Button>Lưu học phần</Button>
        </form>
      </Panel>
      {existing && (
        <Panel
          title="Lớp học"
          action={
            <Link
              className="button secondary"
              to={"/admin/lop/tao?hp=" + existing.id}
            >
              Tạo lớp
            </Link>
          }
        >
          {data.admin.classes.some((c) => c.courseId === existing.id) ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Lớp</th>
                    <th>Học kỳ / Năm học / Đợt</th>
                    <th>Giảng viên</th>
                    <th>Trưởng nhóm HP</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.admin.classes
                    .filter((c) => c.courseId === existing.id)
                    .map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name}</strong>
                        </td>
                        <td>
                          {c.term} · {c.year} · {c.round}
                        </td>
                        <td>
                          {data.admin.users.find((u) => u.id === c.teacherId)
                            ?.name || "Chưa phân công"}
                        </td>
                        <td>
                          {data.admin.users.find((u) => u.id === c.leaderId)
                            ?.name || "Chưa phân công"}
                        </td>
                        <td>
                          <Link className="text-link" to={"/admin/lop/" + c.id}>
                            Mở lớp
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Học phần chưa có lớp"
              description="Tạo lớp để phân công giảng viên và ghi danh sinh viên."
            />
          )}
        </Panel>
      )}
    </>
  );
}
export function AdminClassEditor() {
  const { classId } = useParams(),
    [params] = useSearchParams(),
    { data, setData, notify } = useDemo(),
    navigate = useNavigate();
  const cls = data.admin.classes.find((c) => c.id === classId),
    courseId = cls?.courseId || params.get("hp") || "",
    course = data.admin.courses.find((c) => c.id === courseId);
  const [error, setError] = useState("");
  if (!course || (classId && !cls))
    return (
      <Empty
        title="Không tìm thấy lớp hoặc học phần"
        action={
          <Link className="button" to="/admin/hoc-phan">
            Về học phần
          </Link>
        }
      />
    );
  return (
    <>
      <PageHeader
        title={cls ? "Lớp " + cls.name : "Tạo lớp"}
        description={course.code + " · " + course.title}
        action={
          <Link className="text-link" to={"/admin/hoc-phan/" + courseId}>
            Về học phần
          </Link>
        }
      />
      <Panel title="Thông tin lớp và phân công">
        <form
          key={cls?.id || courseId}
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              c: ManagedClass = {
                id: cls?.id || crypto.randomUUID(),
                courseId,
                name: String(f.get("name")).trim(),
                term: String(f.get("term")),
                year: String(f.get("year")),
                round: String(f.get("round")),
                teacherId: String(f.get("teacher")),
                leaderId: String(f.get("leader")),
                studentIds: cls?.studentIds || [],
              };
            try {
              const next = saveClass(data.admin, c);
              setData((d) => ({ ...d, admin: next }));
              notify("Đã lưu lớp.");
              navigate("/admin/lop/" + c.id);
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <Field label="Tên lớp">
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={cls?.name}
            />
          </Field>
          <div className="admin-form-row">
            <Field label="Học kỳ">
              <select
                aria-label="Học kỳ"
                name="term"
                defaultValue={cls?.term || "I"}
              >
                <option>I</option>
                <option>II</option>
                <option>Hè</option>
              </select>
            </Field>
            <Field label="Năm học">
              <input
                name="year"
                required
                defaultValue={cls?.year || "2026–2027"}
              />
            </Field>
            <Field label="Đợt">
              <input
                name="round"
                type="number"
                min={1}
                required
                defaultValue={cls?.round || "1"}
              />
            </Field>
          </div>
          <Field label="Giảng viên">
            <select
              aria-label="Giảng viên"
              name="teacher"
              required
              defaultValue={cls?.teacherId || ""}
            >
              <option value="">Chọn giảng viên</option>
              {data.admin.users
                .filter((u) => u.active && u.kind === "teacher")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.id} · {u.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Trưởng nhóm HP">
            <select
              aria-label="Trưởng nhóm HP"
              name="leader"
              defaultValue={cls?.leaderId || ""}
            >
              <option value="">Chưa phân công</option>
              {data.admin.users
                .filter((u) => u.active && u.role === "truong-nhom-hp")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.id} · {u.name}
                  </option>
                ))}
            </select>
          </Field>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <Button>Lưu lớp</Button>
        </form>
      </Panel>
      {cls && (
        <Panel
          title={`Sinh viên trong lớp · ${cls.studentIds.length}`}
          action={
            <Link
              className="button secondary"
              to={"/admin/lop/" + cls.id + "/import"}
            >
              Import sinh viên vào lớp
            </Link>
          }
        >
          {cls.studentIds.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mã SV</th>
                    <th>Họ tên</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {cls.studentIds.map((id) => {
                    const u = data.admin.users.find((u) => u.id === id);
                    return (
                      <tr key={id}>
                        <td>{id}</td>
                        <td>{u?.name}</td>
                        <td>{u?.email}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Lớp chưa có sinh viên"
              description="Import danh sách mã SV sau khi tài khoản đã được tạo."
            />
          )}
        </Panel>
      )}
    </>
  );
}
export function AdminEnrollment() {
  const { classId } = useParams(),
    { data, setData } = useDemo();
  const cls = data.admin.classes.find((c) => c.id === classId);
  const [rows, setRows] = useState<ReturnType<typeof previewEnrollment>>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  if (!cls)
    return (
      <Empty
        title="Không tìm thấy lớp"
        action={
          <Link className="button" to="/admin/hoc-phan">
            Về học phần
          </Link>
        }
      />
    );
  return (
    <>
      <PageHeader
        title={"Import sinh viên vào lớp " + cls.name}
        description="Chỉ nhận tài khoản SV đang hoạt động; bước này không tạo tài khoản mới."
        action={
          <Link className="text-link" to={"/admin/lop/" + cls.id}>
            Về lớp học
          </Link>
        }
      />
      {done ? (
        <Panel title="Đã cập nhật danh sách lớp">
          <p>
            Đã thêm {rows.length} sinh viên vào lớp {cls.name}.
          </p>
          <Link className="button" to={"/admin/lop/" + cls.id}>
            Xem danh sách lớp
          </Link>
        </Panel>
      ) : (
        <>
          <Panel title="Danh sách ghi danh">
            <div className="admin-form">
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await downloadTemplate("enroll");
                  } catch {
                    setError("Không tải được file mẫu.");
                  }
                }}
              >
                Tải file mẫu XLSX
              </Button>
              <Field label="File Excel (.xlsx)">
                <input
                  type="file"
                  accept=".xlsx"
                  disabled={busy}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    setRows([]);
                    setError("");
                    if (!f) return;
                    setBusy(true);
                    try {
                      setRows(
                        previewEnrollment(
                          data.admin,
                          cls.id,
                          await readSheet(f),
                        ),
                      );
                    } catch (err) {
                      setError((err as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </Field>
              {busy && <p role="status">Đang kiểm tra danh sách…</p>}
              {error && (
                <p role="alert" className="error-text">
                  {error}
                </p>
              )}
            </div>
          </Panel>
          {rows.length > 0 && (
            <Panel title="Xem trước danh sách">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Dòng</th>
                      <th>Mã SV</th>
                      <th>Sinh viên</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.line}>
                        <td>{r.line}</td>
                        <td>{r.id}</td>
                        <td>{r.name}</td>
                        <td className={r.error ? "error-text" : ""}>
                          {r.error || "Hợp lệ"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                disabled={rows.some((r) => r.error) || busy}
                onClick={() => {
                  try {
                    const next = enrollStudents(data.admin, cls.id, rows);
                    setData((d) => ({ ...d, admin: next }));
                    setDone(true);
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                Xác nhận thêm vào lớp
              </Button>
            </Panel>
          )}
        </>
      )}
    </>
  );
}
