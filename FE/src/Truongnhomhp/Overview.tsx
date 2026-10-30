import { Link, useParams } from "react-router-dom";
import { PageHeader, Panel, MetricStrip, Button } from "../shared/UI";
import {
  canComplete,
  classFor,
  classItems,
  completeClass,
  kinds,
  levels,
} from "./model";
import {
  CourseFilter,
  LeaderIcon,
  Level,
  MissingScope,
  useLeaderScope,
} from "./UI";
export function LeaderOverview({
  standardization = false,
}: {
  standardization?: boolean;
}) {
  const { state, courseId, course, classrooms, link } = useLeaderScope();
  const items = state.items.filter((i) => i.courseId === course?.id);
  return (
    <>
      <PageHeader
        title={standardization ? "Chuẩn hoá học phần" : "Tổng quan chuẩn hoá"}
        description="Theo dõi học liệu và các lớp trong học phần được phân công."
      />
      <CourseFilter />
      {!course ? (
        <MissingScope />
      ) : (
        <>
          <MetricStrip
            items={[
              {
                label: "Lớp phụ trách",
                value: String(classrooms.length).padStart(2, "0"),
                note: "Trong học phần",
              },
              {
                label: "Học liệu đạt chuẩn",
                value: `${String(items.filter((i) => i.level === 3).length).padStart(2, "0")}/${String(items.length).padStart(2, "0")}`,
                note: "Slide, quiz và bài tập",
              },
              {
                label: "Cần điều chỉnh",
                value: String(
                  items.filter((i) => i.level === 2).length,
                ).padStart(2, "0"),
                note: "Đang chờ phản hồi",
              },
            ]}
          />
          <Panel title="Các lớp cùng học phần">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Lớp học</th>
                    <th>Giảng viên</th>
                    {Object.values(kinds).map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                    <th>
                      <span className="visually-hidden">Rà soát</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {classrooms.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={link("chuan-hoa/" + c.id)}>{c.id}</Link>
                        {state.completed.includes(c.id) && (
                          <small className="leader-completed">
                            Đã hoàn thành chuẩn hoá
                          </small>
                        )}
                      </td>
                      <td>{c.teacher}</td>
                      {Object.keys(kinds).map((kind) => {
                        const group = classItems(state, courseId, c.id).filter(
                          (i) => i.kind === kind,
                        );
                        return (
                          <td key={kind}>
                            {group.length
                              ? group.map((i) => (
                                  <Link
                                    key={i.id}
                                    className="leader-level-link"
                                    to={link(
                                      `chuan-hoa/${c.id}/hoc-lieu/${i.id}`,
                                    )}
                                    title={i.title}
                                  >
                                    <Level value={i.level} />
                                  </Link>
                                ))
                              : "Chưa có học liệu"}
                          </td>
                        );
                      })}
                      <td>
                        <Link
                          aria-label={`Rà soát lớp ${c.id}`}
                          to={link("chuan-hoa/" + c.id)}
                        >
                          <LeaderIcon name="right" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <p className="leader-legend">
            {levels.map((l, i) => (
              <span key={l}>
                M{i} · {l}
              </span>
            ))}
          </p>
        </>
      )}
    </>
  );
}
export function LeaderClass() {
  const { classId = "" } = useParams();
  const { state, courseId, course, link, act } = useLeaderScope();
  const classroom = classFor(courseId, classId);
  const items = classItems(state, courseId, classId),
    done = state.completed.includes(classId);
  return (
    <>
      <PageHeader
        title={`Chuẩn hoá lớp ${classId}`}
        description={
          classroom && course
            ? `${course.code} · ${course.title} · ${classroom.teacher}`
            : undefined
        }
      />
      <CourseFilter />
      {!classroom ? (
        <MissingScope />
      ) : (
        <>
          <nav className="leader-context" aria-label="Vị trí trong học phần">
            <Link to={link("chuan-hoa")}>Học phần</Link>
            <span>/</span>
            <span>{classId}</span>
          </nav>
          <Panel title="Học liệu cần rà soát">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Học liệu</th>
                    <th>Loại</th>
                    <th>Mức xử lý</th>
                    <th>Quyền nội dung</th>
                    <th>
                      <span className="visually-hidden">Mở</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <Link
                          to={link(`chuan-hoa/${classId}/hoc-lieu/${i.id}`)}
                        >
                          {i.title}
                        </Link>
                      </td>
                      <td>{kinds[i.kind]}</td>
                      <td>
                        <Level value={i.level} />
                      </td>
                      <td>{i.editable ? "Có thể chỉnh sửa" : "Chỉ xem"}</td>
                      <td>
                        <Link
                          aria-label={`Rà soát ${i.title}`}
                          to={link(`chuan-hoa/${classId}/hoc-lieu/${i.id}`)}
                        >
                          <LeaderIcon name="right" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <p className="muted">
            Chỉ hoàn thành khi slide, quiz và bài tập đều đạt M3, không còn yêu
            cầu mở.
          </p>
          <div className="row-actions">
            <Button
              variant="secondary"
              disabled={done || !canComplete(state, courseId, classId)}
              onClick={() =>
                act(
                  (s) => completeClass(s, courseId, classId),
                  "Đã hoàn thành chuẩn hoá lớp.",
                )
              }
            >
              {done ? "Đã hoàn thành chuẩn hoá" : "Hoàn thành chuẩn hoá"}
            </Button>
            <Link
              className="text-link"
              to={link("hoc-lieu/tao", { lop: classId })}
            >
              Thêm học liệu cho lớp
            </Link>
          </div>
        </>
      )}
    </>
  );
}
