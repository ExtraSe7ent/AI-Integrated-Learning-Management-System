import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, ShieldCheck, LockKeyhole } from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import { PageHeader, Panel, Button, Field, Badge, Dialog } from "./UI";
import { useAccount } from "./AccountProvider";
import { accountHome } from "../data/accounts";
export function DangNhap() {
  const { signIn } = useAccount();
  const [help, setHelp] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Link to="/sinh-vien/tong-quan">
          <img src="/brand/vju-long.jpg" alt="Vietnam Japan University" />
        </Link>
        <div>
          <span className="auth-mark">
            <BookOpen size={32} />
          </span>
          <h1>
            Học tập và giảng dạy
            <br />
            tại VJU.
          </h1>
          <p>
            Nơi sinh viên học tập, giảng viên chia sẻ kiến thức và theo dõi lớp
            học.
          </p>
          <div className="auth-journey">
            <span>Học liệu</span>
            <ArrowRight size={18} />
            <span>Bài tập</span>
            <ArrowRight size={18} />
            <span>Lớp học</span>
          </div>
        </div>
        <small>VJU Learning · Vietnam Japan University</small>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <h2>Chào mừng trở lại</h2>
          <p>Đăng nhập vào VJU Learning.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const account = signIn(
                String(f.get("username")),
                String(f.get("password")),
              );
              if (!account) {
                setError(
                  "Mã tài khoản hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.",
                );
                return;
              }
              navigate(accountHome(account.role), { replace: true });
            }}
          >
            <Field label="Mã tài khoản">
              <input
                name="username"
                required
                autoComplete="username"
                placeholder="Nhập mã tài khoản"
              />
            </Field>
            <Field label="Mật khẩu">
              <input
                name="password"
                required
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
              />
            </Field>
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <button
              type="button"
              className="text-link forgot"
              onClick={() => setHelp(true)}
            >
              Quên mật khẩu?
            </button>
            <Button type="submit">
              Đăng nhập
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="auth-disclaimer">
            <ShieldCheck size={17} />
            Sử dụng tài khoản do nhà trường cấp để đăng nhập.
          </p>
          <Link className="text-link" to="/doi-mat-khau">
            Đổi mật khẩu lần đầu
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
      {help && (
        <Dialog title="Khôi phục tài khoản" onClose={() => setHelp(false)}>
          <p>
            Liên hệ quản trị viên phụ trách LMS của trường để được cấp lại mật
            khẩu. Chuẩn bị mã sinh viên hoặc mã giảng viên của bạn.
          </p>
          <Button onClick={() => setHelp(false)}>Đã hiểu</Button>
        </Dialog>
      )}
    </div>
  );
}
export function DoiMatKhau() {
  const { account } = useAccount();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  return (
    <div className="password-page">
      <img src="/brand/vju-long.jpg" alt="VJU" />
      <Panel>
        <LockKeyhole size={28} />
        <h1>Đặt mật khẩu mới</h1>
        <p>Đặt mật khẩu riêng để bảo vệ tài khoản của bạn.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            if (f.get("password") !== f.get("confirm")) {
              setError("Hai mật khẩu chưa khớp. Vui lòng nhập lại.");
              return;
            }
            navigate(account ? accountHome(account.role) : "/dang-nhap");
          }}
        >
          <Field label="Mật khẩu mới" hint="Ít nhất 8 ký tự.">
            <input
              name="password"
              minLength={8}
              required
              type="password"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Nhập lại mật khẩu">
            <input
              name="confirm"
              minLength={8}
              required
              type="password"
              autoComplete="new-password"
            />
          </Field>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <Button>
            Tiếp tục
            <ArrowRight size={16} />
          </Button>
        </form>
      </Panel>
    </div>
  );
}
export function HoSo({ teacher = false }: { teacher?: boolean }) {
  const { data, setData, notify } = useDemo();
  const profile = teacher ? data.teacherProfile : data.profile;
  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Thông tin tài khoản trong không gian VJU Learning."
      />
      <div className="profile-layout">
        <Panel>
          <div className="profile-avatar">{teacher ? "MA" : "QA"}</div>
          <h2>{profile.name}</h2>
          <Badge tone="red">{teacher ? "Giảng viên" : "Sinh viên"}</Badge>
          <hr />
          <dl className="detail-list">
            <div>
              <dt>Mã tài khoản</dt>
              <dd>{teacher ? "GV001" : "23110149"}</dd>
            </div>
            <div>
              <dt>Đơn vị</dt>
              <dd>Khoa Công nghệ tiên tiến</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>Đang hoạt động</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Thông tin cá nhân">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setData((d) => ({
                ...d,
                [teacher ? "teacherProfile" : "profile"]: {
                  name: String(f.get("name")),
                  email: String(f.get("email")),
                  phone: String(f.get("phone")),
                  major: profile.major,
                },
              }));
              notify("Đã lưu hồ sơ trên trình duyệt này.");
            }}
          >
            <div className="form-grid">
              <Field label="Họ và tên">
                <input required name="name" defaultValue={profile.name} />
              </Field>
              <Field label="Email">
                <input
                  required
                  name="email"
                  type="email"
                  defaultValue={profile.email}
                />
              </Field>
              <Field label="Số điện thoại">
                <input name="phone" type="tel" defaultValue={profile.phone} />
              </Field>
              <Field label={teacher ? "Chuyên môn" : "Ngành học"}>
                <input readOnly value={profile.major} />
              </Field>
            </div>
            <Button>Lưu thông tin</Button>
          </form>
          <hr />
          <h3>Bảo mật tài khoản</h3>
          <Link className="button secondary" to="/doi-mat-khau">
            Đổi mật khẩu
          </Link>
        </Panel>
      </div>
    </>
  );
}
