import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Clock3,
  FileText,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Shuffle,
  Trash2,
  Pencil,
} from "lucide-react";
import { examOf, examTotal, pointsFor, shownAnswer, typeLabel } from "../data/assessment";
import type { ExamQuestion } from "../data/fixtures";
import { useDemo } from "../data/DemoProvider";
import { PageHeader, Panel, Button, Badge, Field, Empty, Dialog } from "../shared/UI";
import { useScope } from "../shared/useScope";
import { CourseContext } from "../shared/CourseComponents";
import {
  releaseAssignmentAnswers,
  essayDrafts,
  publishGrade,
  submissionsOf,
  suggestQuestions,
} from "../api/learning";
import type { EssayDraft, Submission } from "../api/learning";

export function BaiTapGiangVien() {
  const { data, saveData, reload, notify } = useDemo();
  const [releasing,setReleasing]=useState<string|null>(null),[busy,setBusy]=useState(false);
  return (
    <>
      <PageHeader
        title="Bài tập & kiểm tra"
        description="Thiết lập đề bài, thời gian làm và quản lý kết quả."
        action={
          <Link className="button" to="/giang-vien/tao-bai-tap">
            <Plus size={17} />
            Tạo bài tập
          </Link>
        }
      />
      <CourseContext />
      {data.assignments.map((a) => (
        <Panel key={a.id} className="assignment-card">
          <div className="panel-heading">
            <div>
              <Badge tone={a.published ? "green" : "neutral"}>
                {a.published ? "Đã công bố" : "Bản nháp"}
              </Badge>
              <h2>{a.title}</h2>
            </div>
            <div className="row-actions">
              <Button
                variant="secondary small"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try{await saveData(d=>({...d,assignments:d.assignments.map(x=>x.id===a.id?{...x,published:!x.published}:x)}));}
                  finally{setBusy(false);}
                }}
              >
                {a.published ? "Ẩn bài tập" : "Công bố"}
              </Button>
              <Link
                className="button secondary small"
                to={`/giang-vien/tao-bai-tap?bai=${a.id}`}
              >
                <Pencil size={15} />
                Sửa đề
              </Link>
              <Link
                className="button small"
                to={`/giang-vien/cham-bai?bai=${a.id}`}
              >
                Chấm bài
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <div className="assignment-facts">
            <span>
              <Clock3 size={16} />
              {a.minutes} phút
            </span>
            <span>
              <FileText size={16} />
              {examOf(a).length} câu · {examTotal(examOf(a))} điểm
            </span>
            <span>
              <Shuffle size={16} />
              {a.random ? "Bật ngẫu nhiên hóa" : "Thứ tự cố định"}
            </span>
            <span>1 lượt tính điểm · Luyện tập sau công bố đáp án</span>
          </div>
          <div className="assignment-bottom">
            <small>{data.admin.classes.find(c=>c.id===a.classId)?.name??a.classId} · Đóng: {new Date(a.closes).toLocaleString("vi-VN")}</small>
            {a.published&&<div className="row-actions"><Badge tone={a.answersReleased?"green":"amber"}>{a.answersReleased?"Đã công bố đáp án":`Đã nộp ${a.submittedCount??0}/${a.studentCount??0}`}</Badge>{!a.answersReleased&&<Button variant="secondary small" disabled={busy} onClick={()=>setReleasing(a.id)}>Công bố đáp án</Button>}</div>}
          </div>
        </Panel>
      ))}
      {releasing&&<Dialog title="Công bố đáp án và chốt lượt tính điểm" onClose={()=>{if(!busy)setReleasing(null);}}>
        <p>Thao tác này đóng lượt tính điểm của cả lớp. Bài đang làm được chốt từ đáp án đã lưu; sinh viên chưa bắt đầu tính 0 điểm.</p>
        <p>Sau khi công bố không thể thu hồi đáp án. Các lần làm sau chỉ là luyện tập, không thay đổi điểm lượt đầu.</p>
        <div className="row-actions"><Button variant="secondary" disabled={busy} onClick={()=>setReleasing(null)}>Hủy</Button><Button disabled={busy} aria-busy={busy} onClick={async()=>{setBusy(true);try{await releaseAssignmentAnswers(releasing);await reload();setReleasing(null);notify("Đã công bố đáp án và chốt lượt tính điểm.");}catch(e){notify((e as Error).message);}finally{setBusy(false);}}}>{busy?"Đang công bố…":"Xác nhận công bố đáp án"}</Button></div>
      </Dialog>}
    </>
  );
}

const newQuestion = (type: ExamQuestion["type"], points: number): ExamQuestion => ({
  type,
  text: "",
  points,
  correct: type === "choice" ? "0" : "",
  explanation: "",
  ...(type === "choice" ? { options: ["", "", "", ""] } : {}),
});

