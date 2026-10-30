import { useState } from "react";
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
import { slideTitles } from "../data/fixtures";
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
  const [edit, setEdit] = useState<string | null>(null),
    [title, setTitle] = useState("");
  function move(i: number, delta: number) {
    setData((d) => {
      const lessons = [...d.lessons];
      [lessons[i], lessons[i + delta]] = [lessons[i + delta], lessons[i]];
      return { ...d, lessons: lessons.map((l, i) => ({ ...l, order: i + 1 })) };
    });
  }
  return (
    <>
      <PageHeader
        title="Bài học & học liệu"
        description="Tổ chức nội dung theo tuần và chuẩn bị trải nghiệm học tập."
        action={
          <Button
            onClick={() => {
              setEdit("new");
              setTitle("");
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
        action={<span className="muted">{data.lessons.length} bài học</span>}
      >
        {data.lessons.map((l, i) => (
          <div className="lesson-row" key={l.id}>
            <GripVertical size={19} className="muted" />
            <span className="week-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="lesson-title">
              <strong>{l.title}</strong>
              <small>
                {l.activity
                  ? "Đã có hoạt động của sinh viên"
                  : "Chưa có dữ liệu sinh viên"}
              </small>
            </div>
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
                disabled={i === data.lessons.length - 1}
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
        {!data.lessons.length && (
          <Empty
            title="Chưa có bài học"
            description="Tạo bài học đầu tiên để bắt đầu."
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
                          title: title.trim(),
                          order: d.lessons.length + 1,
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
  const { data, setData, notify } = useDemo();
  const [params] = useSearchParams();
  const lessonId=params.get("bai")||"l2";
  const lesson=data.lessons.find(l=>l.id===lessonId);
  const [tab, setTab] = useState("slides"),
    [title, setTitle] = useState(lesson?.title||""),
    [pages, setPages] = useState(lesson?.slides||slideTitles),
    [selected, setSelected] = useState(0),
    [preview, setPreview] = useState(""),
    [filename, setFilename] = useState(""),
    [video, setVideo] = useState(lesson?.video||"");
  function reorder(i: number, dir: number) {
    setPages((p) => {
      const next = [...p];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  }
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
              onClick={() => {
                setData((d) => ({
                  ...d,
                  lessons: d.lessons.map((l) =>
                    l.id === lessonId ? { ...l, title, slides:pages, video } : l,
                  ),
                }));
                notify("Đã lưu thông tin bài học.");
              }}
            >
              Lưu bản nháp
            </Button>
            <Button
              onClick={() => {
                if (data.questions.some((q) => !q.approved)) {
                  notify("Cần duyệt tất cả câu hỏi AI trước khi công bố.");
                  return;
                }
                setData((d) => ({
                  ...d,
                  lessons: d.lessons.map((l) =>
                    l.id === lessonId ? { ...l, title, slides:pages, video, published: true } : l,
                  ),
                }));
                notify("Đã công bố học liệu.");
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
              <select defaultValue="7">
                {[5, 6, 7, 8].map((w) => (
                  <option key={w} value={w}>
                    Tuần {w}
                  </option>
                ))}
              </select>
            </Field>
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
                    <span>CSE301 · TUẦN 07</span>
                    <h2>{pages[selected] || pages[0]}</h2>
                    <p>
                      Thiết kế tài nguyên, phương thức HTTP
                      <br />
                      và phản hồi nhất quán.
                    </p>
                    <div className="method-row">
                      <span>GET</span>
                      <span>POST</span>
                      <span>PUT</span>
                      <span>DELETE</span>
                    </div>
                    <small>
                      Trang {selected + 1} / {pages.length} · Học liệu
                    </small>
                  </>
                )}
              </div>
              <label className="upload-zone">
                <Upload size={23} />
                <strong>{filename || "Chọn tệp bài giảng PDF"}</strong>
                <span>PDF tối đa 10 MB · Xem trước ngay trong trình duyệt</span>
                <input
                  aria-label="Upload bài giảng PDF"
                  type="file"
                  accept="application/pdf,.pdf"
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
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview(URL.createObjectURL(f));
                    setFilename(f.name);
                    notify(
                      "Đã mở PDF cục bộ. Tệp chưa được upload và không giữ sau khi tải lại.",
                    );
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
                  if (
                    !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(video)
                  ) {
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
              {data.questions.map((q) => (
                <div className="question-preview" key={q.id}>
                  <Badge>Trang {q.page}</Badge>
                  <strong>{q.text}</strong>
                  <Badge tone={q.approved ? "green" : "amber"}>
                    {q.approved ? "Đã duyệt" : "Chờ duyệt"}
                  </Badge>
                </div>
              ))}
              <Link className="button" to="/giang-vien/ngan-hang-cau-hoi">
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
