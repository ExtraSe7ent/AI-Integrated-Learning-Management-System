import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  CheckCircle2,
  FileText,
  Clock3,
  ArrowRight,
  Download,
} from "lucide-react";
import { useScope } from "../shared/useScope";
import { classOfLesson } from "../data/scope";
import { useDemo } from "../data/DemoProvider";
import { CourseCard } from "../shared/CourseComponents";
import {
  PageHeader,
  SearchField,
  Panel,
  Badge,
  Progress,
  Empty,
  Journey,
} from "../shared/UI";
export function KhoaHoc({ teacher = false }: { teacher?: boolean }) {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const { courses } = useScope();
  const filtered = courses.filter((c) =>
    (c.title + c.code).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title={teacher ? "Lớp giảng dạy" : "Khóa học của tôi"}
        description={
          teacher
            ? "Tổ chức học liệu, đồng hành cùng từng lớp học."
            : "Không gian học tập của bạn trong học kỳ này."
        }
      />
      <div className="toolbar">
        <div className="tabs">
          <button className="selected">
            Đang diễn ra <span>{courses.length}</span>
          </button>
        </div>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Tìm tên hoặc mã học phần…"
        />
      </div>
      {filtered.length ? (
        <div className="course-grid full">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} teacher={teacher} />
          ))}
        </div>
      ) : (
        <Empty
          title={courses.length ? "Không tìm thấy khóa học" : "Chưa có học phần"}
          description={
            courses.length
              ? "Thử mã học phần hoặc một từ khóa khác."
              : teacher
                ? "Bạn chưa được Admin phân công phụ trách lớp nào."
                : "Bạn chưa được ghi danh vào lớp nào."
          }
          action={
            <button className="button secondary" onClick={() => setQuery("")}>
              Xóa bộ lọc
            </button>
          }
        />
      )}
      <div className="info-line">
        <BookOpen size={17} />
        Chỉ hiển thị các lớp bạn {teacher ? "phụ trách" : "đã được ghi danh"}.
      </div>
    </>
  );
}
export function ChiTietKhoaHoc({ teacher = false }: { teacher?: boolean }) {
  const { id } = useParams();
  const { courses, classes, lessons } = useScope();
  const course = courses.find((c) => c.id === id);
  const { data } = useDemo();
  const role = teacher ? "giang-vien" : "sinh-vien";
  const [week, setWeek] = useState(7);
  if (!course)
    return (
      <Empty
        title="Không tìm thấy học phần"
        description={`Học phần này không thuộc các lớp bạn ${teacher ? "phụ trách" : "đã được ghi danh"}.`}
        action={
          <Link className="button secondary" to={`/${role}/${teacher ? "lop-hoc" : "khoa-hoc"}`}>
            Về danh sách
          </Link>
        }
      />
    );
  const courseClasses = classes.filter((c) => c.courseId === course.id);
  const courseLessons = lessons.filter((l) =>
    courseClasses.some((c) => c.id === classOfLesson(l)),
  );
  // The weekly outline below is the CSE301 demo; any other course lists its own lessons.
  const demo = course.id === "cs301";
  return (
    <>
      <div className="back-link">
        <Link to={`/${role}/${teacher ? "lop-hoc" : "khoa-hoc"}`}>
          Khóa học
        </Link>
        <ChevronRight size={14} />
        {course.code}
      </div>
      <PageHeader
        title={course.title}
        description={`${course.code} · ${course.teacher} · ${course.students} sinh viên`}
        action={<Badge tone="green">Đang diễn ra</Badge>}
      />
      <div className="course-tabs">
        <Link
          className="selected"
          to={`/${role}/${teacher ? "lop-hoc" : "khoa-hoc"}/${course.id}`}
        >
          Nội dung lớp
        </Link>
        <Link to={`/${role}/${teacher ? "phien-tu-hoc" : "tu-hoc"}`}>
          Tự học
        </Link>
        <Link to={`/${role}/bai-tap`}>Bài tập</Link>
        <Link to={`/${role}/${teacher ? "tien-do" : "diem-so"}`}>
          {teacher ? "Tiến độ" : "Điểm số"}
        </Link>
        <Link to={`/${role}/phan-hoi`}>Hỏi đáp</Link>
      </div>
      <div className="course-detail-grid">
        <div>
          <Panel
            title="Nội dung học phần"
            action={
              teacher ? (
                <Link className="button small" to="/giang-vien/soan-bai">
                  Soạn bài học
                </Link>
              ) : (
                <span className="muted">12 tuần học</span>
              )
            }
          >
            {!demo &&
              (courseLessons.length ? (
                [...courseLessons]
                  .sort((a, b) => (a.week ?? 99) - (b.week ?? 99) || a.order - b.order)
                  .map((l, i) => (
                  <Link
                    className="activity-row"
                    key={l.id}
                    to={teacher ? `/giang-vien/soan-bai?bai=${l.id}` : `/${role}/tu-hoc`}
                  >
                    <span className="week-number">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{l.week ? `Tuần ${l.week} · ` : ""}{l.title}</strong>
                      <p>{l.slides?.length ?? 0} trang</p>
                    </div>
                    <Badge tone={l.published ? "green" : "neutral"}>
                      {l.published ? "Đã công bố" : "Bản nháp"}
                    </Badge>
                    <ArrowRight size={17} />
                  </Link>
                ))
              ) : (
                <Empty
                  title="Chưa có bài học"
                  description={
                    teacher
                      ? "Vào “Bài học & học liệu” để tạo bài học cho lớp của học phần này."
                      : "Giảng viên chưa công bố bài học."
                  }
                  action={
                    teacher ? (
                      <Link className="button secondary" to="/giang-vien/bai-hoc">
                        Tạo bài học
                      </Link>
                    ) : undefined
                  }
                />
              ))}
            {demo && [5, 6, 7, 8].map((w) => (
              <div className="week-section" key={w}>
                <button
                  className={`week-header ${week === w ? "expanded" : ""}`}
                  onClick={() => setWeek(week === w ? 0 : w)}
                >
                  <span className="week-number">
                    {String(w).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>
                      {w === 7
                        ? "Thiết kế RESTful API"
                        : w === 6
                          ? "Kiến trúc ứng dụng web"
                          : w === 5
                            ? "Nền tảng phát triển ứng dụng"
                            : "Xác thực và phân quyền"}
                    </strong>
                    <small>
                      Tuần {w} · {w === 7 ? "3 hoạt động" : "2 hoạt động"}
                    </small>
                  </div>
                  {w < 7 ? (
                    <CheckCircle2 size={19} className="green-text" />
                  ) : (
                    <ChevronRight size={19} />
                  )}
                </button>
                {week === w && (
                  <div className="week-content">
                    <Journey />
                    <Link
                      className="activity-row"
                      to={`/${role}/${teacher ? "soan-bai" : "hoc/cs301"}`}
                    >
                      <span className="activity-icon">
                        <FileText size={20} />
                      </span>
                      <div>
                        <strong>Bài giảng: RESTful API</strong>
                        <p>4 trang · Câu hỏi theo từng trang</p>
                      </div>
                      <Badge tone="green">Đã công bố</Badge>
                      <ArrowRight size={17} />
                    </Link>
                    <Link
                      className="activity-row"
                      to={`/${role}/${teacher ? "phien-tu-hoc" : "tu-hoc"}`}
                    >
                      <span className="activity-icon sage">
                        <BookOpen size={20} />
                      </span>
                      <div>
                        <strong>Phiên tự học trước lớp</strong>
                        <p>Đọc bài và hoàn thành câu hỏi</p>
                      </div>
                      <Badge tone="amber">Đang mở</Badge>
                      <ArrowRight size={17} />
                    </Link>
                    <Link className="activity-row" to={`/${role}/bai-tap`}>
                      <span className="activity-icon sand">
                        <Clock3 size={20} />
                      </span>
                      <div>
                        <strong>Bài tập: Thiết kế API quản lý thư viện</strong>
                        <p>30 phút · Tính điểm</p>
                      </div>
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </Panel>
        </div>
        <aside>
          <Panel title={teacher ? "Thông tin lớp học" : "Tiến độ của bạn"}>
            <Progress value={course.progress} label />
            <p className="muted">8/12 hoạt động đã hoàn thành</p>
            <hr />
            <dl className="detail-list">
              <div>
                <dt>Lịch học</dt>
                <dd>{course.time}</dd>
              </div>
              <div>
                <dt>Địa điểm</dt>
                <dd>{course.room}</dd>
              </div>
              <div>
                <dt>Tín chỉ</dt>
                <dd>3 tín chỉ</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Lớp học phần">
            {courseClasses.map((c) => (
              <div className="resource-mini" key={c.id}>
                <BookOpen size={18} />
                <span>
                  {c.name} · HK {c.term} · {c.year}
                  {teacher && ` · ${c.studentIds.length} sinh viên`}
                </span>
              </div>
            ))}
          </Panel>
          <Panel title="Tài liệu của lớp">
            {data.resources.map((r) => (
              <a
                className="resource-mini"
                href={r.url}
                target="_blank"
                rel="noreferrer"
                key={r.id}
              >
                <FileText size={18} />
                <span>{r.title}</span>
                <Download size={15} />
              </a>
            ))}
          </Panel>
        </aside>
      </div>
    </>
  );
}
