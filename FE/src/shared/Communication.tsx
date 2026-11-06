import { FeedbackImages, storeImages } from "./attachments";
import { useState } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import { useScope } from "./useScope";
import { validateImages } from "../data/rules";
import {
  PageHeader,
  Panel,
  Badge,
  Button,
  Field,
  Dialog,
  Empty,
} from "./UI";
export function PhanHoi({ teacher = false }: { teacher?: boolean }) {
  const { data, setData, notify } = useDemo();
  const { courses, classes, lessons } = useScope();
  // Lessons of the student's classes in the chosen course, instead of the CSE301 demo only.
  const lessonsOfCourse = (courseId: string) => {
    const mine = classes.filter((c) => c.courseId === courseId).map((c) => c.id);
    return lessons.filter((l) => l.published && mine.includes(l.classId || "CSE301.01"));
  };
  const [compose, setCompose] = useState(false),
    [category, setCategory] = useState("Bài giảng"),
    [course, setCourse] = useState(courses[0]?.id ?? "cs301"),
    [body, setBody] = useState(""),
    [lessonId, setLessonId] = useState("l2"),
    [saving, setSaving] = useState(false),
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
                {data.admin.courses.find((c) => c.id === f.course)?.code ?? f.course} · {f.lesson}
              </span>
            </div>
            <h2>{f.body}</h2>
            {f.imageIds?.length ? (
              <FeedbackImages ids={f.imageIds} names={f.images} />
            ) : (
              f.images.map((name) => (
                <span className="attachment" key={name}>
                  <Paperclip size={14} />
                  {name}
                </span>
              ))
            )}
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
            onSubmit={async (e) => {
              e.preventDefault();
              if (saving) return;
              const selectedLesson = data.lessons.find(
                (l) => l.id === lessonId,
              );
              if (!selectedLesson || !lessonsOfCourse(course).some((l) => l.id === lessonId)) {
                setError("Chọn bài học có trong lớp trước khi gửi.");
                return;
              }
              const invalid = validateImages(images);
              if (invalid) {
                setError(invalid);
                return;
              }
              setSaving(true);
              let imageIds: string[];
              try {
                imageIds = await storeImages(images);
              } catch (err) {
                setError((err as Error).message);
                setSaving(false);
                return;
              }
              setData((d) => ({
                ...d,
                feedback: [
                  {
                    id: crypto.randomUUID(),
                    student: d.profile.name,
                    course,
                    lesson: selectedLesson.title,
                    category,
                    body: body.trim(),
                    images: images.map((f) => f.name),
                    imageIds,
                    response: "",
                    resolved: false,
                    date: new Date().toLocaleDateString("vi-VN"),
                  },
                  ...d.feedback,
                ],
              }));
              setSaving(false);
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
              <select
                aria-label="Bài học"
                value={lessonsOfCourse(course).some((l) => l.id === lessonId) ? lessonId : ""}
                onChange={(e) => setLessonId(e.target.value)}
              >
                <option value="">Chọn bài học</option>
                {lessonsOfCourse(course).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
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
                accept="image/png,image/jpeg,image/webp,image/gif"
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
export { TaiLieu } from "./References";
export { Assistant as TroLyAI } from "../AI/Assistant";
