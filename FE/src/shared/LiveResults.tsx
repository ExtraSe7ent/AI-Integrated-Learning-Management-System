import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useDemo } from "../data/DemoProvider";
import { Badge, Empty, Field, Panel } from "./UI";

export interface LiveStudentAnswer {
  studentId: string;
  name: string;
  /** -1: time ran out without an answer. */
  answer: number;
  correct: boolean;
}
export interface LiveResult {
  id: string;
  runId: string;
  classId?: string;
  questionId: string;
  questionText: string;
  options: string[];
  correct?: number;
  askedAt: number;
  participants: number;
  answered: number;
  correctCount: number;
  distribution: number[];
  students: LiveStudentAnswer[];
}

export const liveResults = (classId?: string) =>
  api<LiveResult[]>(`/api/live/results${classId ? `?classId=${encodeURIComponent(classId)}` : ""}`);

const letter = (i: number) => String.fromCharCode(65 + i);
const when = (ms: number) =>
  new Date(ms).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

/**
 * UC-C03 for the lecturer: every question shown in class, grouped by session, with each student's answer.
 * The server keeps them, so they are still here after "Đổi câu hỏi" or "Kết thúc phiên".
 */
export function LiveResults({ classIds }: { classIds: string[] }) {
  const { data } = useDemo();
  const live = data.live;
  const [classId, setClassId] = useState(""),
    [rows, setRows] = useState<LiveResult[]>([]),
    [open, setOpen] = useState<string>(),
    [error, setError] = useState("");
  const className = (id?: string) => data.admin.classes.find((c) => c.id === id)?.name ?? id ?? "Không rõ lớp";
  useEffect(() => {
    let active = true;
    liveResults(classId || undefined).then(
      (list) => {
        if (!active) return;
        setRows(list);
        setError("");
      },
      (e) => active && setError((e as Error).message),
    );
    return () => {
      active = false;
    };
    // Refresh whenever the projected question changes state.
  }, [classId, live.active, live.question, live.revealed, live.answered, live.participants?.length]);
  const runs = [...new Set(rows.map((r) => r.runId))].map((runId) => {
    const items = rows.filter((r) => r.runId === runId).sort((a, b) => a.askedAt - b.askedAt);
    return { runId, items, classId: items[0]?.classId, startedAt: items[0]?.askedAt ?? 0 };
  });
  return (
    <Panel
      title="Kết quả các phiên hỏi trên lớp"
      action={
        classIds.length > 1 ? (
          <Field label="Lớp">
            <select aria-label="Lọc kết quả theo lớp" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Tất cả lớp</option>
              {classIds.map((id) => (
                <option key={id} value={id}>
                  {className(id)}
                </option>
              ))}
            </select>
          </Field>
        ) : undefined
      }
    >
      {error && <p className="field-error">{error}</p>}
      {!runs.length && !error && (
        <Empty
          title="Chưa có kết quả"
          description="Kết quả được lưu lại khi có sinh viên tham gia một câu hỏi bạn chiếu trên lớp."
        />
      )}
      {runs.map((run) => (
        <div className="live-result-run" key={run.runId}>
          <h3>
            {className(run.classId)} · Phiên lúc {when(run.startedAt)} · {run.items.length} câu hỏi
          </h3>
          {run.items.map((r) => {
            const rate = r.participants ? Math.round((r.correctCount / r.participants) * 100) : 0;
            const shown = open === r.id;
            return (
              <div className="live-result" key={r.id}>
                <div className="live-result-head">
                  <strong>{r.questionText}</strong>
                  <Badge tone={rate >= 70 ? "green" : rate >= 40 ? "amber" : "red"}>
                    Đúng {r.correctCount}/{r.participants} · {rate}%
                  </Badge>
                </div>
                <p className="muted">
                  Đáp án đúng: {r.correct !== undefined && r.correct !== null ? `${letter(r.correct)}. ${r.options[r.correct]}` : "—"}
                  {" · "}
                  {r.answered}/{r.participants} sinh viên đã trả lời
                </p>
                {r.options.map((option, i) => (
                  <div className="poll-result" key={i}>
                    <b>{letter(i)}</b>
                    <progress max={Math.max(r.participants, 1)} value={r.distribution[i] ?? 0} />
                    <span>
                      {r.distribution[i] ?? 0} · {option}
                    </span>
                  </div>
                ))}
                <button className="text-link" onClick={() => setOpen(shown ? undefined : r.id)}>
                  {shown ? "Ẩn danh sách sinh viên" : `Xem từng sinh viên (${r.students.length})`}
                </button>
                {shown && (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Sinh viên</th>
                          <th>Mã</th>
                          <th>Đã chọn</th>
                          <th>Kết quả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.students.map((s) => (
                          <tr key={s.studentId}>
                            <td>{s.name}</td>
                            <td>{s.studentId}</td>
                            <td>{s.answer >= 0 ? `${letter(s.answer)}. ${r.options[s.answer] ?? ""}` : "—"}</td>
                            <td>
                              {s.answer < 0 ? (
                                <Badge tone="neutral">Không trả lời</Badge>
                              ) : s.correct ? (
                                <Badge tone="green">Đúng</Badge>
                              ) : (
                                <Badge tone="red">Sai</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </Panel>
  );
}
