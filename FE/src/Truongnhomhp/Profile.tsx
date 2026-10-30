import { Button, Field, PageHeader, Panel } from "../shared/UI";
import { useDemo } from "../data/DemoProvider";

export function LeaderProfile() {
  const { data, setData, notify } = useDemo();
  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Thông tin tài khoản Trưởng nhóm HP"
      />
      <Panel title="Thông tin cá nhân">
        <form
          className="leader-profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const name = String(form.get("name") || "").trim();
            if (!name) return;
            setData((d) => ({
              ...d,
              leaderProfile: {
                name,
                email: String(form.get("email")).trim(),
                phone: String(form.get("phone")).trim(),
              },
            }));
            notify("Đã lưu hồ sơ trên trình duyệt này.");
          }}
        >
          <Field label="Họ và tên">
            <input
              name="name"
              required
              pattern=".*\S.*"
              title="Nhập họ và tên, không chỉ khoảng trắng."
              autoComplete="name"
              defaultValue={data.leaderProfile.name}
            />
          </Field>
          <Field label="Email">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={data.leaderProfile.email}
            />
          </Field>
          <Field label="Số điện thoại">
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Nhập số điện thoại"
              defaultValue={data.leaderProfile.phone}
            />
          </Field>
          <p className="muted">Mã tài khoản: TN001 · Trưởng nhóm HP</p>
          <Button variant="secondary" type="submit">
            Lưu thông tin
          </Button>
        </form>
      </Panel>
    </>
  );
}
