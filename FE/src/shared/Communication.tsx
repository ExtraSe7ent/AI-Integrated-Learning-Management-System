import { useState } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckCircle2,
  Search,
  ArrowUpRight,
  FileText,
  Plus,
  Trash2,
  Download,
  Sparkles,
  Flag,
  ThumbsUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDemo } from "../data/DemoProvider";
import { courses } from "../data/fixtures";
import { validateImages } from "../data/rules";
import {
  PageHeader,
  Panel,
  Badge,
  Button,
  Field,
  Dialog,
  Empty,
  SearchField,
} from "./UI";
export function PhanHoi({ teacher = false }: { teacher?: boolean }) {
  const { data, setData, notify } = useDemo();
  const [compose, setCompose] = useState(false),
    [category, setCategory] = useState("Bài giảng"),
    [course, setCourse] = useState("cs301"),
    [body, setBody] = useState(""),
    [images, setImages] = useState<File[]>([]),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("all");
  const items = data.feedback.filter(
    (f) =>
      filter === "all" || (filter === "pending" ? !f.resolved : f.resolved),
  );
  return (
    <>
      <PageHeader
        title={teacher ? "Phản hồi & giải đáp" : "Phản hồi & hỗ trợ"}
        description={
          teacher
            ? "Lắng nghe sinh viên, theo dõi và giải quyết từng vấn đề."
            : "Gửi thắc mắc về học liệu, bài tập hoặc trải nghiệm học."
        }
        action={
          !teacher && (
            <Button onClick={() => setCompose(true)}>
              <Plus size={17} />
              Gửi phản hồi
            </Button>
          )
        }
      />
      <div className="toolbar">
        <div className="tabs">
          {[
            ["all", "Tất cả"],
            ["pending", "Chờ xử lý"],
            ["resolved", "Đã xử lý"],
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
        <span className="muted">{items.length} phản hồi</span>
      </div>
      {items.length ? (
        items.map((f) => (
          <Panel key={f.id} className="feedback-card">
            <div className="panel-heading">
              <div className="inline-meta">
                <span className="avatar small">QA</span>
                <strong>{f.student}</strong>
                <span className="muted">{f.date}</span>
              </div>
              <Badge tone={f.resolved ? "green" : "amber"}>
                {f.resolved ? "Đã xử lý" : "Chờ xử lý"}
              </Badge>
            </div>
            <div className="inline-meta">
              <Badge>{f.category}</Badge>
              <span>
                {courses.find((c) => c.id === f.course)?.code} · {f.lesson}
              </span>
            </div>
            <h2>{f.body}</h2>
            {f.images.map((name) => (
              <span className="attachment" key={name}>
                <Paperclip size={14} />
                {name}
              </span>
            ))}
            {f.response ? (
              <div className="reply-block">
                <strong>Phản hồi của giảng viên</strong>
                <p>{f.response}</p>
              </div>
            ) : teacher ? (
              <form
                className="reply-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = new FormData(e.currentTarget).get(
                    "response",
                  ) as string;
                  setData((d) => ({
                    ...d,
                    feedback: d.feedback.map((x) =>
                      x.id === f.id
                        ? { ...x, response: value, resolved: true }
                        : x,
                    ),
                    notices: [
                      ...d.notices,
                      "Giảng viên đã trả lời phản hồi của bạn.",
                    ],
                    readNotices: false,
                  }));
                  notify("Đã lưu phản hồi và đánh dấu đã xử lý.");
                }}
              >
                <Field label="Trả lời sinh viên">
                  <textarea
                    name="response"
                    required
                    minLength={5}
                    rows={3}
                    placeholder="Nhập hướng dẫn hoặc lời giải đáp…"
                  />
                </Field>
                <Button>
                  <CheckCircle2 size={16} />
                  Trả lời & đánh dấu đã xử lý
                </Button>
              </form>
            ) : (
              <p className="muted">
                <MessageSquare size={15} /> Giảng viên sẽ phản hồi tại đây.
              </p>
            )}
          </Panel>
        ))
      ) : (
        <Empty
          title="Không có phản hồi trong mục này"
          description="Chọn Tất cả hoặc gửi một phản hồi mới."
        />
      )}
      {teacher && (
        <Panel title="Kiến thức mờ theo trang">
          {data.gaps.map((g) => (
            <div className="gap-item" key={g.id}>
              <Badge>Trang {g.page}</Badge>
              <p>{g.body}</p>
              {g.response ? (
                <div className="reply-block">
                  {g.response}
                  <Badge tone="green">Đã giải thích</Badge>
                </div>
              ) : (
                <form
                  className="inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const value = new FormData(e.currentTarget).get(
                      "answer",
                    ) as string;
                    setData((d) => ({
                      ...d,
                      gaps: d.gaps.map((x) =>
                        x.id === g.id ? { ...x, response: value } : x,
                      ),
                    }));
                  }}
                >
                  <input
                    aria-label={`Giải đáp trang ${g.page}`}
                    name="answer"
                    required
                    placeholder="Giải đáp cho sinh viên…"
                  />
                  <Button variant="secondary small">Đã giải thích</Button>
                </form>
              )}
            </div>
          ))}
        </Panel>
      )}
      {compose && (
        <Dialog title="Gửi phản hồi" onClose={() => setCompose(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const invalid = validateImages(images);
              if (invalid) {
                setError(invalid);
                return;
              }
              setData((d) => ({
                ...d,
                feedback: [
                  {
                    id: crypto.randomUUID(),
                    student: d.profile.name,
                    course,
                    lesson: "Thiết kế RESTful API",
                    category,
                    body: body.trim(),
                    images: images.map((f) => f.name),
                    response: "",
                    resolved: false,
                    date: new Date().toLocaleDateString("vi-VN"),
                  },
                  ...d.feedback,
                ],
              }));
              setCompose(false);
              setBody("");
              setImages([]);
              notify("Đã lưu phản hồi.");
            }}
          >
            <div className="form-grid">
              <Field label="Lớp học">
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Loại vấn đề">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {["Bài giảng", "Bài tập", "Chat AI", "Kỹ thuật", "Khác"].map(
                    (v) => (
                      <option key={v}>{v}</option>
                    ),
                  )}
                </select>
              </Field>
            </div>
            <Field label="Bài học">
              <input value="Thiết kế RESTful API" readOnly />
            </Field>
            <Field label="Nội dung phản hồi">
              <textarea
                required
                minLength={10}
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </Field>
            <Field label="Ảnh đính kèm" hint="Tối đa 5 ảnh, tổng 5 MB.">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = [...(e.target.files || [])];
                  setImages(files);
                  setError(validateImages(files));
                }}
              />
            </Field>
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <Button disabled={Boolean(error)}>
              <Send size={16} />
              Gửi phản hồi
            </Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
