import { useState, useEffect, useRef } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
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
import {
  assessmentFor,
  beginAssessment,
  examOf,
  examTotal,
  isAnswerCorrect,
  pointsFor,
  shownAnswer,
  submitAssessment,
  typeLabel,
  updateAssessment,
} from "../data/assessment";
import type { Assignment } from "../data/fixtures";
import { explainMistake } from "../api/studyAi";
import type { MistakeExplanation } from "../api/studyAi";
import { useDemo } from "../data/DemoProvider";
export function BaiTap() {
  const { data, saveData, notify } = useDemo();
  const [starting, setStarting] = useState<string|null>(null);
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const items = data.assignments.filter((a) => a.published);
  async function start(a: Assignment) {
    if(starting) return;
    setStarting(a.id);
    try {if (!await saveData(d => beginAssessment(d,a.id))) return;} catch(e) {notify((e as Error).message);return;} finally {setStarting(null);}
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
                  </div>
                  <h2>{a.title}</h2>
                </div>
              </div>
              <div className="assignment-facts">
                <span>
                  <Clock3 size={16} />
                  {a.minutes} phút
                </span>
                <span>
                  <FileText size={16} />
                  {examOf(a).length} câu hỏi · {examTotal(examOf(a))} điểm
                </span>
                <span>
                  <RotateCcw size={16} />
                  {record.result ? "Đã nộp lượt tính điểm" : "1 lượt tính điểm"} · {record.practiceResults?.length??0} lượt luyện tập
                </span>
              </div>
              <div className="assignment-bottom">
                <small>
                  Đóng lúc {new Date(a.closes).toLocaleString("vi-VN")}
                </small>
                <div className="row-actions">
                {record.result && <Link className="button secondary" to={`/sinh-vien/ket-qua?bai=${a.id}`}>Xem kết quả<ArrowRight size={16}/></Link>}
                <Button disabled={Boolean(starting)||(!record.result&&(Date.now()<Date.parse(a.opens)||Date.now()>=Date.parse(a.closes)))||Boolean(record.result&&!a.answersReleased)} onClick={()=>start(a)}>
                  {starting===a.id?"Đang mở bài…":record.draft?"Tiếp tục làm bài":record.result?"Luyện tập lại · Không tính điểm":"Bắt đầu lượt tính điểm"}<ArrowRight size={16}/>
                </Button>
                {record.result&&!a.answersReleased&&<small>Chờ cả lớp nộp bài hoặc giảng viên công bố đáp án.</small>}

                </div>
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
export function LamBai() {
  const { data } = useDemo();
  const [params] = useSearchParams();
  const a = data.assignments.find((x) => x.id === params.get("bai"));
  if (!a) return <NoAssignment />;
  return <Exam key={a.id} a={a} />;
}
function NoAssignment() {
  return (
    <Empty
      title="Không tìm thấy bài tập"
      description="Bài tập không tồn tại hoặc tài khoản của bạn không có quyền truy cập."
      action={
        <Link className="button secondary" to="/sinh-vien/bai-tap">
          Về danh sách bài tập
        </Link>
      }
    />
  );
}
function Exam({ a }: { a: Assignment }) {
  const { data, setData, saveData, notify } = useDemo();
  const navigate = useNavigate();
  const questions = examOf(a);
  const practicing = Boolean(assessmentFor(data,a.id).result && a.answersReleased);
  const record = assessmentFor(data, a.id);
  const [answers, setAnswers] = useState<string[]>(
    record.draft?.answers.length
      ? record.draft.answers
      : questions.map(() => ""),
  );
  const deadline = record.draft?.deadline || 0;
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
  );
  const submitted = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const submitRef = useRef(() => {});
  submitRef.current = async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    try {
      if (!await saveData((d) => submitAssessment(d, a.id, answers))) {
        submitted.current = false;
        return;
      }
    } catch (e) {
      submitted.current = false;
      notify((e as Error).message);
      return;
    } finally {
      setSubmitting(false);
    }
    notify(practicing?"Đã lưu kết quả luyện tập. Điểm lượt đầu không thay đổi.":"Đã nộp lượt tính điểm.");
    navigate("/sinh-vien/ket-qua?bai=" + a.id + (practicing?"&mode=practice":""));
  };
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) submitRef.current();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadline]);
  function answer(index: number, value: string) {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    if (record.draft)
      setData((d) =>
        updateAssessment(d, a.id, {
          draft: record.draft ? { ...record.draft, answers: next } : null,
        }),
      );
  }
  if (record.result && !record.draft && !submitting)
    return <Navigate to={"/sinh-vien/ket-qua?bai=" + a.id + (practicing?"&mode=practice":"")} replace />;
  if (!record.draft && !submitting)
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
        title={a.title}
        description={practicing?"Luyện tập sau công bố đáp án · Không thay đổi điểm chính thức.":"Lượt đầu tính điểm · Đáp án được lưu tự động."}
        action={
          <span className={`quiz-timer ${remaining < 60 ? "urgent" : ""}`}>
            <Clock3 size={19} />
            {String(Math.floor(remaining / 60)).padStart(2, "0")}:
            {String(remaining % 60).padStart(2, "0")}
          </span>
        }
      />
      <CourseContext />
      <div className="quiz-layout">
        <form
          className="quiz-questions"
          onSubmit={(e) => {
            e.preventDefault();
            submitRef.current();
          }}
          onPaste={(e) => {
            if (a.preventPaste) {
              e.preventDefault();
              notify("Bài tập này không cho phép dán nội dung.");
            }
          }}
        >
          {questions.map((q, i) => (
            <Panel key={i}>
              <div className="question-number">
                <Badge>
                  Câu {i + 1} · {typeLabel[q.type]}
                </Badge>
                <span>{q.points} điểm</span>
              </div>
              <h2>{q.text}</h2>
              {q.type === "choice" && (
                <div className="answer-options">
                  {q.options?.map((v, j) => (
                    <label
                      key={j}
                      className={answers[i] === String(j) ? "chosen" : ""}
                    >
                      <input
                        disabled={submitting}
                        type="radio"
                        name={`quiz-${i}`}
                        checked={answers[i] === String(j)}
                        onChange={() => answer(i, String(j))}
                      />
                      <span>{String.fromCharCode(65 + j)}</span>
                      {v}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "blank" && (
                <Field label="Đáp án của bạn">
                  <input
                    disabled={submitting}
                    placeholder="Nhập đáp án…"
                    value={answers[i] ?? ""}
                    onChange={(e) => answer(i, e.target.value)}
                  />
                </Field>
              )}
              {q.type === "essay" && (
                <Field label="Bài làm">
                  <textarea
                    disabled={submitting}
                    rows={6}
                    maxLength={5000}
                    value={answers[i] ?? ""}
                    onChange={(e) => answer(i, e.target.value)}
                    placeholder="Trình bày phương án của bạn…"
                  />
                </Field>
              )}
            </Panel>
          ))}
          <Button type="submit" disabled={submitting} aria-busy={submitting}>
            <CheckCircle2 size={18} />
            {submitting ? "Đang nộp bài…" : "Nộp bài"}
          </Button>
        </form>
        <aside>
          <Panel title="Tiến độ làm bài">
            <div className="question-grid">
              {questions.map((_, i) => (
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
                  className={answers[i] ? "filled" : ""}
                >
                  {i + 1}
                </a>
              ))}
            </div>
            <p>
              {answers.filter(Boolean).length}/{questions.length} câu đã trả lời
            </p>
            <hr />
            <p className="muted">
              Hết giờ bài sẽ tự nộp. Câu chưa trả lời được tính 0 điểm.
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
export function KetQua() {
  const { data } = useDemo();
  const [params] = useSearchParams();
  const assignment = data.assignments.find((a) => a.id === params.get("bai"));
  if (!assignment) return <NoAssignment />;
  return <Result key={assignment.id} assignment={assignment} />;
}
function Result({ assignment }: { assignment: Assignment }) {
  const { data, setData, notify } = useDemo();
  const assignmentId = assignment.id;
  const questions = examOf(assignment);
  const [appeal, setAppeal] = useState<number | null>(null),
    [reason, setReason] = useState(""),
    [mistakes, setMistakes] = useState<Record<number, MistakeExplanation>>({}),
    [explaining, setExplaining] = useState<number | null>(null);
  async function explain(index: number) {
    setExplaining(index);
    try {
      const reply = await explainMistake(assignmentId, index);
      setMistakes((m) => ({ ...m, [index]: reply }));
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setExplaining(null);
    }
  }
  const [params,setParams]=useSearchParams();
  const record=assessmentFor(data,assignmentId);
  const practice=record.practiceResults??[];
  const practiceMode=params.get("mode")==="practice";
  const practiceIndex=Number(params.get("lan")??practice.length-1);
  const r=practiceMode?practice[practiceIndex]??null:record.result;

  const graded = questions
    .map((q, i) => isAnswerCorrect(q, r?.answers[i]))
    .filter((v) => v !== null);
  const correct = graded.filter(Boolean).length;
  const appealsOf = (index: number) =>
    data.appeals.filter(
      (a) => a.assignmentId === assignmentId && a.questionIndex === index,
    );
  return (
    <>
      <PageHeader
        title="Kết quả bài tập"
        description={assignment.title}
        action={
          <Link className="button secondary" to="/sinh-vien/bai-tap">
            Danh sách bài tập
          </Link>
        }
      />
      <div className="toolbar"><div className="tabs">
        <button className={!practiceMode?"selected":""} onClick={()=>setParams({bai:assignmentId})}>Lượt đầu · Tính điểm</button>
        <button disabled={!practice.length} className={practiceMode?"selected":""} onClick={()=>setParams({bai:assignmentId,mode:"practice"})}>Luyện tập ({practice.length})</button>
      </div>{practiceMode&&<select aria-label="Lượt luyện tập" value={practiceIndex} onChange={e=>setParams({bai:assignmentId,mode:"practice",lan:e.target.value})}>{practice.map((p,i)=><option key={i} value={i}>Lượt luyện tập {i+1} · {p.submitted}</option>)}</select>}</div>
      {!assignment.answersReleased&&record.result&&<Panel title="Chờ công bố đáp án"><p>Cả lớp cần nộp lượt tính điểm, hoặc giảng viên chủ động công bố. Bạn chưa thể xem đáp án hoặc làm lại.</p></Panel>}
      {practiceMode&&<p className="info-line">Kết quả luyện tập không dùng tính điểm. Điểm lượt đầu: {record.result?.score??0}/10. Tự luận luyện tập dùng để tự đối chiếu, không gửi vào hàng chấm chính thức.</p>}
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
              <span>/{examTotal(questions)}</span>
            </div>
            <div>
              <Badge tone="green">{practiceMode?"Luyện tập · Không tính điểm":"Lượt đầu · Tính điểm"}</Badge>
              <h2>Bạn đã hoàn thành bài tập</h2>
              <p>
                Nộp lúc {r.submitted} · {questions.length} câu
                {graded.length > 0 &&
                  ` · Tỷ lệ đúng ${Math.round((correct / graded.length) * 100)}% (${correct}/${graded.length} câu tự chấm)`}
              </p>
              <p className="muted">
                {practiceMode ? "Điểm tự động của phần trắc nghiệm/điền trống; tự luận tự đối chiếu học liệu." : r.approved
                  ? "Điểm đã được giảng viên duyệt và công bố."
                  : "Điểm tạm tính. Tự luận chờ AI hoặc giảng viên chấm."}
              </p>
            </div>
          </Panel>
          {questions.map((q, i) => {
            const verdict = isAnswerCorrect(q, r.answers[i]);
            const decided = appealsOf(i).find((a) => a.status !== "pending");
            return (
              <Panel key={i}>
                <div className="panel-heading">
                  <h2>
                    Câu {i + 1} · {typeLabel[q.type]}
                  </h2>
                  <span>
                    {assignment.answersReleased?`Điểm: ${pointsFor(r)[i] ?? 0}/${q.points}`:"Điểm từng câu: Chờ công bố đáp án"}
                  </span>
                  <Badge
                    tone={
                      verdict === null ? "amber" : verdict ? "green" : "red"
                    }
                  >
                    {!assignment.answersReleased ? "Chờ công bố đáp án" : verdict === null
                      ? practiceMode ? "Tự đối chiếu học liệu" : r.approved
                        ? "Đã duyệt"
                        : "Chờ duyệt"
                      : verdict
                        ? "Đúng"
                        : "Sai"}
                  </Badge>
                </div>
                <p>{q.text}</p>
                <p>
                  <strong>Bài làm:</strong> {shownAnswer(q, r.answers[i])}
                </p>
                {q.type !== "essay" && q.correct !== undefined && (
                  <p>
                    <strong>Đáp án đúng:</strong>{" "}
                    {shownAnswer(q, q.correct.split("|")[0])}
                  </p>
                )}
                {q.explanation && <p className="muted">💡 {q.explanation}</p>}
                {r.aiFeedback?.[i] && (
                  <div className="reply-block">
                    <strong>📝 Phản hồi từ AI</strong>
                    <p>{r.aiFeedback[i]}</p>
                  </div>
                )}
                {!practiceMode && verdict === false &&
                  (mistakes[i] ? (
                    <div className="reply-block" role="status">
                      <strong>
                        {mistakes[i].mode === "ai"
                          ? "AI giải thích lỗi sai"
                          : "Đối chiếu học liệu"}
                      </strong>
                      {mistakes[i].answer.split("\n\n").map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                      {mistakes[i].pages.map((page) => (
                        <Link
                          key={page}
                          className="source-chip"
                          to={`/sinh-vien/hoc/cs301?trang=${page}`}
                        >
                          Xem nguồn · Trang {page}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Button
                      variant="secondary small"
                      disabled={explaining === i}
                      onClick={() => explain(i)}
                    >
                      {explaining === i ? "Đang giải thích…" : "AI giải thích lỗi sai"}
                    </Button>
                  ))}
                {!practiceMode && decided && (
                  <p>
                    <Badge tone="green">
                      {decided.status === "accepted"
                        ? "Đã chấm lại"
                        : "Giữ nguyên điểm"}
                    </Badge>{" "}
                    {decided.response}
                  </p>
                )}
                {!practiceMode&&assignment.answersReleased&&<Button
                  variant="secondary small"
                  disabled={appealsOf(i).some((a) => a.status === "pending")}
                  onClick={() => setAppeal(i)}
                >
                  Yêu cầu phúc khảo
                </Button>}
              </Panel>
            );
          })}
          {r.comment && (
            <Panel title="Nhận xét giảng viên">
              <p>{r.comment}</p>
            </Panel>
          )}
        </>
      )}
      {appeal !== null && (
        <Dialog title="Yêu cầu phúc khảo" onClose={() => setAppeal(null)}>
          <p>
            <strong>Câu {appeal + 1}:</strong> {questions[appeal].text}
          </p>
          <p>Bài làm: {shownAnswer(questions[appeal], r?.answers[appeal])}</p>
          <p>
            Điểm hiện tại: {r ? pointsFor(r)[appeal] : 0}/
            {questions[appeal].points}
          </p>
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
                    question: `Câu ${appeal + 1} · ${questions[appeal].text}`,
                    questionIndex: appeal,
                    answer: shownAnswer(questions[appeal], r?.answers[appeal]),
                    previousPoints: r ? pointsFor(r)[appeal] : 0,
                    maxPoints: questions[appeal].points,
                    reason: reason.trim(),
                    response: "",
                    status: "pending",
                  },
                ],
                teacherNotices: [
                  ...d.teacherNotices,
                  "Có yêu cầu phúc khảo mới đang chờ xử lý.",
                ],
                readTeacherNotices: false,
              }));
              setAppeal(null);
              setReason("");
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
