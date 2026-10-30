import { useState } from "react";
import {
  Plus,
  Sparkles,
  Upload,
  Download,
  Pencil,
  Trash2,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import type { Question } from "../data/fixtures";
import {
  PageHeader,
  Panel,
  Button,
  Badge,
  Field,
  Dialog,
  SearchField,
} from "../shared/UI";
import { CourseContext } from "../shared/CourseComponents";
import { exportWorkbook } from "../shared/Grades";
export function CauHoi() {
  const { data, setData, notify } = useDemo();
  const [query, setQuery] = useState(""),
    [edit, setEdit] = useState<Question | null>(null);
  function create() {
    setEdit({
      id: "new",
      text: "",
      options: ["", "", "", ""],
      correct: 0,
      explanation: "",
      page: 1,
      approved: true,
    });
  }
  async function exportQuestions() {
    try {
      await exportWorkbook(
        "Cau-hoi",
        ["Câu hỏi", "A", "B", "C", "D", "Đáp án (0–3)", "Trang", "Giải thích"],
        data.questions.map((q) => [
          q.text,
          ...q.options,
          q.correct,
          q.page,
          q.explanation,
        ]),
      );
    } catch {
      notify("Không thể xuất tệp. Hãy thử lại.");
    }
  }
  async function importFile(file: File) {
    try {
      if (file.size > 5 * 1024 * 1024) {
        notify("Tệp import tối đa 5 MB.");
        return;
      }
      let rows: unknown[][] = [];
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        rows = text
          .trim()
          .split(/\r?\n/)
          .map((line) =>
            (line.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g) || [])
              .filter((x) => x !== "")
              .map((x) =>
                x.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'),
              ),
          );
      } else {
        const Excel = await import("exceljs");
        const w = new Excel.Workbook();
        await w.xlsx.load(await file.arrayBuffer());
        w.worksheets[0]?.eachRow((r) => {
          rows.push((r.values as unknown[]).slice(1));
        });
      }
      const imported = rows
        .slice(1)
        .filter((r) => r[0])
        .map((r): Question => ({
          id: crypto.randomUUID(),
          text: String(r[0]),
          options: r.slice(1, 5).map(String),
          correct: Number(r[5]),
          page: Number(r[6]),
          explanation: String(r[7] || ""),
          approved: false,
        }));
      if (
        !imported.length ||
        imported.some(
          (q) =>
            q.options.length !== 4 ||
            q.options.some((o) => !o) ||
            !Number.isInteger(q.correct) ||
            q.correct < 0 ||
            q.correct > 3 ||
            !Number.isInteger(q.page) ||
            q.page < 1 ||
            q.page > 4,
        )
      )
        throw Error("format");
      setData((d) => ({ ...d, questions: [...d.questions, ...imported] }));
      notify(
        `Đã nhập ${imported.length} câu hỏi. Cần rà soát và duyệt trước khi công bố.`,
      );
    } catch {
      notify(
        "Không đọc được tệp. Dùng cấu trúc từ file Xuất Excel: câu hỏi, A–D, đáp án 0–3, trang, giải thích.",
      );
    }
  }
  const items = data.questions.filter((q) =>
    q.text.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Ngân hàng câu hỏi"
        description="Soạn câu hỏi theo trang, dùng lại cho tự học và hỏi trên lớp."
        action={
          <div className="row-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setData((d) => ({
                  ...d,
                  questions: [
                    ...d.questions,
                    {
                      id: crypto.randomUUID(),
                      text: "Khi cập nhật một phần tài nguyên, HTTP method nào phù hợp?",
                      options: ["GET", "PATCH", "HEAD", "OPTIONS"],
                      correct: 1,
                      explanation:
                        "PATCH cập nhật một phần biểu diễn tài nguyên.",
                      page: 4,
                      approved: false,
                    },
                  ],
                }));
                notify(
                  "Đã thêm câu gợi ý mẫu. Hãy rà soát trước khi duyệt; chưa gọi AI thật.",
                );
              }}
            >
              <Sparkles size={17} />
              AI gợi ý mẫu
            </Button>
            <Button onClick={create}>
              <Plus size={17} />
              Thêm câu hỏi
            </Button>
          </div>
        }
      />
      <CourseContext />
      <div className="toolbar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Tìm nội dung câu hỏi…"
        />
        <div className="row-actions">
          <label className="button secondary small">
            <Upload size={16} />
            Import Excel/CSV
            <input
              className="visually-hidden"
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(f);
                e.target.value = "";
              }}
            />
          </label>
          <Button variant="secondary small" onClick={exportQuestions}>
            <Download size={16} />
            Xuất Excel
          </Button>
        </div>
      </div>
      {items.map((q, i) => (
        <Panel key={q.id} className="question-bank-item">
          <div className="panel-heading">
            <div className="inline-meta">
              <Badge>Trang {q.page}</Badge>
              <Badge tone={q.approved ? "green" : "amber"}>
                {q.approved ? "Đã duyệt" : "Chờ giảng viên duyệt"}
              </Badge>
            </div>
            <div className="row-actions">
              <button
                className="icon-button"
                aria-label={`Sửa câu hỏi ${i + 1}`}
                onClick={() => setEdit(q)}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-button danger"
                aria-label={`Xóa câu hỏi ${i + 1}`}
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    questions: d.questions.filter((x) => x.id !== q.id),
                  }))
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <h2>
            {i + 1}. {q.text}
          </h2>
          <div className="question-options-grid">
            {q.options.map((o, j) => (
              <div className={j === q.correct ? "correct-option" : ""} key={j}>
                <b>{String.fromCharCode(65 + j)}</b>
                {o}
                {j === q.correct && <Check size={15} />}
              </div>
            ))}
          </div>
          <p className="muted">Giải thích: {q.explanation}</p>
          {!q.approved && (
            <Button
              variant="secondary small"
              onClick={() =>
                setData((d) => ({
                  ...d,
                  questions: d.questions.map((x) =>
                    x.id === q.id ? { ...x, approved: true } : x,
                  ),
                }))
              }
            >
              <Check size={16} />
              Đã rà soát · Duyệt câu hỏi
            </Button>
          )}
        </Panel>
      ))}
      {!items.length && (
        <Panel>
          <FileSpreadsheet size={28} />
          <p>Chưa có câu hỏi phù hợp. Thêm câu hỏi hoặc xóa bộ lọc.</p>
        </Panel>
      )}
      {edit && (
        <Dialog title="Soạn câu hỏi" onClose={() => setEdit(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setData((d) => ({
                ...d,
                questions:
                  edit.id === "new"
                    ? [...d.questions, { ...edit, id: crypto.randomUUID() }]
                    : d.questions.map((q) => (q.id === edit.id ? edit : q)),
              }));
              setEdit(null);
            }}
          >
            <Field label="Câu hỏi">
              <textarea
                required
                rows={3}
                value={edit.text}
                onChange={(e) => setEdit({ ...edit, text: e.target.value })}
              />
            </Field>
            <div className="form-grid">
              {edit.options.map((o, i) => (
                <Field label={`Đáp án ${String.fromCharCode(65 + i)}`} key={i}>
                  <input
                    required
                    value={o}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        options: edit.options.map((x, j) =>
                          j === i ? e.target.value : x,
                        ),
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            <div className="form-grid">
              <Field label="Đáp án đúng">
                <select
                  value={edit.correct}
                  onChange={(e) =>
                    setEdit({ ...edit, correct: Number(e.target.value) })
                  }
                >
                  {edit.options.map((_, i) => (
                    <option key={i} value={i}>
                      {String.fromCharCode(65 + i)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Trang bài học">
                <input
                  type="number"
                  min={1}
                  max={4}
                  required
                  value={edit.page}
                  onChange={(e) =>
                    setEdit({ ...edit, page: Number(e.target.value) })
                  }
                />
              </Field>
            </div>
            <Field label="Giải thích">
              <textarea
                required
                rows={2}
                value={edit.explanation}
                onChange={(e) =>
                  setEdit({ ...edit, explanation: e.target.value })
                }
              />
            </Field>
            <Button>Lưu câu hỏi</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
