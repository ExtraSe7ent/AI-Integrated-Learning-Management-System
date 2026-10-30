import { useAccount } from "./AccountProvider";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Users,
  Clock3,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { courses } from "../data/fixtures";
import type { Course } from "../data/fixtures";
import { Badge, Progress } from "./UI";
export function CourseCard({
  course,
  teacher = false,
}: {
  course: Course;
  teacher?: boolean;
}) {
  return (
    <Link
      to={`/${teacher ? "giang-vien/lop-hoc" : "sinh-vien/khoa-hoc"}/${course.id}`}
      className="course-card"
      data-figma="Course card"
    >
      <div className={`course-cover ${course.color}`}>
        <span className="course-code">{course.code}</span>
        <span className="course-cover-title" title={course.title}>
          {course.title}
        </span>
        <ArrowUpRight size={22} />
      </div>
      <div className="course-card-body">
        <div className="course-meta">
          <span>Học kỳ I · 3 tín chỉ</span>
          <Badge tone="green">Đang diễn ra</Badge>
        </div>
        <h3>{course.title}</h3>
        <p>{course.teacher}</p>
        <div className="course-detail">
          <span>
            <Users size={15} />
            {course.students} sinh viên
          </span>
          <span>
            <BookOpen size={15} />
            12 bài học
          </span>
        </div>
        <Progress value={course.progress} label />
        <div className="course-card-footer">
          <span>{teacher ? "Xem lớp học" : "Tiếp tục học"}</span>
          <ArrowRight size={17} />
        </div>
      </div>
    </Link>
  );
}
export function CourseContext({ teacher: requested }: { teacher?: boolean }) {
  const { account } = useAccount();
  const teacher = requested ?? account?.role === "giang-vien";
  return (
    <div className="course-context">
      <Link
        to={`/${teacher ? "giang-vien/lop-hoc" : "sinh-vien/khoa-hoc"}/cs301`}
      >
        CSE301
      </Link>
      <span>Phát triển ứng dụng nâng cao</span>
      <Badge>HK I · 2026–2027</Badge>
    </div>
  );
}
export function Schedule() {
  return (
    <div className="schedule-list">
      {courses.slice(0, 2).map((c, i) => (
        <div className="schedule-item" key={c.id}>
          <div className="schedule-time">
            <strong>{i ? "15:45" : "13:00"}</strong>
            <span>{i ? "17:15" : "15:30"}</span>
          </div>
          <div className="schedule-divider" />
          <div>
            <strong>{c.title}</strong>
            <p>
              {c.room.split(" · ")[0]} · {i ? "Thực hành" : "Lý thuyết"}
            </p>
            <span className={`schedule-tag ${c.color}`}>
              <Clock3 size={12} />
              {i ? "Sắp tới" : "Hôm nay"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
