import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Users,
  BookOpen,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useAccount } from "../shared/AccountProvider";
const items = [
  { path: "tai-khoan", name: "Tài khoản", Icon: Users },
  { path: "hoc-phan", name: "Học phần & lớp", Icon: BookOpen },
  { path: "nhac-han", name: "Nhắc hạn học tập", Icon: Bell },
];
export function AdminLayout() {
  const { account, signOut } = useAccount(),
    location = useLocation();
  const [open, setOpen] = useState(false),
    [popup, setPopup] = useState("");
  const header = useRef<HTMLElement>(null);
  const current =
    items.find((i) => location.pathname.includes("/" + i.path))?.name ||
    "Quản trị";
  useEffect(() => {
    setOpen(false);
    setPopup("");
  }, [location.key]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        header.current
          ?.querySelector<HTMLButtonElement>('[aria-expanded="true"]')
          ?.focus();
        setPopup("");
        setOpen(false);
      }
    };
    const outside = (e: PointerEvent) => {
      if (e.target instanceof Node && !header.current?.contains(e.target))
        setPopup("");
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  return (
    <div className="app admin-workspace">
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
      <aside id="admin-sidebar" className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <img src="/brand/vju-long.jpg" alt="Vietnam Japan University" />
          <button
            className="mobile-only icon-button"
            aria-label="Đóng điều hướng"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace-label">
          <Users size={24} />
          <div>
            <strong>VJU Learning</strong>
            <small>Quản trị hệ thống</small>
          </div>
        </div>
        <nav aria-label="Điều hướng chính">
          {items.map(({ path, name, Icon }) => (
            <NavLink
              key={path}
              to={"/admin/" + path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="user-block">
          <img className="admin-seal" src="/brand/vju-seal.jpeg" alt="VJU" />
          <div>
            <strong>{account?.name}</strong>
            <small>Admin</small>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar" ref={header}>
          <div className="breadcrumb">
            <button
              className="mobile-only icon-button"
              aria-label="Mở menu"
              aria-expanded={open}
              aria-controls="admin-sidebar"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <div className="section-menu">
              <button
                className="section-switch"
                aria-label={`Chuyển mục: ${current}`}
                aria-expanded={popup === "navigation"}
                onClick={() =>
                  setPopup(popup === "navigation" ? "" : "navigation")
                }
              >
                {current}
                <ChevronDown size={14} />
              </button>
              {popup === "navigation" && (
                <nav
                  className="dropdown quick-nav"
                  aria-label="Di chuyển nhanh"
                >
                  {items.map((i) => (
                    <Link key={i.path} to={"/admin/" + i.path}>
                      {i.name}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          </div>
          <div className="topbar-actions">
            <div className="notification-menu">
              <button
                className="icon-button"
                aria-label="Thông báo"
                aria-expanded={popup === "notifications"}
                onClick={() =>
                  setPopup(popup === "notifications" ? "" : "notifications")
                }
              >
                <Bell size={20} />
              </button>
              {popup === "notifications" && (
                <div
                  className="dropdown notification-popover"
                  role="dialog"
                  aria-label="Thông báo"
                >
                  <div className="notification-popover-heading">
                    <h2>Thông báo</h2>
                    <button
                      className="icon-button"
                      aria-label="Đóng bảng thông báo"
                      onClick={() => setPopup("")}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p className="admin-help">Chưa có thông báo quản trị mới.</p>
                  <Link className="notice-preview-row" to="/admin/nhac-han">
                    Kiểm tra nhắc hạn học tập
                  </Link>
                </div>
              )}
            </div>
            <Link className="button secondary small" to="/doi-mat-khau">
              Đổi mật khẩu
            </Link>
            <Link
              className="icon-button"
              aria-label="Đăng xuất"
              to="/dang-nhap"
              onClick={signOut}
            >
              <LogOut size={19} />
            </Link>
          </div>
        </header>
        <main id="main" className="page-content admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
