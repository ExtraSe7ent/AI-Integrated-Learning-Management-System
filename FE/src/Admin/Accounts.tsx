import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Upload, ArrowLeft } from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import {
  PageHeader,
  Panel,
  Field,
  Button,
  SearchField,
  Badge,
  Empty,
  Dialog,
} from "../shared/UI";
import {
  roleNames,
  previewAccounts,
  importAccounts,
  updateUser,
} from "./model";
import type { ImportRow } from "./model";
import type { Role } from "../data/fixtures";
import { readSheet, downloadTemplate } from "./excel";
export function AdminAccounts() {
  const { data } = useDemo();
  const [query, setQuery] = useState(""),
    [role, setRole] = useState("all"),
    [status, setStatus] = useState("all");
  const rows = data.admin.users.filter(
    (u) =>
      (u.id + " " + u.name + " " + u.email)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (role === "all" || u.role === role) &&
      (status === "all" || String(u.active) === status),
  );
  return (
    <>
      <PageHeader
        title="Quản lý tài khoản"
        description="Tìm tài khoản, phân quyền và quản lý trạng thái truy cập."
        action={
          <Link className="button" to="/admin/tai-khoan/import">
            <Upload size={17} />
            Import tài khoản
          </Link>
        }
      />
      <Panel>
        <div className="toolbar">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Tìm mã, họ tên hoặc email…"
          />
          <Field label="Vai trò">
            <select
              aria-label="Vai trò"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="all">Tất cả vai trò</option>
              {Object.entries(roleNames).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select
              aria-label="Trạng thái"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Vô hiệu hoá</option>
            </select>
          </Field>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã tài khoản</th>
                  <th>Họ tên / Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.id}</strong>
                    </td>
                    <td>
                      <strong>{u.name}</strong>
                      <p className="muted">{u.email}</p>
                    </td>
                    <td>{roleNames[u.role]}</td>
                    <td>
                      <Badge tone={u.active ? "green" : "amber"}>
                        {u.active ? "Hoạt động" : "Vô hiệu hoá"}
                      </Badge>
                      {u.mustChange && (
                        <small className="admin-line">Cần đổi mật khẩu</small>
                      )}
                    </td>
                    <td>
                      {u.kind !== "admin" && (
                        <Link
                          className="text-link"
                          to={"/admin/tai-khoan/" + encodeURIComponent(u.id)}
                        >
                          Quản lý
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Không tìm thấy tài khoản"
            description="Thử từ khóa khác hoặc bỏ bộ lọc."
          />
        )}
      </Panel>
      <p className="muted">
        {rows.length} tài khoản · Vô hiệu hoá giữ nguyên dữ liệu học tập.
      </p>
    </>
  );
}
export function AdminImportAccounts() {
  const { data, setData } = useDemo();
  const [kind, setKind] = useState<"student" | "teacher">("student"),
    [rows, setRows] = useState<ImportRow[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(0);
  const navigate = useNavigate();
  const invalid = rows.filter((r) => r.errors.length).length;
  return (
    <>
      <PageHeader
        title="Import tài khoản"
        description="Chọn tệp → Kiểm tra dữ liệu → Xác nhận nhập."
        action={
          <Link className="text-link" to="/admin/tai-khoan">
            <ArrowLeft size={16} />
            Tài khoản
          </Link>
        }
      />
      {done ? (
        <Panel title="Đã nhập tài khoản">
          <p>
            Đã tạo {done} tài khoản. Mật khẩu mặc định:{" "}
            <strong>12345678</strong>. Người dùng phải đổi mật khẩu khi đăng
            nhập lần đầu.
          </p>
          <Button onClick={() => navigate("/admin/tai-khoan")}>
            Xem danh sách tài khoản
          </Button>
        </Panel>
      ) : (
        <>
          <Panel title="Chọn danh sách">
            <div className="admin-form">
              <Field label="Loại tài khoản">
                <select
                  aria-label="Loại tài khoản"
                  disabled={busy}
                  value={kind}
                  onChange={(e) => {
                    setKind(e.target.value as typeof kind);
                    setRows([]);
                    setError("");
                  }}
                >
                  <option value="student">Sinh viên</option>
                  <option value="teacher">Giảng viên</option>
                </select>
              </Field>
              <p className="muted">
                {kind === "student"
                  ? "Cột bắt buộc: Mã SV, Họ tên, Email."
                  : "Cột bắt buộc: Mã GV, Họ tên, Email, Khoa."}{" "}
                Tối đa 5000 dòng, 5 MB; dữ liệu phải hợp lệ toàn bộ trước khi
                nhập.
              </p>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await downloadTemplate(kind);
                  } catch {
                    setError("Không tải được mẫu. Hãy thử lại.");
                  }
                }}
              >
                Tải file mẫu XLSX
              </Button>
              <Field label="File Excel (.xlsx)">
                <input
                  key={kind}
                  type="file"
                  accept=".xlsx"
                  disabled={busy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    setRows([]);
                    setError("");
                    if (!file) return;
                    setBusy(true);
                    try {
                      setRows(
                        previewAccounts(
                          data.admin,
                          await readSheet(file),
                          kind,
                        ),
                      );
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Không đọc được tệp.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </Field>
              {busy && <p role="status">Đang kiểm tra dữ liệu…</p>}
              {error && (
                <p className="error-text" role="alert">
                  {error}
                </p>
              )}
            </div>
          </Panel>
          {rows.length > 0 && (
            <Panel
              title={`Xem trước · ${rows.length - invalid} hợp lệ / ${invalid} lỗi`}
            >
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Dòng</th>
                      <th>Mã</th>
                      <th>Họ tên</th>
                      <th>Email / Khoa</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.line}>
                        <td>{r.line}</td>
                        <td>{r.user.id}</td>
                        <td>{r.user.name}</td>
                        <td>
                          {r.user.email}
                          <small className="admin-line">{r.user.faculty}</small>
                        </td>
                        <td>
                          {r.errors.length ? (
                            <span className="error-text">
                              {r.errors.join("; ")}
                            </span>
                          ) : (
                            <Badge tone="green">Hợp lệ</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invalid > 0 && (
                <p className="error-text">
                  Sửa các dòng lỗi trong tệp rồi chọn lại. Chưa có tài khoản nào
                  được tạo.
                </p>
              )}
              <Button
                disabled={invalid > 0 || busy}
                onClick={() => {
                  try {
                    const next = importAccounts(data.admin, rows);
                    setData((d) => ({ ...d, admin: next }));
                    setDone(rows.length);
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                Xác nhận nhập {rows.length} tài khoản
              </Button>
            </Panel>
          )}
          {!busy && !rows.length && !error && (
            <p className="muted">Chọn tệp để kiểm tra và xem trước dữ liệu.</p>
          )}
        </>
      )}
    </>
  );
}
export function AdminAccountDetail() {
  const { id } = useParams(),
    { data, setData, notify } = useDemo();
  const user = data.admin.users.find((u) => u.id === id);
  const [role, setRole] = useState<Role | "">(""),
    [confirm, setConfirm] = useState("");
  if (!user || user.kind === "admin")
    return (
      <Empty
        title="Không có tài khoản cần quản lý"
        action={
          <Link className="button" to="/admin/tai-khoan">
            Về danh sách
          </Link>
        }
      />
    );
  function apply(change: Parameters<typeof updateUser>[2]) {
    try {
      const next = updateUser(data.admin, user!.id, change);
      setData((d) => ({ ...d, admin: next }));
      notify("Đã cập nhật tài khoản.");
      setConfirm("");
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <>
      <PageHeader
        title={`Quản lý tài khoản ${user.id}`}
        description={`${user.name} · ${user.email} · ${user.faculty}`}
        action={
          <Link className="text-link" to="/admin/tai-khoan">
            Về danh sách
          </Link>
        }
      />
      <Panel title="Vai trò và truy cập">
        <div className="admin-form">
          {user.kind === "teacher" ? (
            <>
              <Field label="Vai trò">
                <select
                  aria-label="Vai trò"
                  value={role || user.role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  {(
                    ["giang-vien", "truong-nhom-hp", "truong-khoa"] as Role[]
                  ).map((r) => (
                    <option key={r} value={r}>
                      {roleNames[r]}
                    </option>
                  ))}
                </select>
              </Field>
              <Button
                onClick={() => apply({ role: (role || user.role) as Role })}
              >
                Lưu vai trò
              </Button>
            </>
          ) : (
            <p>
              Vai trò: Sinh viên. Tài khoản giảng viên mới được gán vai trò quản
              lý.
            </p>
          )}
          <hr />
          <h2>Reset mật khẩu</h2>
          <p>
            Mật khẩu trở về mặc định và tài khoản phải đổi mật khẩu ở lần đăng
            nhập tiếp theo.
          </p>
          <Button variant="secondary" onClick={() => setConfirm("reset")}>
            Reset mật khẩu
          </Button>
          <hr />
          <h2>
            {user.active ? "Vô hiệu hoá tài khoản" : "Kích hoạt tài khoản"}
          </h2>
          <p>
            Chặn đăng nhập và giữ nguyên toàn bộ dữ liệu. Có thể kích hoạt lại
            sau.
          </p>
          <Button variant="secondary" onClick={() => setConfirm("active")}>
            {user.active ? "Vô hiệu hoá" : "Kích hoạt lại"}
          </Button>
        </div>
      </Panel>
      {confirm && (
        <Dialog
          title={
            confirm === "reset"
              ? "Xác nhận reset mật khẩu"
              : user.active
                ? "Xác nhận vô hiệu hoá"
                : "Xác nhận kích hoạt"
          }
          onClose={() => setConfirm("")}
        >
          <p>
            {user.id} · {user.name}
          </p>
          <p>
            {confirm === "reset"
              ? "Mật khẩu mặc định: 12345678. Tài khoản sẽ phải đổi mật khẩu."
              : "Dữ liệu học tập và hồ sơ vẫn được giữ nguyên."}
          </p>
          <div className="row-actions">
            <Button variant="secondary" onClick={() => setConfirm("")}>
              Hủy
            </Button>
            <Button
              onClick={() =>
                apply(
                  confirm === "reset"
                    ? { passwordHash: "", mustChange: true }
                    : { active: !user.active },
                )
              }
            >
              Xác nhận
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
