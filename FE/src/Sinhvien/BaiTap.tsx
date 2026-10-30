import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  Clock3,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  Badge,
  Button,
  Field,
  Dialog,
  Journey,
  Empty,
} from "../shared/UI";
import { CourseContext } from "../shared/CourseComponents";
import { assessmentFor, updateAssessment } from "../data/assessment";
import type { Assignment } from "../data/fixtures";
import { useDemo } from "../data/DemoProvider";
export function BaiTap() {
  const { data, setData } = useDemo();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const items = data.assignments.filter((a) => a.published);
  function start(a: Assignment) {
    setData((d) =>
      updateAssessment(d, a.id, {
        draft: assessmentFor(d, a.id).draft || {
          answers: ["", "", ""],
          deadline: Date.now() + a.minutes * 60000,
        },
      }),
    );
    navigate("/sinh-vien/lam-bai?bai=" + a.id);
  }
  return (
    <>
      <PageHeader
        title="Bài tập"
        description="Theo dõi bài tập tính điểm và kết quả của bạn."
      />
      <CourseContext />
      <Journey active={2} />
      <div className="toolbar">
        <div className="tabs">
          {[
            ["all", "Tất cả"],
            ["todo", "Chưa hoàn thành"],
            ["done", "Đã nộp"],
          ].map(([v, t]) => (
            <button
              key={v}
              className={filter === v ? "selected" : ""}
              onClick={() => setFilter(v)}
            >
              {t}
            </button>
          ))}
        </div>
        <Badge tone="red">Tính điểm</Badge>
      </div>
      {items
        .filter(
          (a) =>
            filter === "all" ||
            (filter === "done"
              ? Boolean(assessmentFor(data, a.id).result)
              : !assessmentFor(data, a.id).result),
        )
        .map((a) => {
          const record = assessmentFor(data, a.id);
          return (
            <Panel key={a.id} className="assignment-card">
              <div className="assignment-title">
                <span className="task-icon">
                  <ClipboardList size={25} />
                </span>
                <div>
                  <div className="inline-meta">
                    <Badge tone={record.result ? "green" : "amber"}>
                      {record.result ? "Đã nộp" : "Chưa hoàn thành"}
                    </Badge>
                    <span>CSE301 · Tuần 07</span>
                  </div>
                  <h2>{a.title}</h2>
                </div>
              </div>
              <p>
                Vận dụng kiến thức RESTful API để thiết kế các thao tác quản lý
                sách. Gồm trắc nghiệm, điền trống và tự luận.
              </p>
              <div className="assignment-facts">
                <span>
                  <Clock3 size={16} />
                  {a.minutes} phút
                </span>
                <span>
                  <FileText size={16} />3 câu hỏi · 10 điểm
                </span>
                <span>
                  <RotateCcw size={16} />
                  {record.attempts}/{a.attempts} lượt làm
                </span>
              </div>
              <div className="assignment-bottom">
                <small>
                  Đóng lúc {new Date(a.closes).toLocaleString("vi-VN")}
                </small>
                {record.result ? (
                  <Link
                    className="button secondary"
                    to={`/sinh-vien/ket-qua?bai=${a.id}`}
                  >
                    Xem kết quả
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <Button
                    disabled={
                      record.attempts >= a.attempts ||
                      Date.now() < Date.parse(a.opens) ||
                      Date.now() >= Date.parse(a.closes)
                    }
                    onClick={() => start(a)}
                  >
                    {record.draft ? "Tiếp tục làm bài" : "Bắt đầu làm bài"}
                    <ArrowRight size={16} />
                  </Button>
                )}
              </div>
            </Panel>
          );
        })}
      {!items.filter(
        (a) =>
          filter === "all" ||
          (filter === "done"
            ? Boolean(assessmentFor(data, a.id).result)
            : !assessmentFor(data, a.id).result),
      ).length && (
        <Empty
          title="Không có bài tập trong mục này"
          description="Chọn Tất cả để xem các bài đã công bố."
        />
      )}
      <div className="info-line">
        <AlertCircle size={17} />
        Luyện tập không tính điểm được tách riêng trong mục Luyện tập.
      </div>
    </>
  );
}
export function LamBai({ practice = false }: { practice?: boolean }) {
  const { data, setData, notify } = useDemo();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const a =
    data.assignments.find((x) => x.id === (params.get("bai") || "a1")) ||
    data.assignments[0];
  const record = assessmentFor(data, a.id);
  const [answers, setAnswers] = useState<string[]>(
    practice ? ["", "", ""] : record.draft?.answers || ["", "", ""],
  );
  const [deadline, setDeadline] = useState(record.draft?.deadline || 0);
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
  );
  const [done, setDone] = useState(false);
  const [scope, setScope] = useState("all");
  const submitted = useRef(false);
  const score =
    (answers[0] === "0" ? 4 : 0) +
    (answers[1].trim().toUpperCase() === "POST" ? 3 : 0);
  const submitRef = useRef(() => {});
  submitRef.current = () => {
    if (submitted.current) return;
    submitted.current = true;
    if (practice) {
      setDone(true);
      return;
    }
    setData((d) =>
      updateAssessment(d, a.id, {
        result: {
          score,
          answers,
          submitted: new Date().toLocaleString("vi-VN"),
        },
        draft: null,
        attempts: assessmentFor(d, a.id).attempts + 1,
      }),
    );
    notify("Đã nộp bài. Phần tự luận chờ giảng viên duyệt.");
    navigate("/sinh-vien/ket-qua?bai=" + a.id);
  };
  useEffect(() => {
    if (practice || !deadline) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) submitRef.current();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadline, practice]);
  function answer(index: number, value: string) {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    if (!practice && record.draft)
      setData((d) =>
        updateAssessment(d, a.id, {
          draft: record.draft ? { ...record.draft, answers: next } : null,
        }),
      );
  }
  function newPractice() {
    setAnswers(["", "", ""]);
    setDone(false);
    submitted.current = false;
    notify("Đã tạo bộ luyện tập mẫu. Không tính điểm học phần.");
  }
  if (!practice && !record.draft && !record.result)
    return (
      <>
        <PageHeader title="Bạn chưa bắt đầu bài tập" />
        <Link className="button" to="/sinh-vien/bai-tap">
          Về danh sách bài tập
        </Link>
      </>
    );
  return (
    <>
      <PageHeader
        title={practice ? "Luyện tập kiến thức" : a.title}
        description={
          practice
            ? "Tự kiểm tra kiến thức · Không tính điểm · Có thể làm lại."
            : "Bài tập tính điểm · CSE301 · Đáp án tự lưu trên trình duyệt."
        }
        action={
          practice ? (
            <Badge tone="green">Không tính điểm</Badge>
          ) : (
            <span className={`quiz-timer ${remaining < 60 ? "urgent" : ""}`}>
              <Clock3 size={19} />
              {String(Math.floor(remaining / 60)).padStart(2, "0")}:
              {String(remaining % 60).padStart(2, "0")}
            </span>
          )
        }
      />
      <CourseContext />
      {practice && (
        <div className="toolbar">
          <Field label="Phạm vi luyện tập">
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="all">Toàn bộ bài học RESTful API</option>
              <option value="http">Trang 2–3 · HTTP methods</option>
            </select>
          </Field>
          <Button onClick={newPractice}>
            <RotateCcw size={16} />
            Tạo bộ câu hỏi mẫu
          </Button>
        </div>
      )}
      <div className="quiz-layout">
        <form
          className="quiz-questions"
          onSubmit={(e) => {
            e.preventDefault();
            submitRef.current();
          }}
          onPaste={(e) => {
            if (!practice && a.preventPaste) {
              e.preventDefault();
              notify("Bài tập này không cho phép dán nội dung.");
            }
          }}
        >
          <Panel>
            <div className="question-number">
              <Badge>Câu 1 · Trắc nghiệm</Badge>
              <span>4 điểm</span>
            </div>
            <h2>Trong kiến trúc REST, tài nguyên được định danh bằng gì?</h2>
            <div className="answer-options">
              {[
                "Một URI duy nhất",
                "Một kết nối TCP",
                "Một bảng trong database",
                "Một phiên đăng nhập",
              ].map((v, i) => (
                <label
                  key={v}
                  className={answers[0] === String(i) ? "chosen" : ""}
                >
                  <input
                    type="radio"
                    name="quiz"
                    disabled={done}
                    checked={answers[0] === String(i)}
                    onChange={() => answer(0, String(i))}
                  />
                  <span>{String.fromCharCode(65 + i)}</span>
                  {v}
                </label>
              ))}
            </div>
            {done && (
              <p className="green-text">
                Đáp án đúng: A. URI xác định tài nguyên trong API.
              </p>
            )}
          </Panel>
          <Panel>
            <div className="question-number">
              <Badge>Câu 2 · Điền trống</Badge>
              <span>3 điểm</span>
            </div>
            <h2>Điền HTTP method dùng để tạo tài nguyên mới.</h2>
            <Field label="Đáp án của bạn">
              <input
                placeholder="Nhập tên method…"
                disabled={done}
                value={answers[1]}
                onChange={(e) => answer(1, e.target.value)}
              />
            </Field>
            {done && <p className="green-text">Đáp án: POST.</p>}
          </Panel>
          <Panel>
            <div className="question-number">
              <Badge>Câu 3 · Tự luận</Badge>
              <span>3 điểm</span>
            </div>
            <h2>Thiết kế API cho thao tác mượn sách.</h2>
            <p>
              Đề xuất endpoint, method và mã trạng thái phản hồi. Giải thích lựa
              chọn của bạn.
            </p>
            <Field label="Bài làm">
              <textarea
                rows={6}
                disabled={done}
                maxLength={5000}
                value={answers[2]}
                onChange={(e) => answer(2, e.target.value)}
                placeholder="Trình bày phương án của bạn…"
              />
            </Field>
            {done && (
              <p className="muted">
                Gợi ý: POST /api/loans, trả về 201 khi tạo lượt mượn thành công.
              </p>
            )}
          </Panel>
          {!done && (
            <Button type="submit">
              <CheckCircle2 size={18} />
              {practice ? "Kiểm tra đáp án" : "Nộp bài"}
            </Button>
          )}
          {done && (
            <Button type="button" onClick={newPractice}>
              Làm lại với bộ mẫu
            </Button>
          )}
        </form>
        <aside>
          <Panel title="Tiến độ làm bài">
            <div className="question-grid">
              {answers.map((v, i) => (
                <a
                  href={`#question-${i}`}
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .querySelectorAll(".quiz-questions .panel")
                      [i]?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                  }}
                  className={v ? "filled" : ""}
                >
                  {i + 1}
                </a>
              ))}
            </div>
            <p>{answers.filter(Boolean).length}/3 câu đã trả lời</p>
            <hr />
            <p className="muted">
              {practice
                ? "Phản hồi mẫu giúp bạn tự đối chiếu. AI chưa được kết nối."
                : "Hết giờ bài sẽ tự nộp. Câu chưa trả lời được tính 0 điểm."}
            </p>
            {!practice && (
              <p className="muted">
                Tự luận: AI chấm nháp, giảng viên duyệt trước khi công bố.
              </p>
            )}
            {practice && done && (
              <strong className="practice-score">{score}/7 điểm tự chấm</strong>
            )}
          </Panel>
          {!practice && (
            <Button
              variant="secondary"
              onClick={() => {
                setDeadline(Date.now() + a.minutes * 60000);
                notify("Đã khởi động lại thời gian.");
              }}
              hidden
            >
              Khởi động
            </Button>
          )}
        </aside>
      </div>
    </>
  );
}
export function KetQua() {
  const { data, setData, notify } = useDemo();
  const [params] = useSearchParams();
  const assignmentId = params.get("bai") || "a1";
  const assignment =
    data.assignments.find((a) => a.id === assignmentId) || data.assignments[0];
  const [appeal, setAppeal] = useState(false),
    [reason, setReason] = useState("");
  const r = assessmentFor(data, assignmentId).result;
  return (
    <>
      <PageHeader
        title="Kết quả bài tập"
        description={assignment.title + " · CSE301"}
        action={
          <Link className="button secondary" to="/sinh-vien/bai-tap">
            Danh sách bài tập
          </Link>
        }
      />
      {!r ? (
        <Empty
          title="Bạn chưa nộp bài"
          description="Hoàn thành một bài tập để xem kết quả."
          action={
            <Link className="button" to="/sinh-vien/bai-tap">
              Mở bài tập
            </Link>
          }
        />
      ) : (
        <>
          <Panel className="result-summary">
            <div className="result-score">
              {r.score}
              <span>/10</span>
            </div>
            <div>
              <Badge tone="green">Đã nộp bài</Badge>
              <h2>Bạn đã hoàn thành bài tập</h2>
              <p>
                Nộp lúc {r.submitted} ·{" "}
                {
                  r.answers
                    .slice(0, 2)
                    .filter((v, i) =>
                      i === 0 ? v === "0" : v.toUpperCase() === "POST",
                    ).length
                }
                /2 câu tự chấm đúng
              </p>
              <p className="muted">
                {r.approved
                  ? "Điểm đã được giảng viên duyệt và công bố."
                  : "Điểm tạm tính. Tự luận chờ giảng viên duyệt; đây là kết quả mô phỏng."}
              </p>
            </div>
          </Panel>
          {[
            "Trắc nghiệm · Định danh tài nguyên",
            "Điền trống · HTTP method",
            "Tự luận · API mượn sách",
          ].map((title, i) => (
            <Panel key={title}>
              <div className="panel-heading">
                <h2>
                  Câu {i + 1}: {title}
                </h2>
                <Badge tone={i === 2 ? "amber" : "neutral"}>
                  {i === 2
                    ? r.approved
                      ? "Đã duyệt"
                      : "Chờ duyệt"
                    : "Đã chấm tự động"}
                </Badge>
              </div>
              <p>
                <strong>Bài làm:</strong>{" "}
                {i === 0
                  ? r.answers[0] === "0"
                    ? "A. Một URI duy nhất"
                    : r.answers[0] || "Chưa trả lời"
                  : r.answers[i] || "Chưa trả lời"}
              </p>
              <p className="muted">
                {i === 0
                  ? "Tài nguyên được định danh bằng URI."
                  : i === 1
                    ? "POST được dùng để tạo tài nguyên mới."
                    : "Giảng viên xem xét endpoint, method và lý do lựa chọn trước khi công bố điểm."}
              </p>
              {i === 2 && r.comment && (
                <div className="reply-block">
                  <strong>Nhận xét giảng viên</strong>
                  <p>{r.comment}</p>
                </div>
              )}
              <Button variant="secondary small" onClick={() => setAppeal(true)}>
                Yêu cầu phúc khảo
              </Button>
            </Panel>
          ))}
          {data.appeals
            .filter((a) => a.assignmentId === assignmentId)
            .map((a) => (
              <Panel key={a.id}>
                <Badge tone={a.status === "pending" ? "amber" : "green"}>
                  {a.status === "pending"
                    ? "Phúc khảo đang chờ xử lý"
                    : "Đã có kết quả phúc khảo"}
                </Badge>
                <p>{a.reason}</p>
                {a.response && (
                  <p>
                    <strong>Giảng viên:</strong> {a.response}
                  </p>
                )}
              </Panel>
            ))}
        </>
      )}
      {appeal && (
        <Dialog title="Yêu cầu phúc khảo" onClose={() => setAppeal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setData((d) => ({
                ...d,
                appeals: [
                  ...d.appeals,
                  {
                    id: crypto.randomUUID(),
                    assignmentId,
                    question: assignment.title,
                    reason: reason.trim(),
                    response: "",
                    status: "pending",
                  },
                ],
                notices: [
                  ...d.notices,
                  "Có yêu cầu phúc khảo mới đang chờ xử lý.",
                ],
              }));
              setAppeal(false);
              notify("Đã lưu yêu cầu phúc khảo.");
            }}
          >
            <Field label="Lý do phúc khảo">
              <textarea
                required
                minLength={10}
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <Button>Gửi yêu cầu</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
