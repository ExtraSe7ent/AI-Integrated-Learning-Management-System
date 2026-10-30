import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MessageSquare,
  Sparkles,
  Download,
  Send,
  Flag,
  Bookmark,
  ThumbsUp,
  FileText,
} from "lucide-react";
import { advanceStudy, studyFor } from "../data/study";
import { useDemo } from "../data/DemoProvider";
import { slideTitles } from "../data/fixtures";
import { Button, Badge, Progress, Dialog, Field } from "../shared/UI";
import { canAdvance, sessionState } from "../data/rules";
export function HocBai() {
  const { data, setData, notify } = useDemo();
  const [params] = useSearchParams();
  const sessionId = params.get("phien") || "s1";
  const record = studyFor(data, sessionId);
  const session =
    data.sessions.find((s) => s.id === sessionId) || data.sessions[0];
  const lessonTitle =
    data.lessons.find((l) => l.id === "l2")?.title || "Thiết kế RESTful API";
  const [page, setPage] = useState(Math.min(record.progress + 1, 4)),
    [selected, setSelected] = useState<number>(),
    [tab, setTab] = useState("question"),
    [gap, setGap] = useState(false),
    [list, setList] = useState(false),
    [question, setQuestion] = useState(""),
    [body, setBody] = useState("");
  const q = data.questions.find((q) => q.page === page && q.approved);
  const saved = q ? record.answers[q.id] : undefined;
  const answered = saved !== undefined;
  const state = sessionState(
    Date.parse(session.opens),
    Date.parse(session.closes),
  );
  const locked =
    (state === "closed" && !session.late) ||
    state === "scheduled" ||
    Boolean(record.completedAt);
  function go(next: number) {
    setPage(next);
    setSelected(undefined);
  }
  function confirmAnswer() {
    if (!q || selected === undefined) return;
    setData((d) => ({
      ...d,
      studySessions: {
        ...d.studySessions,
        [sessionId]: {
          ...record,
          answers: { ...record.answers, [q.id]: selected },
        },
      },
    }));
  }
  function next() {
    setData((d) => ({
      ...d,
      studySessions: {
        ...d.studySessions,
        [sessionId]: advanceStudy(record, page, session),
      },
    }));
    if (page < 4) go(page + 1);
    else
      notify("Đã hoàn thành phiên tự học. Bạn có thể xem lại bất cứ lúc nào.");
  }
  function ask() {
    if (!question.trim()) return;
    const text = question.trim();
    const outside =
      !/api|rest|http|tài nguyên|post|get|put|patch|uri|bài|giải thích|trang/i.test(
        text,
      );
    setData((d) => ({
      ...d,
      chat: [
        ...d.chat,
        {
          question: text,
          page,
          answer: outside
            ? "Học liệu chưa có thông tin phù hợp. Bạn hãy hỏi giảng viên để được giải đáp."
            : `Gợi ý: ${page === 1 ? "REST tổ chức API theo tài nguyên. Mỗi tài nguyên có một URI, còn HTTP method mô tả thao tác." : page === 2 ? "GET đọc dữ liệu, POST tạo mới, PUT thay thế và PATCH cập nhật một phần tài nguyên." : "Mã 2xx thể hiện thành công, 4xx là lỗi từ yêu cầu, 5xx là lỗi phía máy chủ."} Bạn sẽ chọn method nào khi cập nhật một thuộc tính?`,
        },
      ],
    }));
    setQuestion("");
  }
  return (
    <>
      <div className="reader-heading">
        <Link
          to="/sinh-vien/tu-hoc"
          className="icon-button"
          aria-label="Về phiên tự học"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <small>CSE301 · PHIÊN TỰ HỌC</small>
          <h1>{lessonTitle}</h1>
        </div>
        <div className="reader-progress">
          <span>{record.progress}/4 trang hoàn thành</span>
          <Progress value={(record.progress / 4) * 100} />
        </div>
        <Badge tone={record.progress === 4 ? "green" : "red"}>
          {record.progress === 4
            ? "Hoàn thành"
            : state === "open"
              ? "Đang học"
              : state === "closed"
                ? "Xem lại · Đã hết hạn"
                : "Chưa mở"}
        </Badge>
      </div>
      <div className="reader-layout">
        <aside className="slide-rail">
          <h2>Nội dung bài học</h2>
          {slideTitles.map((title, i) => (
            <button
              key={title}
              className={`slide-thumb ${page === i + 1 ? "selected" : ""}`}
              disabled={i > record.progress && i + 1 !== page}
              onClick={() => go(i + 1)}
            >
              <div>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {i < record.progress && <Check size={15} />}
              </div>
              <strong>{title}</strong>
              <small>{i < 3 ? "Có câu hỏi" : "Tổng kết"}</small>
            </button>
          ))}
          <a className="text-link" href="/materials/demo-lesson.pdf" download>
            <Download size={15} />
            Tải PDF
          </a>
        </aside>
        <div className="reader-center">
          <div className="reader-toolbar">
            <span>
              <FileText size={16} />
              Trang {page} / 4
            </span>
            <div>
              <button
                className="icon-button"
                aria-label="Trang trước"
                disabled={page === 1}
                onClick={() => go(page - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="icon-button"
                aria-label="Trang sau"
                disabled={
                  page >= 4 ||
                  !canAdvance(
                    Boolean(q),
                    answered ? saved === q?.correct : undefined,
                  )
                }
                onClick={next}
              >
                <ChevronRight size={18} />
              </button>
              <button
                className="icon-button"
                aria-label="Toàn màn hình bài học"
                onClick={() =>
                  document.querySelector(".slide-stage")?.requestFullscreen()
                }
              >
                <Maximize2 size={17} />
              </button>
            </div>
          </div>
          <div className="slide-stage">
            <div className="slide-brand">
              <img src="/brand/vju-seal.jpeg" alt="VJU" />
              <span>PHÁT TRIỂN ỨNG DỤNG NÂNG CAO</span>
            </div>
            <span className="slide-chapter">
              {String(page).padStart(2, "0")} / RESTFUL API
            </span>
            <h2>{slideTitles[page - 1]}</h2>
            {page === 1 ? (
              <>
                <p className="slide-lead">
                  Một cách thống nhất để các ứng dụng
                  <br />
                  giao tiếp với nhau.
                </p>
                <div className="api-diagram">
                  <div>
                    Ứng dụng
                    <br />
                    <strong>Client</strong>
                  </div>
                  <span>
                    HTTP request
                    <ArrowRight size={24} />
                    <small>JSON response</small>
                  </span>
                  <div>
                    Máy chủ
                    <br />
                    <strong>Server</strong>
                  </div>
                </div>
                <p>
                  Mỗi <strong>tài nguyên</strong> có một URI. Mỗi{" "}
                  <strong>thao tác</strong> dùng một HTTP method.
                </p>
              </>
            ) : page === 2 ? (
              <div className="http-methods">
                {[
                  ["GET", "Lấy danh sách sách", "/api/books"],
                  ["POST", "Thêm sách mới", "/api/books"],
                  ["PUT", "Thay thế thông tin sách", "/api/books/12"],
                  ["DELETE", "Xóa một cuốn sách", "/api/books/12"],
                ].map(([m, t, u]) => (
                  <div key={m}>
                    <b>{m}</b>
                    <span>{t}</span>
                    <code>{u}</code>
                  </div>
                ))}
              </div>
            ) : page === 3 ? (
              <div className="status-examples">
                {[
                  ["200", "OK", "Yêu cầu đã được xử lý"],
                  ["201", "Created", "Tài nguyên mới được tạo"],
                  ["404", "Not Found", "Không tìm thấy tài nguyên"],
                ].map(([n, t, s]) => (
                  <div key={n}>
                    <strong>{n}</strong>
                    <div>
                      <b>{t}</b>
                      <p>{s}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="slide-lead">
                  Từ yêu cầu nghiệp vụ
                  <br />
                  đến một API dễ sử dụng.
                </p>
                <ul className="slide-summary">
                  <li>Đặt tên tài nguyên bằng danh từ</li>
                  <li>Chọn HTTP method đúng ý nghĩa</li>
                  <li>Trả về mã trạng thái nhất quán</li>
                  <li>Cung cấp thông báo lỗi rõ ràng</li>
                </ul>
              </>
            )}
            <div className="slide-footer">
              <span>VJU Learning · Học liệu</span>
              <span>{page}</span>
            </div>
          </div>
          <div className="reader-bottom">
            <button
              className="button secondary"
              onClick={() => {
                setGap(true);
                setBody("");
              }}
            >
              <MessageSquare size={16} />
              Hỏi trên lớp
            </button>
            <button className="button secondary" onClick={() => setList(true)}>
              Kiến thức mờ ({data.gaps.length})
            </button>
            <Button
              disabled={
                state === "scheduled" ||
                (!locked &&
                  !canAdvance(
                    Boolean(q),
                    answered ? saved === q?.correct : undefined,
                  )) ||
                (locked && page === 4)
              }
              onClick={next}
            >
              {page === 4 ? "Hoàn thành phiên" : "Trang tiếp theo"}
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
        <aside className="reader-side">
          <div className="tabs reader-tabs">
            <button
              className={tab === "question" ? "selected" : ""}
              onClick={() => setTab("question")}
            >
              Câu hỏi
            </button>
            <button
              className={tab === "ai" ? "selected" : ""}
              onClick={() => setTab("ai")}
            >
              <Sparkles size={14} />
              Chat AI
            </button>
            <button
              className={tab === "notes" ? "selected" : ""}
              onClick={() => setTab("notes")}
            >
              <Bookmark size={14} />
              Ghi chú
            </button>
          </div>
          {tab === "question" ? (
            <div className="question-panel">
              <Badge>{q ? "Kiểm tra kiến thức" : "Tổng kết bài học"}</Badge>
              <h2>{q?.text || "Bạn đã đến cuối bài học!"}</h2>
              {q ? (
                <>
                  <p className="muted">Chọn một đáp án để tiếp tục.</p>
                  <div className="answer-options">
                    {q.options.map((option, i) => (
                      <label
                        key={option}
                        className={
                          (answered ? saved : selected) === i ? "chosen" : ""
                        }
                      >
                        <input
                          type="radio"
                          name="answer"
                          checked={(answered ? saved : selected) === i}
                          disabled={answered || locked}
                          onChange={() => setSelected(i)}
                        />
                        <span>{String.fromCharCode(65 + i)}</span>
                        {option}
                      </label>
                    ))}
                  </div>
                  {answered ? (
                    <div
                      className={`answer-feedback ${saved === q.correct ? "correct" : "incorrect"}`}
                    >
                      <strong>
                        {saved === q.correct
                          ? "Chính xác!"
                          : "Bạn hãy ghi nhớ đáp án này"}
                      </strong>
                      <p>{q.explanation}</p>
                    </div>
                  ) : (
                    <Button
                      disabled={selected === undefined || locked}
                      onClick={confirmAnswer}
                    >
                      Xác nhận đáp án
                    </Button>
                  )}
                  <small className="question-hint">
                    Trả lời sai vẫn được chuyển trang sau khi xác nhận.
                  </small>
                </>
              ) : (
                <p>
                  Hoàn thành phiên để ghi nhận tiến độ. Bạn có thể quay lại ôn
                  tập các trang đã học.
                </p>
              )}
              <button className="ai-inline" onClick={() => setTab("ai")}>
                <Sparkles size={18} />
                <span>
                  Cần một cách giải thích khác?<strong>Hỏi trợ lý AI</strong>
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : tab === "ai" ? (
            <div className="chat-panel">
              <p className="muted">
                AI có thể mắc lỗi. Hãy đối chiếu nguồn và hỏi giảng viên khi
                cần.
              </p>
              <div className="chat-log">
                {data.chat.length ? (
                  data.chat.map((m, i) => (
                    <article key={i}>
                      <div className="chat-user">{m.question}</div>
                      <div className="chat-answer">
                        <Sparkles size={17} />
                        <p>{m.answer}</p>
                        <button
                          className="source-chip"
                          onClick={() => go(m.page)}
                        >
                          Bài giảng · Trang {m.page}
                        </button>
                        <div>
                          <button
                            className="icon-button"
                            aria-label="Đánh giá hữu ích"
                            onClick={() => notify("Đã ghi nhận đánh giá.")}
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label="Báo lỗi phản hồi"
                            onClick={() =>
                              notify(
                                "Bạn có thể gửi chi tiết qua mục Phản hồi & hỗ trợ.",
                              )
                            }
                          >
                            <Flag size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="chat-intro">
                    <Sparkles size={26} />
                    <h3>Cùng hiểu bài sâu hơn</h3>
                    <p>Hỏi về REST, HTTP hoặc trang bài học đang xem.</p>
                    <button
                      onClick={() =>
                        setQuestion("Giải thích RESTful API là gì?")
                      }
                    >
                      Giải thích RESTful API là gì?
                    </button>
                  </div>
                )}
              </div>
              <form
                className="chat-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  ask();
                }}
              >
                <input
                  aria-label="Câu hỏi cho AI"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Hỏi về nội dung bài học…"
                />
                <button aria-label="Gửi câu hỏi" disabled={!question.trim()}>
                  <Send size={17} />
                </button>
              </form>
            </div>
          ) : (
            <div className="question-panel">
              <h2>Ghi chú của tôi</h2>
              <Field label={`Ghi chú · Trang ${page}`}>
                <textarea
                  rows={12}
                  value={data.notes}
                  onChange={(e) =>
                    setData((d) => ({ ...d, notes: e.target.value }))
                  }
                />
              </Field>
              <small className="muted">Tự lưu trên trình duyệt này.</small>
            </div>
          )}
        </aside>
      </div>
      {gap && (
        <Dialog
          title={`Hỏi trên lớp · Trang ${page}`}
          onClose={() => setGap(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setData((d) => ({
                ...d,
                gaps: [
                  ...d.gaps,
                  {
                    id: crypto.randomUUID(),
                    page,
                    body: body.trim(),
                    response: "",
                  },
                ],
              }));
              setGap(false);
              notify("Đã lưu câu hỏi để giảng viên giải đáp.");
            }}
          >
            <Field label="Phần bạn chưa hiểu">
              <textarea
                required
                minLength={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
              />
            </Field>
            <Button type="submit">Gửi câu hỏi</Button>
          </form>
        </Dialog>
      )}
      {list && (
        <Dialog title="Kiến thức mờ của tôi" onClose={() => setList(false)}>
          {data.gaps.map((g) => (
            <div className="gap-item" key={g.id}>
              <button
                className="text-link"
                onClick={() => {
                  go(g.page);
                  setList(false);
                }}
              >
                Trang {g.page}
                <ArrowRight size={14} />
              </button>
              <p>{g.body}</p>
              <Badge tone={g.response ? "green" : "amber"}>
                {g.response ? "Đã giải đáp" : "Chờ giảng viên"}
              </Badge>
              {g.response && <p>{g.response}</p>}
            </div>
          ))}
        </Dialog>
      )}
    </>
  );
}
