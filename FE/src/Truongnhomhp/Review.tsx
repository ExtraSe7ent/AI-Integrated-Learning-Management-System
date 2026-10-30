import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Field, PageHeader, Panel, Empty } from "../shared/UI";
import { findItem, kinds, levels, requestChange, reviewItem } from "./model";
import type { Material } from "./model";
import { CourseFilter, Level, MissingScope, useLeaderScope } from "./UI";
export function MaterialContent({ item }: { item: Material }) {
  return <div className="leader-material-content">{item.body}</div>;
}
export function RequestThread({ itemId }: { itemId: string }) {
  const { state } = useLeaderScope();
  const requests = state.requests.filter((r) => r.itemId === itemId);
  if (!requests.length) return null;
  return (
    <Panel title="Trao đổi điều chỉnh">
      {requests.map((r) => (
        <div className="leader-thread" key={r.id}>
          <strong>
            {r.closed
              ? "Đã hoàn tất rà soát"
              : r.reply
                ? "Đã phản hồi · Chờ rà soát lại"
                : "Đang chờ giảng viên phản hồi"}
          </strong>
          <p>{r.body}</p>
          {r.reply && (
            <div className="reply-block">
              <strong>Phản hồi</strong>
              <p>{r.reply}</p>
            </div>
          )}
        </div>
      ))}
    </Panel>
  );
}
function ReviewForm({ item }: { item: Material }) {
  const { courseId, link, act, state } = useLeaderScope();
  const [level, setLevel] = useState(item.level),
    [reason, setReason] = useState("");
  const pending = state.requests.some((r) => r.itemId === item.id && !r.closed);
  const send = () =>
    act(
      (s) =>
        requestChange(
          s,
          courseId,
          item.classId,
          item.id,
          reason,
          crypto.randomUUID(),
        ),
      "Đã gửi yêu cầu điều chỉnh cho giảng viên.",
    );
  return (
    <Panel title="Kết quả rà soát">
      <div className="leader-form">
        <Field label="Mức xử lý">
          <select
            aria-label="Mức xử lý"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          >
            {levels.map((l, i) => (
              <option key={l} value={i}>
                M{i} · {l}
              </option>
            ))}
          </select>
        </Field>
        <Button
          variant="secondary"
          onClick={() =>
            level === 2
              ? send()
              : act(
                  (s) => reviewItem(s, courseId, item.classId, item.id, level),
                  "Đã lưu mức xử lý.",
                )
          }
        >
          Lưu mức xử lý
        </Button>
        <hr />
        <Field label="Yêu cầu điều chỉnh">
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nêu nội dung và vị trí cần sửa…"
            maxLength={2000}
          />
        </Field>
        <Button variant="secondary" disabled={pending} onClick={send}>
          Gửi yêu cầu cho GV
        </Button>
        {pending && (
          <p className="muted">
            Học liệu có yêu cầu mở. Xem phản hồi bên dưới trước khi rà soát lại.
          </p>
        )}
        <p className="muted">
          {item.editable
            ? "Có quyền chỉnh sửa nội dung lớp này."
            : "Chỉ xem nội dung. Gửi yêu cầu để giảng viên chỉnh sửa."}
        </p>
        {item.editable && (
          <Link
            className="button secondary"
            to={link("hoc-lieu/" + item.id + "/sua", { lop: item.classId })}
          >
            Chỉnh sửa nội dung
          </Link>
        )}
      </div>
    </Panel>
  );
}
export function LeaderReview() {
  const { classId = "", itemId = "" } = useParams();
  const { state, courseId, course, link } = useLeaderScope();
  const item = findItem(state, courseId, classId, itemId);
  return (
    <>
      <PageHeader
        title="Rà soát học liệu"
        description={
          item && `${course?.code} · ${classId} · ${kinds[item.kind]}`
        }
      />
      {!item ? (
        <MissingScope />
      ) : (
        <>
          <nav className="leader-context" aria-label="Vị trí trong học phần">
            <Link to={link("chuan-hoa")}>Chuẩn hoá</Link>
            <span>/</span>
            <Link to={link("chuan-hoa/" + classId)}>{classId}</Link>
            <span>/</span>
            <span>{item.title}</span>
          </nav>
          <div className="leader-review-grid">
            <Panel title={item.title}>
              <MaterialContent item={item} />
            </Panel>
            <ReviewForm
              key={`${item.id}-${item.revision}-${item.level}`}
              item={item}
            />
          </div>
          <RequestThread itemId={item.id} />
        </>
      )}
    </>
  );
}
export function LeaderRequests() {
  const { state, course, link, params, setParams } = useLeaderScope();
  const status = params.get("etat") || "all";
  const rows = state.requests
    .map((r) => ({ r, item: state.items.find((i) => i.id === r.itemId) }))
    .filter(
      ({ r, item }) =>
        item?.courseId === course?.id &&
        (status === "all" ||
          (status === "open" && !r.closed && !r.reply) ||
          (status === "replied" && !r.closed && Boolean(r.reply)) ||
          (status === "closed" && r.closed)),
    );
  return (
    <>
      <PageHeader
        title="Yêu cầu điều chỉnh"
        description="Theo dõi nội dung đã gửi và phản hồi từ giảng viên."
      />
      <CourseFilter />
      {!course ? (
        <MissingScope />
      ) : (
        <>
          <Field label="Trạng thái">
            <select
              aria-label="Trạng thái"
              value={status}
              onChange={(e) => {
                const n = new URLSearchParams(params);
                n.set("etat", e.target.value);
                setParams(n);
              }}
            >
              <option value="all">Tất cả yêu cầu</option>
              <option value="open">Chờ giảng viên</option>
              <option value="replied">Chờ rà soát lại</option>
              <option value="closed">Đã hoàn tất</option>
            </select>
          </Field>
          {rows.map(({ r, item }) => (
            <Panel key={r.id} title={item!.title}>
              <div className="leader-form">
                <p>{item!.classId} · Nguyễn Minh Anh</p>
                <Level value={item!.level} />
                <strong>
                  {r.closed
                    ? "Đã hoàn tất"
                    : r.reply
                      ? "Đã phản hồi · Chờ rà soát lại"
                      : "Đang chờ phản hồi"}
                </strong>
                <p>{r.body}</p>
                <p className="muted">
                  {r.reply || "Giảng viên chưa phản hồi yêu cầu này."}
                </p>
                <Link
                  className="button secondary"
                  to={link(`chuan-hoa/${item!.classId}/hoc-lieu/${item!.id}`)}
                >
                  Mở học liệu
                </Link>
              </div>
            </Panel>
          ))}
          {!rows.length && (
            <Empty
              title="Không có yêu cầu trong bộ lọc này"
              description="Chọn trạng thái khác hoặc mở học liệu để gửi yêu cầu."
              action={
                <Link className="button secondary" to={link("yeu-cau")}>
                  Xóa bộ lọc
                </Link>
              }
            />
          )}
        </>
      )}
    </>
  );
}
