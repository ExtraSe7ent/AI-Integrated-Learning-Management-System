import { useEffect, useRef, useState } from "react";
import {
  NavLink,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart3,
  MessageSquare,
  Sparkles,
  Radio,
  FolderOpen,
  CalendarDays,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Settings2,
  ListChecks,
  Users,
  CircleHelp,
  CheckCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import { useAccount } from "./AccountProvider";
export const studentNav: [string, string, LucideIcon][] = [
  ["tong-quan", "Tổng quan", LayoutDashboard],
  ["khoa-hoc", "Khóa học của tôi", BookOpen],
  ["tu-hoc", "Phiên tự học", ListChecks],
  ["bai-tap", "Bài tập", ClipboardList],
  ["tren-lop", "Lớp học trực tiếp", Radio],
  ["diem-so", "Kết quả học tập", BarChart3],
];
export const teacherNav: [string, string, LucideIcon][] = [
  ["tong-quan", "Tổng quan", LayoutDashboard],
  ["lop-hoc", "Lớp giảng dạy", BookOpen],
  ["bai-hoc", "Bài học & học liệu", FolderOpen],
  ["phien-tu-hoc", "Phiên tự học", ListChecks],
  ["bai-tap", "Bài tập & kiểm tra", ClipboardList],
  ["ngan-hang-cau-hoi", "Ngân hàng câu hỏi", MessageSquare],
  ["tren-lop", "Lớp học trực tiếp", Radio],
  ["tien-do", "Theo dõi học tập", Users],
  ["diem-so", "Bảng điểm", BarChart3],
];
export function Layout() {
  const { signOut } = useAccount();
  const location = useLocation(),
    navigate = useNavigate();
  const teacher = location.pathname.startsWith("/giang-vien");
  const role = teacher ? "giang-vien" : "sinh-vien";
  const { data, setData } = useDemo();
  const notices = teacher ? data.teacherNotices : data.notices;
  const noticesRead = teacher ? data.readTeacherNotices : data.readNotices;
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false),
    [popup, setPopup] = useState<
      "navigation" | "notifications" | "account" | null
    >(null),
    [search, setSearch] = useState("");
  const nav = teacher ? teacherNav : studentNav;
  const shortcuts = [
    ...nav.map(([path, label]) => [path, label]),
    ["tro-ly-ai", "Trợ lý AI"],
    ...(!teacher
      ? [["luyen-tap", "Luyện tập"]]
      : [["phuc-khao", "Yêu cầu phúc khảo"]]),
    ["tai-lieu", "Tài liệu tham khảo"],
    ["phan-hoi", "Phản hồi & hỗ trợ"],
    ["ho-so", "Hồ sơ cá nhân"],
  ];
  const section = location.pathname.split("/")[2];
  const detailTitles: Record<string, string> = {
    hoc: "Học bài",
    "lam-bai": "Làm bài tập",
    "ket-qua": "Kết quả bài tập",
    "soan-bai": "Soạn bài học",
    "tao-bai-tap": "Tạo bài tập",
    "cham-bai": "Chấm bài",
  };
  const title =
    shortcuts.find(([path]) => path === section)?.[1] ||
    detailTitles[section] ||
    "Tổng quan";
  useEffect(() => {
    setPopup(location.state?.notifications ? "notifications" : null);
    setOpen(false);
  }, [location.key]);
  useEffect(() => {
    if (!popup) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target
          .closest("[data-header-menu]")
          ?.getAttribute("data-header-menu") !== popup
      )
        setPopup(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        headerRef.current
          ?.querySelector<HTMLButtonElement>(
            `button[aria-controls="${popup}-panel"]`,
          )
          ?.focus();
        setPopup(null);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [popup]);
  return (
    <div
      className={`app ${teacher ? "teacher-workspace" : "student-workspace"}`}
    >
      <a href="#main" className="skip-link">
        Đến nội dung chính
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${open ? "is-open" : ""}`}
        data-figma="Sidebar"
      >
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
          <span className="workspace-mark">
            <GraduationCap size={18} />
          </span>
          <div>
            <strong>VJU Learning</strong>
            <small>
              {teacher ? "Không gian giảng dạy" : "Không gian học tập"}
            </small>
          </div>
        </div>
        <div className="semester-selector">
          <CalendarDays size={16} />
          <span>Học kỳ I · 2026–2027</span>
          <ChevronDown size={14} />
        </div>
        <nav aria-label="Điều hướng chính">
          <span className="nav-label">{teacher ? "GIẢNG DẠY" : "HỌC TẬP"}</span>
          {nav.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={`/${role}/${path}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
              {path === "bai-tap" && (
                <b className="nav-count">{data.assignments.length}</b>
              )}
            </NavLink>
          ))}
          <span className="nav-label nav-space">TIỆN ÍCH</span>
          <NavLink
            className="nav-item"
            to={`/${role}/tro-ly-ai`}
            onClick={() => setOpen(false)}
          >
            <Sparkles size={19} />
            <span>Trợ lý AI</span>
          </NavLink>
          {!teacher && (
            <NavLink
              className="nav-item"
              to="/sinh-vien/luyen-tap"
              onClick={() => setOpen(false)}
            >
              <ListChecks size={19} />
              <span>Luyện tập</span>
            </NavLink>
          )}
          <NavLink
            className="nav-item"
            to={`/${role}/tai-lieu`}
            onClick={() => setOpen(false)}
          >
            <FolderOpen size={19} />
            <span>Tài liệu tham khảo</span>
          </NavLink>
          <NavLink
            className="nav-item"
            to={`/${role}/phan-hoi`}
            onClick={() => setOpen(false)}
          >
            <CircleHelp size={19} />
            <span>Phản hồi & hỗ trợ</span>
          </NavLink>
          {teacher && (
            <NavLink
              className="nav-item"
              to="/giang-vien/phuc-khao"
              onClick={() => setOpen(false)}
            >
              <Settings2 size={19} />
              <span>Yêu cầu phúc khảo</span>
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <Link
            to={`/${role}/ho-so`}
            className="user-block"
            onClick={() => setOpen(false)}
          >
            <span className="avatar">{teacher ? "MA" : "QA"}</span>
            <div>
              <strong>
                {teacher ? data.teacherProfile.name : data.profile.name}
              </strong>
              <small>{teacher ? "Giảng viên" : "23110149 · Sinh viên"}</small>
            </div>
            <ChevronDown size={15} />
          </Link>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar" data-figma="Topbar" ref={headerRef}>
          <div className="breadcrumb">
            <button
              className="mobile-only icon-button"
              aria-label="Mở menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="section-menu" data-header-menu="navigation">
              <button
                className="section-switch"
                aria-label={`Chuyển mục: ${title}`}
                aria-expanded={popup === "navigation"}
                aria-controls="navigation-panel"
                onClick={() =>
                  setPopup(popup === "navigation" ? null : "navigation")
                }
              >
                <span>{title}</span>
                <ChevronDown size={15} />
              </button>
              {popup === "navigation" && (
                <nav
                  className="dropdown quick-nav"
                  id="navigation-panel"
                  aria-label="Di chuyển nhanh"
                >
                  {shortcuts.map(([path, label]) => (
                    <Link
                      key={path}
                      to={`/${role}/${path}`}
                      aria-current={path === section ? "page" : undefined}
                      onClick={() => setPopup(null)}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          </div>
          <div className="topbar-actions">
            <form
              className="global-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(
                  `/${role}/${teacher ? "lop-hoc" : "khoa-hoc"}?q=${encodeURIComponent(search)}`,
                );
              }}
            >
              <Search size={16} />
              <input
                aria-label="Tìm khóa học"
                placeholder="Tìm khóa học…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>↵</kbd>
            </form>
            <div className="notification-menu" data-header-menu="notifications">
              <button
                className="icon-button notification-button"
                aria-label="Thông báo"
                aria-expanded={popup === "notifications"}
                aria-controls="notifications-panel"
                onClick={() =>
                  setPopup(popup === "notifications" ? null : "notifications")
                }
              >
                <Bell size={20} />
                {!noticesRead && <i />}
              </button>
              {popup === "notifications" && (
                <div
                  className="dropdown notification-popover"
                  id="notifications-panel"
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
                    disabled={noticesRead}
                    onClick={() =>
                      setData((d) => ({
                        ...d,
                        [teacher ? "readTeacherNotices" : "readNotices"]: true,
                      }))
                    }
                  >
                    <CheckCheck size={16} />
                    Đánh dấu đã đọc
                  </button>
                  <div className="notification-popover-list">
                    {notices.map((notice, i) => (
                      <Link
                        key={i}
                        className="notice-preview-row"
                        to={`/${role}/${teacher ? ["cham-bai", "phan-hoi", "lop-hoc/cs301"][i] : "tu-hoc"}`}
                        onClick={() => setPopup(null)}
                      >
                        <span className="task-icon">
                          <Bell size={17} />
                        </span>
                        <span>
                          <strong>{notice}</strong>
                          <small>Cập nhật từ lớp học</small>
                        </span>
                        {!noticesRead && <i className="small-dot" />}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="role-menu" data-header-menu="account">
              <button
                className="role-switch"
                aria-label="Tài khoản"
                aria-expanded={popup === "account"}
                aria-controls="account-panel"
                onClick={() => setPopup(popup === "account" ? null : "account")}
              >
                Tài khoản
                <ChevronDown size={14} />
              </button>
              {popup === "account" && (
                <div className="dropdown account-dropdown" id="account-panel">
                  <span>
                    {teacher ? data.teacherProfile.name : data.profile.name}
                  </span>
                  <Link
                    to={`/${role}/ho-so`}
                    onClick={() => {
                      setPopup(null);
                      setOpen(false);
                    }}
                  >
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    to="/doi-mat-khau"
                    onClick={() => {
                      setPopup(null);
                      setOpen(false);
                    }}
                  >
                    Đổi mật khẩu
                  </Link>
                  <Link
                    to="/dang-nhap"
                    onClick={() => {
                      setPopup(null);
                      signOut();
                    }}
                  >
                    <LogOut size={15} />
                    Đăng xuất
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
        <main id="main" className="page-content" key={location.pathname}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>VJU Learning · Cùng học, cùng tiến bộ.</span>
        </footer>
      </div>
    </div>
  );
}
