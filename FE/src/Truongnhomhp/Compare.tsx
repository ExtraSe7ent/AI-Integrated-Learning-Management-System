import { Link } from "react-router-dom";
import { Field, PageHeader, Panel, Empty } from "../shared/UI";
import { classFor, classItems, kinds } from "./model";
import type { MaterialKind } from "./model";
import { CourseFilter, MissingScope, useLeaderScope } from "./UI";
import { MaterialContent } from "./Review";
export function LeaderCompare() {
  const { state, courseId, course, classrooms, params, setParams, link } =
    useLeaderScope();
  const left = params.get("a") || classrooms[0]?.id || "",
    right = params.get("b") || classrooms.find((c) => c.id !== left)?.id || "";
  const kind = (params.get("loai") || "slides") as MaterialKind;
  function change(key: string, value: string) {
    const n = new URLSearchParams(params);
    n.set(key, value);
    setParams(n);
  }
  const valid =
    left !== right &&
    classFor(courseId, left) &&
    classFor(courseId, right) &&
    Object.hasOwn(kinds, kind);
  return (
    <>
      <PageHeader
        title="So sánh giữa các lớp"
        description="Đối chiếu cùng loại học liệu, giữ rõ ngữ cảnh từng lớp."
      />
      <CourseFilter />
      {!course ? (
        <MissingScope />
      ) : classrooms.length < 2 ? (
        <Empty
          title="Học phần hiện chỉ có một lớp"
          description="Chọn học phần có ít nhất hai lớp để so sánh."
        />
      ) : (
        <>
          <div className="leader-filters leader-compare-filters">
            {[
              ["a", "Lớp thứ nhất", left],
              ["b", "Lớp thứ hai", right],
            ].map(([key, label, value]) => (
              <Field label={label} key={key}>
                <select
                  aria-label={label}
                  value={value}
                  onChange={(e) => change(key, e.target.value)}
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
            <Field label="Loại học liệu">
              <select
                aria-label="Loại học liệu"
                value={kind}
                onChange={(e) => change("loai", e.target.value)}
              >
                {Object.entries(kinds).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {!valid ? (
            <Empty
              title="Chọn hai lớp khác nhau trong cùng học phần"
              description="Các lớp được so sánh phải thuộc phạm vi phân công."
              action={
                <Link className="button secondary" to={link("so-sanh")}>
                  Đặt lại lựa chọn
                </Link>
              }
            />
          ) : (
            <div className="leader-compare-grid">
              {[left, right].map((id) => (
                <Panel title={id} key={id}>
                  {classItems(state, courseId, id)
                    .filter((i) => i.kind === kind)
                    .map((i) => (
                      <article className="leader-comparison-item" key={i.id}>
                        <h3>{i.title}</h3>
                        <MaterialContent item={i} />
                        <Link
                          className="button secondary"
                          to={link(`chuan-hoa/${id}/hoc-lieu/${i.id}`)}
                        >
                          Rà soát lớp này
                        </Link>
                      </article>
                    ))}
                  {!classItems(state, courseId, id).some(
                    (i) => i.kind === kind,
                  ) && (
                    <p>Chưa có {kinds[kind].toLowerCase()} trong lớp này.</p>
                  )}
                </Panel>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
