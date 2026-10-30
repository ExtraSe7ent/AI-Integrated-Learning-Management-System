import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X, CheckCheck, LogOut } from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import { useAccount } from "../shared/AccountProvider";
import { DeanIcon, useFacultyScope } from "./UI";
import { facultyClasses, facultyName, supportRows } from "./data";

const navigation = [
  {
    path: "tong-quan",
    label: "Tổng quan khoa",
    icon: "dashboard",
    activeIcon: "dashboardActive",
  },
  {
    path: "hoc-phan",
    label: "Học phần",
    icon: "book",
    activeIcon: "bookActive",
  },
  {
    path: "canh-bao",
    label: "Cảnh báo học tập",
    icon: "alert",
    activeIcon: "alertActive",
  },
] as const;
type Popup = "navigation" | "notifications" | "account" | null;

export function DeanLayout() {
  const { data, setData } = useDemo(),
    { signOut } = useAccount();
  const { term, link } = useFacultyScope(),
    location = useLocation();
  const [open, setOpen] = useState(false),
    [popup, setPopup] = useState<Popup>(null);
  const header = useRef<HTMLElement>(null);
  const section = location.pathname.split("/")[2];
  const title =
    navigation.find((n) => n.path === section)?.label || "Hồ sơ cá nhân";
  const alerts = supportRows(facultyClasses(data, term));
  const notices = alerts.filter(
    (a, index) =>
      alerts.findIndex((other) => other.student.id === a.student.id) === index,
  );
  useEffect(() => {
    setOpen(false);
    setPopup(null);
  }, [location.key]);
  useEffect(() => {
    if (!popup) return;
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target
          .closest("[data-dean-menu]")
          ?.getAttribute("data-dean-menu") !== popup
      )
        setPopup(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      header.current
        ?.querySelector<HTMLButtonElement>(
          `button[aria-controls="dean-${popup}"]`,
        )
        ?.focus();
      setPopup(null);
      setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [popup]);
  useEffect(() => {
    if (!open) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        header.current
          ?.querySelector<HTMLButtonElement>('[aria-label="Mở menu"]')
          ?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  function toggle(value: Popup) {
    setPopup(popup === value ? null : value);
  }
  return (
    <div className="app dean-workspace">
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside id="dean-sidebar" className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <img src="/brand/vju-long.jpg" alt="Vietnam Japan University" />
          <button
            className="mobile-only icon-button"
            aria-label="Đóng điều hướng"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <DeanIcon name="workspace" />
          <div>
            <strong>VJU Learning</strong>
            <small>Không gian quản lý khoa</small>
          </div>
        </div>
        <p className="dean-faculty-name">{facultyName}</p>
        <nav aria-label="Điều hướng chính">
          {navigation.map((n) => (
            <NavLink
              key={n.path}
              to={link(n.path)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <DeanIcon name={isActive ? n.activeIcon : n.icon} />
                  <span>{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <Link
          className="user-block"
          to={link("ho-so")}
          onClick={() => setOpen(false)}
        >
          <DeanIcon name="user" />
          <div>
            <strong>{data.deanProfile.name}</strong>
            <small>Trưởng khoa</small>
          </div>
        </Link>
      </aside>
      <div className="app-main">
        <header className="topbar" ref={header}>
          <div className="breadcrumb">
            <button
              className="mobile-only icon-button"
              aria-label="Mở menu"
              aria-controls="dean-sidebar"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="section-menu" data-dean-menu="navigation">
              <button
                className="section-switch"
                aria-label={`Chuyển mục: ${title}`}
                aria-controls="dean-navigation"
                aria-expanded={popup === "navigation"}
                onClick={() => toggle("navigation")}
              >
                {title}
              </button>
              {popup === "navigation" && (
                <nav
                  className="dropdown quick-nav"
                  id="dean-navigation"
                  aria-label="Di chuyển nhanh"
                >
                  {navigation.map((n) => (
                    <Link
                      key={n.path}
                      to={link(n.path)}
                      onClick={() => setPopup(null)}
                    >
                      {n.label}
                    </Link>
                  ))}
                  <Link to={link("ho-so")} onClick={() => setPopup(null)}>
                    Hồ sơ cá nhân
                  </Link>
                </nav>
              )}
            </div>
          </div>
          <div className="topbar-actions">
            <div className="notification-menu" data-dean-menu="notifications">
              <button
                className="icon-button notification-button"
                aria-label="Thông báo"
                aria-controls="dean-notifications"
                aria-expanded={popup === "notifications"}
                onClick={() => toggle("notifications")}
              >
                <DeanIcon name="bell" />
                {!data.readDeanNotices && notices.length > 0 && <i />}
              </button>
              {popup === "notifications" && (
                <div
                  className="dropdown notification-popover"
                  id="dean-notifications"
                  role="dialog"
                  aria-label="Thông báo"
                >
                  <div className="notification-popover-heading">
                    <h2>Thông báo</h2>
                    <button
                      className="icon-button"
                      aria-label="Đóng bảng thông báo"
                      onClick={() => setPopup(null)}
                    >
                      <X size={17} />
                    </button>
                  </div>
                  <button
                    className="text-link mark-notices"
                    disabled={data.readDeanNotices || !notices.length}
                    onClick={() =>
                      setData((d) => ({ ...d, readDeanNotices: true }))
                    }
                  >
                    <CheckCheck size={16} />
                    Đánh dấu đã đọc
                  </button>
                  <div className="notification-popover-list">
                    {notices.length ? (
                      notices.map((a) => (
                        <Link
                          className="notice-preview-row"
                          key={a.student.id}
                          to={link(
                            `hoc-phan/${a.classroom.course.id}/lop/${a.classroom.id}`,
                            { sv: a.student.code },
                          )}
                        >
                          <span>
                            <strong>{a.student.name}</strong>
                            <small>
                              {a.classroom.id} · {a.reason}
                            </small>
                          </span>
                          {!data.readDeanNotices && <i className="small-dot" />}
                        </Link>
                      ))
                    ) : (
                      <p className="dean-no-notices">
                        Không có cảnh báo trong học kỳ đang chọn.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="role-menu" data-dean-menu="account">
              <button
                className="icon-button"
                aria-label="Tài khoản"
                aria-expanded={popup === "account"}
                aria-controls="dean-account"
                onClick={() => toggle("account")}
              >
                <DeanIcon name="down" />
              </button>
              {popup === "account" && (
                <div className="dropdown account-dropdown" id="dean-account">
                  <span>{data.deanProfile.name}</span>
                  <Link to={link("ho-so")} onClick={() => setPopup(null)}>
                    Hồ sơ cá nhân
                  </Link>
                  <Link to="/doi-mat-khau">Đổi mật khẩu</Link>
                  <Link to="/dang-nhap" onClick={signOut}>
                    <LogOut size={15} />
                    Đăng xuất
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
        <main
          id="main"
          className="page-content dean-content"
          key={location.pathname}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
