import { useDemo } from "../data/DemoProvider";
import { useScope } from "../shared/useScope";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Panel, Field, Button, Badge } from "../shared/UI";
import { createPractice } from "../api/learning";
import type { GeneratedQuestion } from "../api/learning";

const sameAnswer = (a = "", b: string) =>
  a.trim().toUpperCase() === b.trim().toUpperCase();

export function AIPractice() {
  const { notify } = useDemo();
  const { courses } = useScope();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? ""),
    [fromPage, setFromPage] = useState(""),
    [toPage, setToPage] = useState(""),
    [round, setRound] = useState(0),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [checked, setChecked] = useState<string[]>([]),
    [questions, setQuestions] = useState<GeneratedQuestion[]>([]),
    [mode, setMode] = useState(""),
    [busy, setBusy] = useState(false);
  const done = questions.length > 0 && questions.every((q) => checked.includes(q.id));
  async function create() {
    setBusy(true);
    try {
      const next = await createPractice({
        courseId,
        fromPage: fromPage ? Number(fromPage) : undefined,
        toPage: toPage ? Number(toPage) : undefined,
        round,
      });
      setQuestions(next.questions);
      setMode(next.mode);
      setRound((v) => v + 1);
      setAnswers({});
      setChecked([]);
    } catch (e) {
      setQuestions([]);
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Luyện tập từ học liệu"
        description="Tự kiểm tra kiến thức · Không tính điểm · Không giới hạn số lần."
        action={<Badge tone="green">Không tính điểm</Badge>}
      />
      <Panel title="Chọn phạm vi">
        <div className="admin-form">
          <Field label="Học phần">
            <select
              aria-label="Học phần"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="form-grid">
            <Field label="Từ trang (để trống là toàn bài)">
              <input
                type="number"
                min={1}
                value={fromPage}
                onChange={(e) => setFromPage(e.target.value)}
              />
            </Field>
            <Field label="Đến trang">
              <input
                type="number"
                min={1}
                value={toPage}
                onChange={(e) => setToPage(e.target.value)}
              />
            </Field>
          </div>
          <Button disabled={busy} onClick={create}>
            {questions.length ? "Tạo bộ mới" : "Tạo câu hỏi luyện tập"}
          </Button>
        </div>
      </Panel>
      {questions.map((q, i) => {
        const isChecked = checked.includes(q.id),
          correct = sameAnswer(answers[q.id], q.answer);
        return (
          <Panel
            key={q.id}
            title={`Câu ${i + 1} · ${q.type === "choice" ? "Trắc nghiệm" : "Điền trống"}`}
            className="ai-practice-question"
          >
            <h3>{q.title}</h3>
            {q.type === "choice" ? (
              <div className="answer-options">
                {q.options?.map((option) => (
                  <label
                    key={option}
                    className={answers[q.id] === option ? "chosen" : ""}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      disabled={isChecked}
                      checked={answers[q.id] === option}
                      onChange={() =>
                        setAnswers((v) => ({ ...v, [q.id]: option }))
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : (
              <Field label={`Đáp án câu ${i + 1}`}>
                <input
                  value={answers[q.id] || ""}
                  disabled={isChecked}
                  onChange={(e) =>
                    setAnswers((v) => ({ ...v, [q.id]: e.target.value }))
                  }
                />
              </Field>
            )}
            {!isChecked ? (
              <Button
                variant="secondary"
                disabled={!answers[q.id]?.trim()}
                onClick={() => setChecked((v) => [...v, q.id])}
              >
                Kiểm tra câu {i + 1}
              </Button>
            ) : (
              <div role="status">
                <strong className={correct ? "green-text" : "error-text"}>
                  {correct ? "Đúng." : "Chưa đúng."} Đáp án: {q.answer}.
                </strong>
                <p>{q.explanation}</p>
                <Link
                  className="source-chip"
                  to={`/sinh-vien/hoc/${courseId}?trang=${q.page}`}
                >
                  Xem nguồn · Trang {q.page}
                </Link>
              </div>
            )}
          </Panel>
        );
      })}
      {done && (
        <Panel title="Kết quả luyện tập">
          <p>
            {questions.filter((q) => sameAnswer(answers[q.id], q.answer)).length}/
            {questions.length} câu đúng. Kết quả này không ghi vào bảng điểm.
          </p>
          <Button disabled={busy} onClick={create}>
            Tạo bộ mới
          </Button>
        </Panel>
      )}
      {mode && (
        <p className="ai-safety-note">
          {mode === "ai"
            ? "Câu hỏi do AI sinh từ học liệu của học phần; hãy đối chiếu với tài liệu gốc."
            : "Chưa có dịch vụ AI: bộ câu hỏi được lấy từ ngân hàng câu hỏi đã duyệt."}
        </p>
      )}
    </>
  );
}