function examProblem(questions: ExamQuestion[]) {
  if (!questions.length) return "Đề cần ít nhất một câu hỏi.";
  if (questions.some((q) => !q.text.trim())) return "Nhập nội dung cho mọi câu hỏi.";
  if (questions.some((q) => q.type === "choice" && q.options?.some((o) => !o.trim())))
    return "Nhập đủ các lựa chọn của câu trắc nghiệm.";
  if (questions.some((q) => q.type === "blank" && !q.correct?.trim()))
    return "Nhập đáp án cho câu điền trống.";
  if (examTotal(questions) !== 10) return "Tổng điểm của đề phải bằng 10.";
  return "";
}

function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: ExamQuestion;
  index: number;
  onChange: (change: Partial<ExamQuestion>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="reply-block">
      <div className="panel-heading">
        <strong>
          Câu {index + 1} · {typeLabel[question.type]}
        </strong>
        <Button
          type="button"
          variant="secondary small"
          aria-label={`Xóa câu ${index + 1}`}
          onClick={onRemove}
        >
          <Trash2 size={15} />
        </Button>
      </div>
      <Field label={`Nội dung câu ${index + 1}`}>
        <textarea
          rows={2}
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </Field>
      {question.type === "choice" &&
        question.options?.map((option, i) => (
          <label className="checkbox-field" key={i}>
            <input
              type="radio"
              name={`correct-${index}`}
              aria-label={`Đáp án đúng ${String.fromCharCode(65 + i)} câu ${index + 1}`}
              checked={question.correct === String(i)}
              onChange={() => onChange({ correct: String(i) })}
            />
            <input
              aria-label={`Lựa chọn ${String.fromCharCode(65 + i)} câu ${index + 1}`}
              value={option}
              onChange={(e) =>
                onChange({
                  options: question.options?.map((o, j) =>
                    j === i ? e.target.value : o,
                  ),
                })
              }
            />
          </label>
        ))}
      {question.type === "blank" && (
        <Field label="Đáp án chấp nhận (ngăn cách bằng |)">
          <input
            value={question.correct ?? ""}
            onChange={(e) => onChange({ correct: e.target.value })}
          />
        </Field>
      )}
      {question.type === "essay" && (
        <Field label="Tiêu chí chấm (tiêu chí = từ khóa|từ khóa; ...)">
          <textarea
            rows={2}
            value={question.correct ?? ""}
            onChange={(e) => onChange({ correct: e.target.value })}
          />
        </Field>
      )}
      <div className="form-grid">
        <Field label="Điểm">
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={question.points}
            onChange={(e) => onChange({ points: Number(e.target.value) })}
          />
        </Field>
        <Field label="Giải thích">
          <input
            value={question.explanation ?? ""}
            onChange={(e) => onChange({ explanation: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

export function TaoBaiTap() {
  const { classes }=useScope();
  const [saving,setSaving]=useState(false);
  const { data, saveData, notify } = useDemo();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editing = data.assignments.find((a) => a.id === params.get("bai"));
  const [questions, setQuestions] = useState<ExamQuestion[]>(
    examOf(editing).length
      ? examOf(editing)
      : [newQuestion("choice", 4), newQuestion("blank", 3), newQuestion("essay", 3)],
  );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [bankId, setBankId] = useState("");
  const approved = data.questions.filter((q) => q.approved);
  const change = (index: number, patch: Partial<ExamQuestion>) =>
    setQuestions((list) =>
      list.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  async function suggest() {
    setBusy(true);
    try {
      const courseId =
        data.analytics.classes[0]?.courseId ?? data.admin.courses[0]?.id ?? "";
      const items = await suggestQuestions({ courseId, round: questions.length });
      setQuestions((list) => [
        ...list,
        ...items.map((q) => ({
          type: "choice" as const,
          text: q.title,
          options: q.options,
          correct: String(q.options?.indexOf(q.answer) ?? 0),
          points: 1,
          explanation: q.explanation,
        })),
      ]);
      notify("Đã thêm câu AI gợi ý. Hãy rà soát trước khi lưu.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function fromBank() {
    const q = approved.find((x) => x.id === bankId);
    if (!q) return;
    setQuestions((list) => [
      ...list,
      {
        type: "choice",
        text: q.text,
        options: q.options,
        correct: String(q.correct),
        points: 1,
        explanation: q.explanation,
      },
    ]);
    setBankId("");
  }
  if(params.has("bai")&&!editing) return <Empty title="Không tìm thấy bài tập được phân công" description="Bài tập không tồn tại hoặc bạn không phụ trách lớp này." />;
  return (
    <>
      <PageHeader
        title={editing ? "Sửa bài tập" : "Tạo bài tập"}
        description="Xác định mục tiêu, cấu trúc đề và điều kiện làm bài."
      />
      <CourseContext />
      <form
        className="editor-form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const opens = String(f.get("opens")),
            closes = String(f.get("closes"));
          const problem =
            Date.parse(closes) <= Date.parse(opens)
              ? "Hạn đóng phải sau thời gian mở."
              : examProblem(questions);
          if (problem) {
            setError(problem);
            return;
          }
          const saved = {
            classId:String(f.get("classId")??editing?.classId??""),
            title: String(f.get("title")),
            minutes: Number(f.get("minutes")),
            opens,
            closes,
            preventPaste: f.has("paste"),
            attempts: 1,
            random: f.has("random"),
            questions,
          };
          setSaving(true);
          const confirmed=await saveData((d) => ({
            ...d,
            assignments: editing
              ? d.assignments.map((a) =>
                  a.id === editing.id ? { ...a, ...saved } : a,
                )
              : [
                  ...d.assignments,
                  { id: crypto.randomUUID(), published: false, ...saved },
                ],
          }));
          setSaving(false);
          if(!confirmed) return;
          notify(
            editing
              ? "Đã lưu thay đổi của đề."
              : "Đã tạo bài tập nháp. Công bố khi đã kiểm tra nội dung.",
          );
          navigate("/giang-vien/bai-tap");
        }}
      >
        <div>
          <Panel title="Thông tin bài tập">
            <Field label="Lớp học phần"><select name="classId" required defaultValue={editing?.classId??classes[0]?.id??""}><option value="" disabled>Chọn lớp được phân công</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Tên bài tập">
              <input
                name="title"
                required
                defaultValue={editing?.title}
                placeholder="Ví dụ: Thiết kế API quản lý thư viện"
              />
            </Field>
            <div className="form-grid">
              <Field label="Thời gian mở">
                <input
                  name="opens"
                  required
                  type="datetime-local"
                  defaultValue={editing?.opens ?? "2026-10-16T08:00"}
                />
              </Field>
              <Field label="Thời gian đóng">
                <input
                  name="closes"
                  required
                  type="datetime-local"
                  defaultValue={editing?.closes ?? "2027-01-31T23:59"}
                />
              </Field>
            </div>
          </Panel>
          <Panel
            title="Cấu trúc đề"
            action={
              <Badge tone={examTotal(questions) === 10 ? "green" : "amber"}>
                {examTotal(questions)}/10 điểm
              </Badge>
            }
          >
            {questions.map((q, i) => (
              <QuestionEditor
                key={i}
                question={q}
                index={i}
                onChange={(patch) => change(i, patch)}
                onRemove={() =>
                  setQuestions((list) => list.filter((_, j) => j !== i))
                }
              />
            ))}
            <div className="row-actions">
              {(["choice", "blank", "essay"] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant="secondary small"
                  onClick={() =>
                    setQuestions((list) => [...list, newQuestion(type, 1)])
                  }
                >
                  <Plus size={15} />
                  {typeLabel[type]}
                </Button>
              ))}
              <Button
                type="button"
                variant="secondary small"
                disabled={busy}
                onClick={suggest}
              >
                <Sparkles size={15} />
                AI gợi ý câu hỏi
              </Button>
            </div>
            <Field label="Lấy từ ngân hàng câu hỏi">
              <select
                aria-label="Lấy từ ngân hàng câu hỏi"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
              >
                <option value="">Chọn câu đã duyệt…</option>
                {approved.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.text}
                  </option>
                ))}
              </select>
            </Field>
            <Button
              type="button"
              variant="secondary small"
              disabled={!bankId}
              onClick={fromBank}
            >
              Thêm vào đề
            </Button>
          </Panel>
        </div>
        <aside>
          <Panel title="Điều kiện làm bài">
            <Field label="Thời gian làm (phút)">
              <input
                type="number"
                min={1}
                max={180}
                defaultValue={editing?.minutes ?? 30}
                name="minutes"
                required
              />
            </Field>
            <p className="info-line">Chỉ lượt đầu tính điểm. Sau khi công bố đáp án, sinh viên được luyện tập lại và điểm chính thức giữ nguyên.</p>
            <label className="checkbox-field">
              <input
                type="checkbox"
                name="paste"
                defaultChecked={editing?.preventPaste ?? true}
              />
              Không cho dán nội dung
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                name="random"
                defaultChecked={editing?.random}
              />
              Đánh dấu ngẫu nhiên hóa
            </label>
            <p className="muted">
              Hết giờ tự nộp. Trắc nghiệm và điền trống được chấm tự động.
            </p>
          </Panel>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving} aria-busy={saving}>{saving?"Đang lưu…":editing ? "Lưu đề" : "Lưu bài tập nháp"}</Button>
        </aside>
      </form>
    </>
  );
}

