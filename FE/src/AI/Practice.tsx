import { useDemo } from "../data/DemoProvider";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Panel, Field, Button, Badge } from "../shared/UI";
import { practiceSet, materialSourceAvailable } from "./model";
export function AIPractice() {
  const { data } = useDemo();
  const available = materialSourceAvailable(data);
  const [scope, setScope] = useState("all"),
    [round, setRound] = useState(0),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [checked, setChecked] = useState<string[]>([]),
    [generated, setGenerated] = useState(false);
  const qs = practiceSet(scope, round),
    done = generated && qs.every((q) => checked.includes(q.id));
  const create = () => {
    setRound((v) => v + 1);
    setAnswers({});
    setChecked([]);
    setGenerated(true);
  };
  return (
    <>
      <PageHeader
        title="Luyện tập từ học liệu"
        description="Tự kiểm tra kiến thức · Không tính điểm · Không giới hạn số lần."
        action={<Badge tone="green">Không tính điểm</Badge>}
      />
      <Panel title="Chọn phạm vi">
        <div className="admin-form">
          <Field label="Phạm vi luyện tập">
            <select
              aria-label="Phạm vi luyện tập"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setGenerated(false);
                setChecked([]);
                setAnswers({});
              }}
            >
              <option value="all">Toàn bộ bài học RESTful API</option>
              <option value="http">Trang 2–3 · HTTP methods</option>
            </select>
          </Field>
          <Button disabled={!available} onClick={create}>
            {generated ? "Tạo bộ mới" : "Tạo bộ luyện tập"}
          </Button>
        </div>
      </Panel>
      {!available && (
        <Panel title="Học liệu đã thay đổi">
          <p>
            Ngân hàng luyện tập hiện chưa được cập nhật theo nội dung mới. Chờ
            giảng viên cập nhật học liệu rồi thử lại.
          </p>
        </Panel>
      )}
      {available &&
        generated &&
        qs.map((q, i) => {
          const isChecked = checked.includes(q.id),
            correct =
              answers[q.id]?.trim().toUpperCase() === q.answer.toUpperCase();
          return (
            <Panel
              key={q.id}
              title={`Câu ${i + 1} · ${q.type === "choice" ? "Trắc nghiệm" : "Điền trống"}`}
              className="ai-practice-question"
            >
              <h3>{q.title}</h3>
              {q.type === "choice" ? (
                <div className="answer-options">
                  {q.options!.map((option) => (
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
                    to={`/sinh-vien/hoc/cs301?phien=s1&trang=${q.page}`}
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
            {
              qs.filter(
                (q) =>
                  answers[q.id]?.trim().toUpperCase() ===
                  q.answer.toUpperCase(),
              ).length
            }
            /{qs.length} câu đúng. Kết quả này không ghi vào bảng điểm.
          </p>
          <Button disabled={!available} onClick={create}>
            Tạo bộ mới
          </Button>
        </Panel>
      )}
      <p className="ai-safety-note">
        Bộ luyện tập hiện lấy từ ngân hàng theo học liệu. Dịch vụ sinh câu hỏi
        AI sẽ được nối ở backend.
      </p>
    </>
  );
}
