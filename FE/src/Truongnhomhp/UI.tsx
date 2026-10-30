import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useDemo } from "../data/DemoProvider";
import { courses } from "../data/fixtures";
import { Empty, Field } from "../shared/UI";
import { assignedCourses, classes, levels } from "./model";
const assets = {
  workspace: "dean/2f342.svg",
  dashboard: "course-leader/558d8.svg",
  dashboardActive: "dean/ff887.svg",
  book: "dean/fe25a.svg",
  bookActive: "course-leader/adeac.svg",
  alert: "dean/0a132.svg",
  alertActive: "course-leader/5fd9e.svg",
  user: "dean/a267e.svg",
  bell: "dean/0fefc.svg",
  down: "dean/b3f51.svg",
  right: "dean/6044b.svg",
};
export function LeaderIcon({ name }: { name: keyof typeof assets }) {
  return (
    <img
      className="leader-icon"
      src={`/figma/${assets[name]}`}
      alt=""
      aria-hidden="true"
    />
  );
}
export function useLeaderScope() {
  const { data, setData, notify } = useDemo();
  const [params, setParams] = useSearchParams();
  const courseId = params.get("hp") || "cs301";
  const course = assignedCourses.includes(courseId)
    ? courses.find((c) => c.id === courseId)
    : undefined;
  const link = (path: string, extra: Record<string, string> = {}) =>
    `/truong-nhom-hp/${path}?${new URLSearchParams({ hp: courseId, ...extra })}`;
  const act = (
    change: (s: typeof data.coordination) => typeof data.coordination,
    message: string,
  ) => {
    try {
      const next = change(data.coordination);
      setData((d) => ({ ...d, coordination: next, readLeaderNotices: false }));
      notify(message);
      return true;
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Không thể lưu thay đổi.",
      );
      return false;
    }
  };
  return {
    data,
    state: data.coordination,
    setData,
    notify,
    params,
    setParams,
    courseId,
    course,
    link,
    act,
    classrooms: classes.filter((c) => c.courseId === course?.id),
  };
}
export function CourseFilter({ disabled = false }: { disabled?: boolean }) {
  const { courseId, setParams } = useLeaderScope();
  const location = useLocation(),
    navigate = useNavigate();
  return (
    <Field label="Học phần">
      <select
        aria-label="Học phần"
        disabled={disabled}
        value={courseId}
        onChange={(e) => {
          if (location.pathname.includes("/chuan-hoa/"))
            navigate("/truong-nhom-hp/chuan-hoa?hp=" + e.target.value);
          else setParams({ hp: e.target.value });
        }}
      >
        {!assignedCourses.includes(courseId) && (
          <option value={courseId}>Học phần không thuộc phân công</option>
        )}
        {courses
          .filter((c) => assignedCourses.includes(c.id))
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.title}
            </option>
          ))}
      </select>
    </Field>
  );
}
export function Level({ value }: { value: number }) {
  return (
    <span className={`leader-level level-${value}`}>
      M{value} · {levels[value]}
    </span>
  );
}
export function MissingScope() {
  return (
    <Empty
      title="Không tìm thấy nội dung trong phạm vi phân công"
      description="Chọn lại học phần hoặc mở lớp từ danh sách."
      action={
        <Link
          className="button secondary"
          to="/truong-nhom-hp/tong-quan?hp=cs301"
        >
          Về học phần được phân công
        </Link>
      }
    />
  );
}
