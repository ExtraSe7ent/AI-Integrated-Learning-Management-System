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
import { courses } from "../data/fixtures";
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
            Đang diễn ra <span>3</span>
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
          title="Không tìm thấy khóa học"
          description="Thử mã học phần hoặc một từ khóa khác."
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
  const course = courses.find((c) => c.id === id) || courses[0];
  const { data } = useDemo();
  const role = teacher ? "giang-vien" : "sinh-vien";
  const [week, setWeek] = useState(7);
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
            {[5, 6, 7, 8].map((w) => (
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