export function ChamBai() {
  const { data, setData, notify } = useDemo();
  const [params] = useSearchParams();
  const assignmentId = params.get("bai") || data.assignments[0]?.id || "";
  const assignment = data.assignments.find((a) => a.id === assignmentId);
  const questions = examOf(assignment);
  const [submissions, setSubmissions] = useState<Submission[]>([]),
    [studentId, setStudentId] = useState(""),
    [drafts, setDrafts] = useState<EssayDraft[]>([]),
    [points, setPoints] = useState<Record<number, number>>({}),
    [comment, setComment] = useState("");
  const load = () =>
    submissionsOf(assignmentId)
      .then((list) => {
        setSubmissions(list);
        setStudentId((id) => id || list[0]?.studentId || "");
      })
      .catch((e: Error) => notify(e.message));
  useEffect(() => {
    if (assignmentId) void load();
  }, [assignmentId]);
  const selected = submissions.find((s) => s.studentId === studentId);
  useEffect(() => {
    setDrafts([]);
    setPoints({});
    setComment(selected?.result?.comment ?? "");
    if (!studentId) return;
    essayDrafts(assignmentId, studentId)
      .then(setDrafts)
      .catch((e: Error) => notify(e.message));
  }, [assignmentId, studentId]);
  const result = selected?.result;
  async function publish() {
    if (!result) return;
    const next = pointsFor(result).map((v, i) => points[i] ?? v);
    try {
      await publishGrade(assignmentId, studentId, next, comment);
      setData((d) => ({
        ...d,
        notices: [...d.notices, "Điểm bài tập đã được giảng viên công bố."],
        readNotices: false,
      }));
      notify("Đã công bố điểm và phản hồi.");
      await load();
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <>
      <PageHeader
        title="Chấm bài & phản hồi"
        description={`${assignment?.title ?? "Bài tập"} · Duyệt điểm trước khi công bố.`}
      />
      <CourseContext />
      {!submissions.length ? (
        <Empty
          title="Chưa có bài nộp"
          description="Bài của sinh viên sẽ hiển thị tại đây sau khi nộp."
        />
      ) : (
        <div className="grading-layout">
          <aside>
            <Panel title={`Bài nộp · ${submissions.length}`}>
              {submissions.map((s) => (
                <button
                  key={s.studentId}
                  className={`submission-person ${s.studentId === studentId ? "selected" : ""}`}
                  onClick={() => setStudentId(s.studentId)}
                >
                  <span className="avatar small">
                    {s.studentName.split(" ").slice(-1)[0].slice(0, 2)}
                  </span>
                  <div>
                    <strong>{s.studentName}</strong>
                    <small>
                      {s.studentId} · {s.result?.score}/10
                    </small>
                  </div>
                  <Badge tone={s.result?.approved ? "green" : "amber"}>
                    {s.result?.approved ? "Đã duyệt" : "Chờ duyệt"}
                  </Badge>
                </button>
              ))}
            </Panel>
          </aside>
          {result && (
            <Panel>
              {questions.map((q, i) => {
                const draft = drafts.find((d) => d.questionIndex === i);
                return (
                  <div className="reply-block" key={i}>
                    <div className="panel-heading">
                      <h2>
                        Câu {i + 1} · {typeLabel[q.type]}
                      </h2>
                      <Badge>
                        {pointsFor(result)[i]}/{q.points} điểm
                      </Badge>
                    </div>
                    <h3>{q.text}</h3>
                    <div className="submission-answer">
                      {shownAnswer(q, result.answers[i])}
                    </div>
                    {q.type === "essay" && (
                      <>
                        {draft && (
                          <div className="ai-grading">
                            <Sparkles size={20} />
                            <div>
                              <strong>
                                {draft.mode === "ai"
                                  ? "Gợi ý chấm từ AI"
                                  : "Gợi ý chấm theo tiêu chí"}
                              </strong>
                              <p>{draft.feedback}</p>
                              <span>
                                Điểm đề xuất: {draft.points} / {draft.maxPoints}
                              </span>
                            </div>
                          </div>
                        )}
                        <Field label={`Điểm câu ${i + 1} (0–${q.points})`}>
                          <input
                            required
                            type="number"
                            step="0.1"
                            min={0}
                            max={q.points}
                            value={points[i] ?? draft?.points ?? pointsFor(result)[i]}
                            onChange={(e) =>
                              setPoints((v) => ({
                                ...v,
                                [i]: Number(e.target.value),
                              }))
                            }
                          />
                        </Field>
                      </>
                    )}
                  </div>
                );
              })}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void publish();
                }}
              >
                <Field label="Nhận xét cho sinh viên">
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </Field>
                <Button>
                  <CheckCircle2 size={17} />
                  Duyệt & công bố điểm
                </Button>
              </form>
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
