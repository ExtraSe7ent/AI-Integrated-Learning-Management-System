import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X, LogOut, CheckCheck } from "lucide-react";
import { useAccount } from "../shared/AccountProvider";
import { LeaderIcon, useLeaderScope } from "./UI";
const navigation = [
  ["tong-quan", "Tổng quan", "dashboard", "dashboardActive"],
  ["chuan-hoa", "Chuẩn hoá", "book", "bookActive"],
  ["so-sanh", "So sánh lớp", "book", "bookActive"],
  ["yeu-cau", "Yêu cầu điều chỉnh", "alert", "alertActive"],
  ["hoc-lieu", "Học liệu", "book", "bookActive"],
  ["tai-lieu", "Tài liệu tham khảo", "book", "bookActive"],
] as const;
type Popup = "navigation" | "notifications" | "account" | null;
export function LeaderLayout() {
  const { data, state, setData, link } = useLeaderScope();
  const { signOut } = useAccount();
  const location = useLocation();
  const [open, setOpen] = useState(false),
    [popup, setPopup] = useState<Popup>(null);
  const header = useRef<HTMLElement>(null),
    menu = useRef<HTMLButtonElement>(null);
  const title =
    navigation.find((n) => n[0] === location.pathname.split("/")[2])?.[1] ||
    "Hồ sơ cá nhân";
  const notices = state.requests
    .filter((r) => !r.closed)
    .map((r) => ({
      request: r,
      item: state.items.find((i) => i.id === r.itemId),
    }))
    .filter((n) => n.item);
  useEffect(() => {
    setOpen(false);
    setPopup(null);
  }, [location.key]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (popup)
        header.current
          ?.querySelector<HTMLButtonElement>(
            `button[aria-controls="leader-${popup}"]`,
          )
          ?.focus();
      else if (open) menu.current?.focus();
      setPopup(null);
      setOpen(false);
    };
    const outside = (e: PointerEvent) => {
      if (
        popup &&
        e.target instanceof Element &&
        e.target
          .closest("[data-leader-menu]")
          ?.getAttribute("data-leader-menu") !== popup
      )
        setPopup(null);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open, popup]);
  const toggle = (value: Popup) => setPopup(popup === value ? null : value);
  return (
    <div className="app leader-workspace">
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Đóng menu"
          onClick={() => {
            setOpen(false);
            menu.current?.focus();
          }}
        />
      )}
      <aside id="leader-sidebar" className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <img src="/brand/vju-long.jpg" alt="Vietnam Japan University" />
          <button
            className="mobile-only icon-button"
            aria-label="Đóng điều hướng"
            onClick={() => {
              setOpen(false);
              menu.current?.focus();
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <LeaderIcon name="workspace" />
          <div>
            <strong>VJU Learning</strong>
            <small>Điều phối học phần</small>
          </div>
        </div>
        <p className="leader-role-label">Trưởng nhóm HP</p>
        <nav aria-label="Điều hướng chính">
          {navigation.map(([path, label, icon, active]) => (
            <NavLink
              key={path}
              to={link(path)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <LeaderIcon name={isActive ? active : icon} />
                  <span>{label}</span>
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
          <LeaderIcon name="user" />
          <div>
            <strong>{data.leaderProfile.name}</strong>
            <small>Trưởng nhóm HP</small>
          </div>
        </Link>
      </aside>
      <div className="app-main">
        <header className="topbar" ref={header}>
          <div className="breadcrumb">
            <button
              ref={menu}
              className="mobile-only icon-button"
              aria-label="Mở menu"
              aria-controls="leader-sidebar"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="section-menu" data-leader-menu="navigation">
              <button
                className="section-switch"
                aria-label={`Chuyển mục: ${title}`}
                aria-controls="leader-navigation"
                aria-expanded={popup === "navigation"}
                onClick={() => toggle("navigation")}
              >
                {title}
              </button>
              {popup === "navigation" && (
                <nav
                  className="dropdown quick-nav"
                  id="leader-navigation"
                  aria-label="Di chuyển nhanh"
                >
                  {navigation.map(([path, label]) => (
                    <Link key={path} to={link(path)}>
                      {label}
                    </Link>
                  ))}
                  <Link to={link("ho-so")}>Hồ sơ cá nhân</Link>
                </nav>
              )}
            </div>
          </div>
          <div className="topbar-actions">
            <div className="notification-menu" data-leader-menu="notifications">
              <button
                className="icon-button notification-button"
                aria-label="Thông báo"
                aria-controls="leader-notifications"
                aria-expanded={popup === "notifications"}
                onClick={() => toggle("notifications")}
              >
                <LeaderIcon name="bell" />
                {!data.readLeaderNotices && notices.length > 0 && <i />}
              </button>
              {popup === "notifications" && (
                <div
                  className="dropdown notification-popover"
                  id="leader-notifications"
                  role="dialog"
                  aria-label="Thông báo"
                >
                  <div className="notification-popover-heading">
                    <h2>Thông báo</h2>
                    <button
                      className="icon-button"
                      aria-label="Đóng bảng thông báo"
                      onClick={() => {
                        setPopup(null);
                        header.current
                          ?.querySelector<HTMLButtonElement>(
                            '[aria-controls="leader-notifications"]',
                          )
                          ?.focus();
                      }}
                    >
                      <X size={17} />
                    </button>
                  </div>
                  <button
                    className="text-link mark-notices"
                    disabled={data.readLeaderNotices || !notices.length}
                    onClick={() =>
                      setData((d) => ({ ...d, readLeaderNotices: true }))
                    }
                  >
                    <CheckCheck size={16} />
                    Đánh dấu đã đọc
                  </button>
                  <div className="notification-popover-list">
                    {notices.map(({ request: r, item: i }) => (
                      <Link
                        className="notice-preview-row"
                        key={r.id}
                        to={link(`chuan-hoa/${i!.classId}/hoc-lieu/${i!.id}`, {
                          hp: i!.courseId,
                        })}
                      >
                        <span>
                          <strong>
                            {i!.classId} ·{" "}
                            {r.reply ? "Đã có phản hồi" : "Đang chờ điều chỉnh"}
                          </strong>
                          <small>{r.body}</small>
                        </span>
                        {!data.readLeaderNotices && <i className="small-dot" />}
                      </Link>
                    ))}
                    {!notices.length && <p>Không có yêu cầu đang mở.</p>}
                  </div>
                </div>
              )}
            </div>
            <div className="role-menu" data-leader-menu="account">
              <button
                className="icon-button"
                aria-label="Tài khoản"
                aria-controls="leader-account"
                aria-expanded={popup === "account"}
                onClick={() => toggle("account")}
              >
                <LeaderIcon name="down" />
              </button>
              {popup === "account" && (
                <div id="leader-account" className="dropdown account-dropdown">
                  <span>{data.leaderProfile.name}</span>
                  <Link to={link("ho-so")}>Hồ sơ cá nhân</Link>
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
          className="page-content leader-content"
          key={location.pathname}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