export function TaiLieu({ teacher = false }: { teacher?: boolean }) {
  const { data, setData, notify } = useDemo();
  const [search, setSearch] = useState(""),
    [add, setAdd] = useState(false);
  const items = data.resources.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Tài liệu tham khảo"
        description="Nguồn học liệu bổ sung, tập trung theo học phần."
        action={
          teacher && (
            <Button onClick={() => setAdd(true)}>
              <Plus size={17} />
              Thêm tài liệu
            </Button>
          )
        }
      />
      <div className="toolbar">
        <Badge>CSE301 · Tất cả tài liệu</Badge>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Tìm tài liệu…"
        />
      </div>
      <Panel>
        {items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tài liệu</th>
                  <th>Loại</th>
                  <th>Nguồn</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="table-title">
                        <span className="task-icon">
                          <FileText size={20} />
                        </span>
                        <div>
                          <strong>{r.title}</strong>
                          <p>{r.description}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge>{r.kind.toUpperCase()}</Badge>
                    </td>
                    <td>CSE301</td>
                    <td>
                      <div className="row-actions">
                        <a
                          className="button secondary small"
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Mở
                          <ArrowUpRight size={15} />
                        </a>
                        {r.kind === "pdf" && (
                          <a
                            className="icon-button"
                            href={r.url}
                            download
                            aria-label={`Tải ${r.title}`}
                          >
                            <Download size={16} />
                          </a>
                        )}
                        {teacher && (
                          <button
                            className="icon-button danger"
                            aria-label={`Xóa ${r.title}`}
                            onClick={() =>
                              setData((d) => ({
                                ...d,
                                resources: d.resources.filter(
                                  (x) => x.id !== r.id,
                                ),
                              }))
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Không tìm thấy tài liệu"
            description="Hãy thử từ khóa khác."
          />
        )}
      </Panel>
      {add && (
        <Dialog title="Thêm tài liệu tham khảo" onClose={() => setAdd(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const url = String(f.get("url"));
              if (!/^https?:\/\//.test(url)) {
                notify(
                  "Vui lòng nhập liên kết bắt đầu bằng https:// hoặc http://.",
                );
                return;
              }
              setData((d) => ({
                ...d,
                resources: [
                  ...d.resources,
                  {
                    id: crypto.randomUUID(),
                    title: String(f.get("title")),
                    description: String(f.get("description")),
                    url,
                    kind: "link",
                  },
                ],
              }));
              setAdd(false);
            }}
          >
            <Field label="Tên tài liệu">
              <input name="title" required />
            </Field>
            <Field label="Mô tả ngắn">
              <input name="description" />
            </Field>
            <Field label="Liên kết tài liệu hoặc video YouTube">
              <input name="url" type="url" required placeholder="https://…" />
            </Field>
            <Button>Thêm tài liệu</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
export function TroLyAI({ teacher = false }: { teacher?: boolean }) {
  const { data, setData, notify } = useDemo();
  const lessonLink = teacher ? "/giang-vien/soan-bai" : "/sinh-vien/hoc/cs301";
  const [text, setText] = useState(""),
    [course, setCourse] = useState("cs301");
  const ask = (question: string) => {
    if (!question.trim()) return;
    setData((d) => ({
      ...d,
      chat: [
        ...d.chat,
        {
          question,
          answer:
            "Gợi ý: REST dùng URI để định danh tài nguyên và HTTP methods để biểu diễn thao tác. GET đọc dữ liệu, POST tạo tài nguyên. Hãy đối chiếu trang 1–2 trong bài giảng; để được hỗ trợ ngoài nội dung này, bạn hãy hỏi giảng viên.",
          page: 1,
        },
      ],
    }));
    setText("");
  };
  return (
    <>
      <PageHeader
        title={teacher ? "Trợ lý giảng dạy AI" : "Trợ lý học tập AI"}
        description={
          teacher
            ? "Tra cứu học liệu và chuẩn bị nội dung cho lớp học."
            : "Hỏi về bài học và đối chiếu câu trả lời với tài liệu nguồn."
        }
      />
      <div className="ai-workspace">
        <aside className="ai-context">
          <h2>{teacher ? "Học liệu của lớp" : "Học liệu đang dùng"}</h2>
          <Field label="Học phần">
            <select value={course} onChange={(e) => setCourse(e.target.value)}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="source-document">
            <FileText size={22} />
            <div>
              <strong>Thiết kế RESTful API</strong>
              <small>Học liệu · 4 trang</small>
            </div>
            <Badge tone="green">Có nguồn</Badge>
          </div>
          <Link className="button secondary" to={lessonLink}>
            Mở bài học
            <ArrowUpRight size={16} />
          </Link>
          <hr />
          <h3>Nguyên tắc hỗ trợ</h3>
          <p className="muted">
            AI có thể mắc lỗi. Luôn kiểm tra nguồn. Không dùng trợ lý để giải hộ
            bài kiểm tra đang mở.
          </p>
        </aside>
        <section className="ai-conversation">
          <div className="conversation-heading">
            <Sparkles size={20} />
            <strong>Hỏi đáp theo học liệu</strong>
          </div>
          <div className="workspace-chat-log">
            {data.chat.length ? (
              data.chat.map((m, i) => (
                <article key={i}>
                  <div className="chat-user">{m.question}</div>
                  <div className="chat-answer">
                    <span className="ai-avatar">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <strong>Trợ lý VJU</strong>
                      <p>{m.answer}</p>
                      <Link className="source-chip" to={lessonLink}>
                        Bài giảng RESTful API · Trang {m.page}
                        <ArrowUpRight size={13} />
                      </Link>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label="Phản hồi hữu ích"
                          onClick={() => notify("Đã ghi nhận đánh giá.")}
                        >
                          <ThumbsUp size={14} />
                        </button>
                        <Link
                          className="icon-button"
                          aria-label="Báo cáo câu trả lời"
                          to={
                            teacher
                              ? "/giang-vien/phan-hoi"
                              : "/sinh-vien/phan-hoi"
                          }
                        >
                          <Flag size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="ai-empty">
                <h2>
                  {teacher
                    ? "Bạn cần chuẩn bị nội dung nào?"
                    : "Bạn muốn hỏi phần nào trong bài?"}
                </h2>
                <p>Chọn một câu hỏi bên dưới hoặc nhập câu hỏi của bạn.</p>
                <div className="prompt-suggestions">
                  {[
                    "Giải thích RESTful API bằng ví dụ",
                    "Phân biệt PUT và PATCH",
                    "Giúp tôi ôn lại HTTP methods",
                  ].map((q) => (
                    <button key={q} onClick={() => ask(q)}>
                      {q}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <form
            className="workspace-chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
            }}
          >
            <Search size={18} />
            <input
              aria-label="Nhập câu hỏi AI"
              placeholder="Hỏi về nội dung bài học…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              className="button"
              disabled={!text.trim()}
              aria-label="Gửi câu hỏi"
            >
              <Send size={17} />
            </button>
          </form>
          <small className="ai-disclaimer">
            AI có thể mắc lỗi. Hãy kiểm tra nguồn và đối chiếu với bài giảng.
          </small>
        </section>
      </div>
    </>
  );
}
