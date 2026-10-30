import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Field, PageHeader, Panel, Empty } from "../shared/UI";
import { classItems, findItem, kinds, saveMaterial } from "./model";
import type { Material, MaterialKind } from "./model";
import { CourseFilter, Level, MissingScope, useLeaderScope } from "./UI";
export function LeaderMaterials() {
  const { state, courseId, course, classrooms, params, setParams, link } =
    useLeaderScope();
  const classId = params.get("lop") || classrooms[0]?.id || "",
    items = classItems(state, courseId, classId);
  return (
    <>
      <PageHeader
        title="Học liệu"
        description="Tạo và chỉnh sửa học liệu theo lớp, giữ rõ quyền nội dung."
      />
      <CourseFilter />
      {!course ? (
        <MissingScope />
      ) : (
        <>
          <div className="leader-filters">
            <Field label="Lớp học">
              <select
                aria-label="Lớp học"
                value={classId}
                onChange={(e) =>
                  setParams({ hp: courseId, lop: e.target.value })
                }
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}
                  </option>
                ))}
              </select>
            </Field>
            <Link
              className="button secondary"
              to={link("hoc-lieu/tao", { lop: classId })}
            >
              Tạo học liệu
            </Link>
          </div>
          <Panel title="Học liệu trong lớp">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Học liệu</th>
                    <th>Loại</th>
                    <th>Mức xử lý</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>{i.title}</td>
                      <td>{kinds[i.kind]}</td>
                      <td>
                        <Level value={i.level} />
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link
                            className="text-link"
                            to={link(`chuan-hoa/${i.classId}/hoc-lieu/${i.id}`)}
                          >
                            Rà soát
                          </Link>
                          {i.editable ? (
                            <Link
                              className="text-link"
                              to={link("hoc-lieu/" + i.id + "/sua", {
                                lop: i.classId,
                              })}
                            >
                              Chỉnh sửa
                            </Link>
                          ) : (
                            <span className="muted">Chỉ xem</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!items.length && <Empty title="Chưa có học liệu trong lớp này" />}
          </Panel>
        </>
      )}
    </>
  );
}
function EditorForm({ item }: { item?: Material }) {
  const { courseId, classrooms, link, params, act } = useLeaderScope();
  const navigate = useNavigate();
  const [classId, setClassId] = useState(
    item?.classId || params.get("lop") || classrooms[0]?.id || "",
  );
  return (
    <Panel title="Nội dung học liệu">
      <form
        className="leader-form leader-editor"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const input: Material = {
            id: item?.id || crypto.randomUUID(),
            courseId,
            classId,
            kind: (item?.kind || String(f.get("kind"))) as MaterialKind,
            title: String(f.get("title")),
            body: String(f.get("body")),
            level: 0,
            editable: true,
            revision: 1,
          };
          if (
            act(
              (s) => saveMaterial(s, input, Boolean(item)),
              "Đã lưu học liệu; lớp cần được rà soát lại.",
            )
          )
            navigate(link(`chuan-hoa/${classId}/hoc-lieu/${input.id}`));
        }}
      >
        <CourseFilter disabled={Boolean(item)} />
        <Field label="Lớp học">
          <select
            aria-label="Lớp học"
            value={classId}
            disabled={Boolean(item)}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Loại học liệu">
          <select
            aria-label="Loại học liệu"
            name="kind"
            defaultValue={item?.kind || "slides"}
            disabled={Boolean(item)}
          >
            {Object.entries(kinds).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tiêu đề">
          <input
            name="title"
            required
            maxLength={160}
            pattern=".*\S.*"
            defaultValue={item?.title || ""}
          />
        </Field>
        <Field label="Nội dung">
          <textarea
            name="body"
            aria-label="Nội dung"
            aria-describedby="leader-content-hint"
            required
            rows={10}
            maxLength={15000}
            defaultValue={item?.body || ""}
          />
        </Field>
        <p className="muted" id="leader-content-hint">
          Slides: chia nội dung bằng dòng trống. Quiz: ghi câu hỏi, lựa chọn và
          đáp án. Bài tập: ghi đề bài và tiêu chí đánh giá.
        </p>
        <p className="muted">
          Nội dung mới bắt đầu ở M0. Sửa nội dung sẽ đưa học liệu về M1 và mở
          lại chuẩn hoá lớp.
        </p>
        <div className="row-actions">
          <Button variant="secondary">Lưu học liệu</Button>
          <Link className="text-link" to={link("hoc-lieu", { lop: classId })}>
            Hủy
          </Link>
        </div>
      </form>
    </Panel>
  );
}
export function LeaderEditor() {
  const { itemId } = useParams();
  const { courseId, course, state, params, link } = useLeaderScope();
  const candidate = state.items.find((i) => i.id === itemId);
  const item = itemId
    ? findItem(
        state,
        courseId,
        params.get("lop") || candidate?.classId || "",
        itemId,
      )
    : undefined;
  return (
    <>
      <PageHeader
        title={itemId ? "Chỉnh sửa học liệu" : "Tạo học liệu"}
        description="Thêm nội dung cho đúng lớp và học phần."
      />
      {!course || (itemId && !item) ? (
        <MissingScope />
      ) : item && !item.editable ? (
        <Empty
          title="Bạn chỉ có quyền xem học liệu này"
          description="Gửi yêu cầu điều chỉnh để giảng viên cập nhật nội dung."
          action={
            <Link
              className="button secondary"
              to={link(`chuan-hoa/${item.classId}/hoc-lieu/${item.id}`)}
            >
              Về màn rà soát
            </Link>
          }
        />
      ) : (
        <EditorForm key={`${courseId}-${itemId || "new"}`} item={item} />
      )}
    </>
  );
}
