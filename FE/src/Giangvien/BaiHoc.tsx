import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  FileText,
  Upload,
  Video,
  CheckCircle2,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import { materialFileUrl, uploadLessonPdf } from "../api/materials";
import { isYouTube, pagesOf, questionsOf, lessonOf } from "../data/content";
import { useScope } from "../shared/useScope";
import {
  PageHeader,
  Panel,
  Button,
  Field,
  Dialog,
  Badge,
  Empty,
} from "../shared/UI";
import { CourseContext } from "../shared/CourseComponents";
import { TeacherAdjustmentRequests } from "../Truongnhomhp/TeacherRequests";
export function BaiHoc() {
  const { data, setData, notify } = useDemo();
  // Only lessons of classes Admin assigned to this lecturer; other classes' lessons are not theirs to edit.
  const { classes, lessons } = useScope();
  const [edit, setEdit] = useState<string | null>(null),
    [title, setTitle] = useState(""),
    [classId, setClassId] = useState("");
  function move(i: number, delta: number) {
    const a = lessons[i].id,
      b = lessons[i + delta].id;
    setData((d) => {
      const list = [...d.lessons];
      const x = list.findIndex((l) => l.id === a),
        y = list.findIndex((l) => l.id === b);
      [list[x], list[y]] = [list[y], list[x]];
      return { ...d, lessons: list.map((l, k) => ({ ...l, order: k + 1 })) };
    });
  }
  return (
    <>
      <PageHeader
        title="Bài học & học liệu"
        description="Tổ chức nội dung theo tuần và chuẩn bị trải nghiệm học tập."
        action={
          <Button
            disabled={!classes.length}
            title={classes.length ? undefined : "Bạn chưa được phân công lớp nào"}
            onClick={() => {
              setEdit("new");
              setTitle("");
              setClassId(classes[0]?.id ?? "");
            }}
          >
            <Plus size={17} />
            Tạo bài học
          </Button>
        }
      />
      <CourseContext />
      <TeacherAdjustmentRequests />
      <Panel
        title="Nội dung học phần"
        action={<span className="muted">{lessons.length} bài học</span>}
      >
        {lessons.map((l, i) => (
          <div className="lesson-row" key={l.id}>
            <GripVertical size={19} className="muted" />
            <span className="week-number" title={l.week ? `Tuần ${l.week}` : undefined}>
              {l.week ? `T${l.week}` : String(i + 1).padStart(2, "0")}
            </span>
            <div className="lesson-title">
              <strong>{l.title}</strong>
              <small>
                {data.admin.classes.find((c) => c.id === (l.classId ?? "CSE301.01"))?.name ??
                  l.classId ??
                  "CSE301.01"}{" "}
                ·{" "}
                {l.activity
                  ? "Đã có hoạt động của sinh viên"
                  : "Chưa có dữ liệu sinh viên"}
              </small>
            </div>
            {l.published && !data.sessions.some(session => lessonOf(session) === l.id && session.published) && <Link className="text-link" to={`/giang-vien/phien-tu-hoc?bai=${encodeURIComponent(l.id)}`}>Chưa mở phiên · Tạo phiên tự học</Link>}
            <Badge tone={l.published ? "green" : "neutral"}>
              {l.published ? "Đã công bố" : "Bản nháp"}
            </Badge>
            <div className="row-actions">
              <button
                className="icon-button"
                aria-label={`Đưa bài ${i + 1} lên`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={`Đưa bài ${i + 1} xuống`}
                disabled={i === lessons.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={`Đổi tên ${l.title}`}
                onClick={() => {
                  setEdit(l.id);
                  setTitle(l.title);
                }}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-button danger"
                aria-label={`Xóa ${l.title}`}
                disabled={l.activity}
                title={
                  l.activity
                    ? "Không thể xóa bài đã có dữ liệu sinh viên"
                    : "Xóa bài học"
                }
                onClick={() => {
                  setData((d) => ({
                    ...d,
                    lessons: d.lessons.filter((x) => x.id !== l.id),
                  }));
                  notify("Đã xóa bài học nháp.");
                }}
              >
                <Trash2 size={16} />
              </button>
              <Link
                className="button secondary small"
                to={`/giang-vien/soan-bai?bai=${l.id}`}
              >
                Soạn bài
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ))}
        {!lessons.length && (
          <Empty
            title="Chưa có bài học"
            description={
              classes.length
                ? "Tạo bài học đầu tiên để bắt đầu."
                : "Bạn chưa được Admin phân công phụ trách lớp nào."
            }
          />
        )}
      </Panel>
      <div className="info-line">
        <LockKeyhole size={16} />
        Bài học đã có dữ liệu sinh viên được bảo vệ khỏi thao tác xóa.
      </div>
      {edit && (
        <Dialog
          title={edit === "new" ? "Tạo bài học" : "Đổi tên bài học"}
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setData((d) => ({
                ...d,
                lessons:
                  edit === "new"
                    ? [
                        ...d.lessons,
                        {
                          id: crypto.randomUUID(),
                          classId,
                          title: title.trim(),
                          order: d.lessons.length + 1,
                          week: Math.min(
                            15,
                            d.lessons.filter((x) => x.classId === classId).length + 1,
                          ),
                          published: false,
                          activity: false,
                        },
                      ]
                    : d.lessons.map((l) =>
                        l.id === edit ? { ...l, title: title.trim() } : l,
                      ),
              }));
              setEdit(null);
            }}
          >
            {edit === "new" && (
              <Field label="Lớp học phần">
                <select
                  aria-label="Lớp học phần"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {data.admin.courses.find((x) => x.id === c.courseId)?.code ?? c.courseId}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Tên bài học">
              <input
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Button>Lưu bài học</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
export function SoanBai() {
  const { data } = useDemo();
  const [params] = useSearchParams();
  const lesson = data.lessons.find((l) => l.id === (params.get("bai") || "l2"));
  if (!lesson)
    return (
      <Panel title="Không tìm thấy bài học">
        <Link to="/giang-vien/bai-hoc">Về bài học</Link>
      </Panel>
    );
  // Mounted only once the lesson is loaded, so the form starts from the saved values.
  return <LessonEditor key={lesson.id} />;
}
function LessonEditor() {
  const { data, setData, saveData, notify } = useDemo();
  const [params] = useSearchParams();
  const lessonId=params.get("bai")||"l2";
  const lesson=data.lessons.find(l=>l.id===lessonId);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("slides"),
    [title, setTitle] = useState(lesson?.title||""),
    [pages, setPages] = useState(pagesOf(lesson).length ? pagesOf(lesson) : ["Trang 1"]),
    [selected, setSelected] = useState(0),
    [preview, setPreview] = useState(""),
    [uploading, setUploading] = useState(false),
    [week, setWeek] = useState(lesson?.week ?? 1),
    [video, setVideo] = useState(lesson?.video||"");
  const materialId = lesson?.materialId;
  // Show the PDF saved on the server when the editor is opened again.
  useEffect(() => {
    if (!materialId) return;
    let url = "";
    let live = true;
    materialFileUrl(materialId).then(
      (u) => {
        url = u;
        if (live) setPreview(u);
        else URL.revokeObjectURL(u);
      },
      () => undefined,
    );
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [materialId]);
  // Changes are saved as a draft on their own, so nothing is lost when the lecturer leaves the page.
  const videoValid = !video.trim() || isYouTube(video);
  const unsaved =
    Boolean(lesson) &&
    Boolean(title.trim()) &&
    videoValid &&
    !(
      lesson!.title === title &&
      (lesson!.video ?? "") === video &&
      (lesson!.week ?? 1) === week &&
      JSON.stringify(pagesOf(lesson).length ? pagesOf(lesson) : ["Trang 1"]) === JSON.stringify(pages)
    );
  const saveDraft = () =>
    setData((d) => ({
      ...d,
      lessons: d.lessons.map((l) =>
        l.id === lessonId ? { ...l, title, slides: pages, video, week } : l,
      ),
    }));
  // Leaving the page within the delay still keeps the last change.
  const flush = useRef<() => void>(() => undefined);
  flush.current = unsaved ? saveDraft : () => undefined;
  useEffect(() => () => flush.current(), []);
  useEffect(() => {
    if (!unsaved) return;
    const timer = setTimeout(saveDraft, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, pages, video, week, unsaved]);
  function reorder(i: number, dir: number) {
    setPages((p) => {
      const next = [...p];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  }
  const quiz = questionsOf(data.questions, lessonId);
  const videoOk = videoValid;
  if(!lesson) return <Panel title="Không tìm thấy bài học"><Link to="/giang-vien/bai-hoc">Về bài học</Link></Panel>;
  return (
    <>
      <PageHeader
        title="Soạn bài học"
        description="Chuẩn bị học liệu, câu hỏi và kiểm tra trước khi công bố."
        action={
          <div className="row-actions">
            <Button
              variant="secondary"
              disabled={saving}
              aria-busy={saving}
              onClick={async () => {
                if (!videoOk) {
                  notify("Nhập liên kết YouTube hợp lệ hoặc để trống video.");
                  return;
                }
                setSaving(true);
                const saved = await saveData((d) => ({
                  ...d,
                  lessons: d.lessons.map((l) =>
                    l.id === lessonId ? { ...l, title, slides:pages, video, week } : l,
                  ),
                }));
                setSaving(false);
                if (saved) notify("Đã lưu thông tin bài học.");
              }}
            >
              {saving ? "Đang lưu…" : "Lưu bản nháp"}
            </Button>
            <Button
              disabled={saving}
              aria-busy={saving}
              onClick={async () => {
                if (quiz.some((q) => !q.approved)) {
                  notify("Cần duyệt tất cả câu hỏi của bài này trước khi công bố.");
                  return;
                }
                if (!videoOk) {
                  notify("Nhập liên kết YouTube hợp lệ hoặc để trống video.");
                  return;
                }
                setSaving(true);
                const saved = await saveData((d) => ({
                  ...d,
                  lessons: d.lessons.map((l) =>
                    l.id === lessonId ? { ...l, title, slides:pages, video, week, published: true } : l,
                  ),
                }));
                setSaving(false);
                if (saved) notify("Đã công bố học liệu.");
              }}
            >
              <CheckCircle2 size={17} />
              Công bố
            </Button>
          </div>
        }
      />
      <CourseContext />
      <div className="editor-layout">
        <aside>
          <Panel title="Thông tin bài học">
            <Field label="Tên bài học">
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Tuần học">
              <select
                aria-label="Tuần học"
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
              >
                {Array.from({ length: 15 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Tuần {w}
                  </option>
                ))}
              </select>
            </Field>
            <small className="muted">
              Tuần trong học kỳ dạy bài này. Sinh viên thấy bài được xếp theo tuần trong trang khóa học.
            </small>
            <Badge tone={lesson?.published ? "green" : "neutral"}>
              {lesson?.published ? "Đã công bố" : "Bản nháp"}
            </Badge>
          </Panel>
          <Panel title="Trang bài giảng">
            <div className="editor-slides">
              {pages.map((p, i) => (
                <div
                  key={`${p}-${i}`}
                  className={selected === i ? "selected" : ""}
                >
                  <button
                    className="slide-label"
                    onClick={() => setSelected(i)}
                  >
                    <FileText size={18} />
                    <span>
                      {i + 1}. {p}
                    </span>
                  </button>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Đưa slide ${i + 1} lên`}
                      disabled={i === 0}
                      onClick={() => reorder(i, -1)}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Đưa slide ${i + 1} xuống`}
                      disabled={i === pages.length - 1}
                      onClick={() => reorder(i, 1)}
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`Xóa slide ${i + 1}`}
                      disabled={pages.length === 1}
                      onClick={() => {
                        setPages((p) => p.filter((_, j) => j !== i));
                        setSelected(0);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="secondary small"
              onClick={() =>
                setPages((p) => [...p, `Trang mới ${p.length + 1}`])
              }
            >
              <Plus size={15} />
              Thêm trang
            </Button>
            <small className="muted">
              Sắp xếp trang ở đây mô phỏng tổ chức học liệu, không sửa tệp PDF
              gốc.
            </small>
          </Panel>
        </aside>
        <div>
          <div className="tabs">
            {[
              ["slides", "Bài giảng"],
              ["video", "Video"],
              ["questions", "Câu hỏi"],
            ].map(([v, t]) => (
              <button
                key={v}
                className={tab === v ? "selected" : ""}
                onClick={() => setTab(v)}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "slides" ? (
            <>
              <div className="editor-preview">
                {preview ? (
                  <iframe src={preview} title="Xem trước PDF đã chọn" />
                ) : (
                  <>
                    <img src="/brand/vju-seal.jpeg" alt="VJU" />
                    <span>{title.toUpperCase()}</span>
                    <h2>{pages[selected] || pages[0]}</h2>
                    <p className="muted">Chọn tệp PDF bên dưới để xem trước nội dung bài giảng.</p>
                    <small>
                      Trang {selected + 1} / {pages.length} · Học liệu
                    </small>
                  </>
                )}
              </div>
              <label className="upload-zone">
                <Upload size={23} />
                <strong>
                  {uploading
                    ? "Đang tải lên…"
                    : lesson.pdfName
                      ? `Đã lưu: ${lesson.pdfName} · Chọn tệp khác để thay thế`
                      : "Chọn tệp bài giảng PDF"}
                </strong>
                <span>PDF tối đa 10 MB · Tệp được lưu ngay khi tải lên, không cần bấm Lưu bản nháp</span>
                <input
                  aria-label="Upload bài giảng PDF"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (
                      f.size > 10 * 1024 * 1024 ||
                      !f.name.toLowerCase().endsWith(".pdf")
                    ) {
                      notify("Vui lòng chọn PDF tối đa 10 MB.");
                      return;
                    }
                    e.target.value = "";
                    setUploading(true);
                    void uploadLessonPdf(f, title || f.name, lesson.classId || "CSE301.01", week, lesson.materialId)
                      .then(
                        ({ id, name }) => {
                          if (preview) URL.revokeObjectURL(preview);
                          setPreview(URL.createObjectURL(f));
                          setData((d) => ({
                            ...d,
                            lessons: d.lessons.map((l) =>
                              l.id === lessonId ? { ...l, materialId: id, pdfName: name } : l,
                            ),
                          }));
                          notify("Đã lưu PDF vào bài học và bắt đầu lập chỉ mục cho trợ lý AI.");
                        },
                        (e) => notify((e as Error).message),
                      )
                      .finally(() => setUploading(false));
                  }}
                />
              </label>
            </>
          ) : tab === "video" ? (
            <Panel title="Video bài giảng">
              <Video size={30} />
              <Field label="Liên kết video YouTube">
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={video}
                  onChange={(e) => setVideo(e.target.value)}
                />
              </Field>
              <Button
                onClick={() => {
                  if (!isYouTube(video)) {
                    notify("Nhập liên kết YouTube hợp lệ.");
                    return;
                  }
                  setData((d) => ({
                    ...d,
                    resources: [
                      ...d.resources,
                      {
                        id: crypto.randomUUID(),
                        title: `Video: ${title}`,
                        description: "Video YouTube do giảng viên thêm",
                        url: video,
                        kind: "video",
                      },
                    ],
                  }));
                  notify("Đã thêm liên kết video vào tài liệu lớp.");
                }}
              >
                Thêm video
              </Button>
            </Panel>
          ) : (
            <Panel title="Câu hỏi theo trang">
              {!quiz.length && (
                <p className="muted">Bài này chưa có câu hỏi kiểm tra.</p>
              )}
              {quiz.map((q) => (
                <div className="question-preview" key={q.id}>
                  <Badge>Trang {q.page}</Badge>
                  <strong>{q.text}</strong>
                  <Badge tone={q.approved ? "green" : "amber"}>
                    {q.approved ? "Đã duyệt" : "Chờ duyệt"}
                  </Badge>
                </div>
              ))}
              <Link className="button" to={`/giang-vien/ngan-hang-cau-hoi?bai=${lessonId}`}>
                Soạn & duyệt câu hỏi
                <ArrowRight size={16} />
              </Link>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
