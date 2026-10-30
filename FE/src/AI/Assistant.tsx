import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, FileText, ThumbsUp, Flag } from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import { PageHeader, Field, Button, Badge } from "../shared/UI";
import { answerFromMaterial, materialSourceAvailable } from "./model";
export function Assistant({ teacher = false }: { teacher?: boolean }) {
  const { data, setData } = useDemo();
  const [course, setCourse] = useState("cs301"),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const link = (page = 1) =>
    teacher
      ? "/giang-vien/soan-bai?bai=l2&trang=" + page
      : "/sinh-vien/hoc/cs301?phien=s1&trang=" + page;
  const available = materialSourceAvailable(data);
  const messages = data.chat
    .map((m, index) => ({ ...m, index }))
    .filter((m) => (m.courseId || "cs301") === course);
  async function ask(q: string) {
    if (!q.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = answerFromMaterial(course, q.trim(), available);
      setData((d) => ({
        ...d,
        chat: [...d.chat, { question: q.trim(), ...result, courseId: course }],
      }));
      setText("");
    } catch {
      setError("Không tạo được phản hồi. Hãy gửi lại câu hỏi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title={teacher ? "Trợ lý giảng dạy AI" : "Trợ lý học tập AI"}
        description="Hỏi về bài học và đối chiếu câu trả lời với tài liệu nguồn."
      />
      <div className="ai-workspace">
        <aside className="ai-context">
          <h2>Học liệu đang dùng</h2>
          <Field label="Học phần">
            <select
              aria-label="Học phần"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              {data.admin.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.title}
                </option>
              ))}
            </select>
          </Field>
          {course === "cs301" && available ? (
            <>
              <div className="source-document">
                <FileText size={22} />
                <div>
                  <strong>Thiết kế RESTful API</strong>
                  <small>Học liệu · 4 trang</small>
                </div>
                <Badge tone="green">Có nguồn</Badge>
              </div>
              <Link className="button secondary" to={link()}>
                Mở bài học
              </Link>
            </>
          ) : (
            <p>
              Học phần này chưa có học liệu được kết nối với trợ lý. Chọn CSE301
              hoặc hỏi giảng viên.
            </p>
          )}
          <hr />
          <h3>Nguyên tắc hỗ trợ</h3>
          <p className="muted">
            Kiểm tra nguồn trước khi sử dụng câu trả lời. Trợ lý không giải hộ
            bài kiểm tra đang diễn ra.
          </p>
          {teacher && (
            <Link className="text-link" to="/giang-vien/tien-do">
              Phân tích dữ liệu học tập
            </Link>
          )}
        </aside>
        <section className="ai-conversation">
          <div className="conversation-heading">
            <strong>Hỏi đáp theo học liệu</strong>
          </div>
          <div className="workspace-chat-log" aria-live="polite">
            {messages.length ? (
              messages.map((m) => (
                <article key={m.index}>
                  <div className="chat-user">{m.question}</div>
                  <div className="chat-answer">
                    <div>
                      <strong>Trợ lý VJU</strong>
                      <p>{m.answer}</p>
                      <div className="ai-sources">
                        {(available
                          ? (m.sources ?? (m.page ? [m.page] : []))
                          : []
                        ).map((page) => (
                          <Link
                            key={page}
                            className="source-chip"
                            to={link(page)}
                          >
                            Bài giảng RESTful API · Trang {page}
                          </Link>
                        ))}
                      </div>
                      <div className="ai-feedback">
                        <button
                          className="icon-button"
                          aria-label="Phản hồi hữu ích"
                          aria-pressed={m.rating === "helpful"}
                          onClick={() =>
                            setData((d) => ({
                              ...d,
                              chat: d.chat.map((c, i) =>
                                i === m.index ? { ...c, rating: "helpful" } : c,
                              ),
                            }))
                          }
                        >
                          <ThumbsUp size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label="Báo cáo câu trả lời"
                          aria-pressed={m.rating === "reported"}
                          onClick={() =>
                            setData((d) => ({
                              ...d,
                              chat: d.chat.map((c, i) =>
                                i === m.index
                                  ? { ...c, rating: "reported" }
                                  : c,
                              ),
                              feedback:
                                m.rating === "reported"
                                  ? d.feedback
                                  : [
                                      ...d.feedback,
                                      {
                                        id: crypto.randomUUID(),
                                        student: d.profile.name,
                                        course,
                                        lesson: "Thiết kế RESTful API",
                                        category: "Chat AI",
                                        body: `Cần kiểm tra câu trả lời: ${m.question}\n${m.answer}`,
                                        images: [],
                                        response: "",
                                        resolved: false,
                                        date: new Date().toLocaleDateString(
                                          "vi-VN",
                                        ),
                                      },
                                    ],
                            }))
                          }
                        >
                          <Flag size={16} />
                        </button>
                        {m.rating && (
                          <span className="ai-rating">
                            {m.rating === "helpful"
                              ? "Đã ghi nhận hữu ích"
                              : "Đã gửi phản hồi để kiểm tra"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="ai-empty">
                <h2>Bạn muốn hỏi phần nào trong bài?</h2>
                <p>Chọn câu hỏi hoặc nhập nội dung cần giải thích.</p>
                <div className="prompt-suggestions">
                  {[
                    "Giải thích RESTful API bằng ví dụ",
                    "Phân biệt PUT và PATCH",
                    "Ôn lại mã trạng thái HTTP",
                  ].map((q) => (
                    <button key={q} onClick={() => ask(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <form
            className="workspace-chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(text);
            }}
          >
            <input
              aria-label="Nhập câu hỏi AI"
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Hỏi về nội dung bài học…"
            />
            <Button aria-label="Gửi câu hỏi" disabled={busy || !text.trim()}>
              <Send size={17} />
            </Button>
          </form>
          <small className="ai-disclaimer">
            Phản hồi mô phỏng từ học liệu mẫu; chưa kết nối mô hình AI. AI có
            thể mắc lỗi. Hãy kiểm tra nguồn và đối chiếu với bài giảng.
          </small>
        </section>
      </div>
    </>
  );
}
