import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import {
  Radio,
  ArrowRight,
  Clock3,
  Users,
  CheckCircle2,
  Maximize2,
  Play,
  SkipForward,
  BarChart3,
  WifiOff,
  Square,
} from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import { useAccount } from "./AccountProvider";
import { useScope } from "./useScope";
import { questionsOf } from "../data/content";
import { answerLive, joinLive, revealLive, showQuestion, startLive, stopLive } from "../api/live";
import type { LiveState } from "../api/live";
import { PageHeader, Panel, Button, Badge, Field, Journey } from "./UI";
import { CourseContext } from "./CourseComponents";
import { LiveResults } from "./LiveResults";

const SECONDS = 45;

/** UC-C01–C03. The server owns the code, the timer, who may join and every answer; this screen only shows them. */
export function LopTrucTiep({ teacher = false }: { teacher?: boolean }) {
  const { data, setData, notify } = useDemo();
  const { account } = useAccount();
  const { classes, lessons } = useScope();
  const [params] = useSearchParams();
  const live = data.live;
  const me = account?.id ?? "";
  const [code, setCode] = useState(params.get("code") || ""),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<number>(),
    [qr, setQr] = useState(""),
    [now, setNow] = useState(Date.now()),
    [busy, setBusy] = useState(false),
    [offline, setOffline] = useState(!navigator.onLine),
    [classId, setClassId] = useState(live.classId || classes[0]?.id || ""),
    [questionId, setQuestionId] = useState("");
  // Approved questions of the lessons of the chosen class (UC-C01 "chọn câu hỏi từ danh sách đã tạo").
  const lessonIds = lessons.filter((l) => (l.classId || "CSE301.01") === classId).map((l) => l.id);
  const bank = lessonIds.flatMap((id) => questionsOf(data.questions, id)).filter((q) => q.approved);
  const nextQuestion = questionId || bank.find((q) => q.id !== live.questionId)?.id || bank[0]?.id || "";
  const q = live.current;
  const left = Math.max(0, Math.ceil((live.expiresAt - now) / 1000));
  const own = live.answers[me];
  const joined = (live.participants || []).includes(me);
  const answered = live.answered ?? 0;
  const className = (id?: string) => data.admin.classes.find((c) => c.id === id)?.name ?? id ?? "";

  useEffect(() => setSelected(undefined), [live.question, live.expiresAt]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const online = () => setOffline(!navigator.onLine);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  useEffect(() => {
    if (!teacher || !live.code) return;
    let active = true;
    void QRCode.toDataURL(`${location.origin}/sinh-vien/tren-lop?code=${live.code}`, {
      margin: 1,
      width: 150,
      color: { dark: "#87252c" },
    }).then((url) => {
      if (active) setQr(url);
    });
    return () => {
      active = false;
    };
  }, [live.code, teacher]);

  /** Server replies replace the local copy; the 2-second poll in DemoProvider keeps every device in step. */
  async function run(action: () => Promise<LiveState>) {
    setBusy(true);
    try {
      const next = await action();
      setData((d) => ({ ...d, live: next }));
      setError("");
      return true;
    } catch (e) {
      const message = (e as Error).message;
      if (teacher) notify(message);
      else setError(message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={teacher ? "Hỏi trên lớp" : "Lớp học trực tiếp"}
        description={
          teacher
            ? "Đưa câu hỏi lên màn chiếu và lắng nghe cả lớp."
            : "Tham gia câu hỏi cùng lớp học của bạn."
        }
      />
      <CourseContext />
      <Journey active={1} />
      {offline && (
        <div className="info-line" role="status">
          <WifiOff size={17} />
          Bạn đang ngoại tuyến. Kết nối lại trước khi hết giờ vẫn trả lời được.
        </div>
      )}
      {!teacher && !joined ? (
        <div className="join-layout">
          <Panel>
            <span className="join-symbol">
              <Radio size={30} />
            </span>
            <h2>Sẵn sàng cùng lớp tương tác?</h2>
            <p>Nhập mã phiên giảng viên đang chia sẻ trên màn hình.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => joinLive(code));
              }}
            >
              <Field label="Mã phiên gồm 6 chữ số">
                <input
                  className="session-code-input"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                />
              </Field>
              {error && (
                <p role="alert" className="error-text">
                  {error}
                </p>
              )}
              <Button disabled={busy}>
                Tham gia phiên
                <ArrowRight size={17} />
              </Button>
            </form>
          </Panel>
          <div className="join-info">
            <img src="/brand/vju-seal.jpeg" alt="VJU" />
            <h3>
              Kiến thức được kết nối
              <br />
              qua từng câu hỏi.
            </h3>
            <p>Chọn câu trả lời của bạn. Cả lớp cùng nhìn lại kết quả sau mỗi lượt.</p>
          </div>
        </div>
      ) : (
        <div className="live-layout">
          <section className="live-board">
            <div className="live-board-top">
              <Badge tone={live.active ? "green" : "neutral"}>
                {live.active ? "Phiên đang mở" : "Chưa bắt đầu"}
              </Badge>
              <span>
                <Clock3 size={18} />
                {live.active ? left : 0}s
              </span>
              {teacher && (
                <button
                  className="icon-button"
                  aria-label="Toàn màn hình câu hỏi"
                  onClick={() => document.querySelector(".live-board")?.requestFullscreen()}
                >
                  <Maximize2 size={18} />
                </button>
              )}
            </div>
            <span className="muted">
              Câu {live.question || 1}
              {live.classId && ` · ${className(live.classId)}`}
            </span>
            <h2>{q?.text || (teacher ? "Chọn lớp và câu hỏi rồi bấm Bắt đầu phiên" : "Chờ giảng viên chiếu câu hỏi")}</h2>
            <div className="live-options">
              {q?.options.map((o, i) => (
                <button
                  key={i}
                  disabled={teacher || !live.active || live.revealed || own !== undefined || !left}
                  className={`${selected === i || own === i ? "chosen" : ""} ${live.revealed && live.correct === i ? "correct-option" : ""}`}
                  onClick={() => setSelected(i)}
                >
                  <b>{String.fromCharCode(65 + i)}</b>
                  <span>{o}</span>
                  {live.revealed && live.correct === i && <CheckCircle2 size={20} />}
                </button>
              ))}
            </div>
            {teacher ? (
              <div className="live-controls">
                {!live.active && (
                  <Field label="Lớp">
                    <select aria-label="Lớp chiếu câu hỏi" value={classId} onChange={(e) => setClassId(e.target.value)}>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label={live.active ? "Câu tiếp theo" : "Câu hỏi"}>
                  <select
                    aria-label="Câu hỏi chiếu lên lớp"
                    value={nextQuestion}
                    onChange={(e) => setQuestionId(e.target.value)}
                  >
                    {bank.map((x) => (
                      <option key={x.id} value={x.id}>
                        Trang {x.page} · {x.text}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="row-actions">
                  {!live.active ? (
                    <Button
                      disabled={busy || !classId || !nextQuestion}
                      onClick={() => {
                        if (!bank.length) {
                          notify("Lớp này chưa có câu hỏi đã duyệt.");
                          return;
                        }
                        void run(() => startLive(classId, nextQuestion, SECONDS));
                      }}
                    >
                      <Play size={17} />
                      Bắt đầu phiên
                    </Button>
                  ) : (
                    <>
                      <Button variant="secondary" disabled={busy || live.revealed} onClick={() => void run(revealLive)}>
                        <BarChart3 size={17} />
                        Hiện đáp án
                      </Button>
                      <Button
                        disabled={busy || !nextQuestion}
                        onClick={() => {
                          void run(() => showQuestion(nextQuestion, SECONDS)).then((ok) => ok && setQuestionId(""));
                        }}
                      >
                        Đổi câu hỏi
                        <SkipForward size={17} />
                      </Button>
                      <Button variant="secondary" disabled={busy} onClick={() => void run(stopLive)}>
                        <Square size={15} />
                        Kết thúc phiên
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="live-submit">
                {own !== undefined ? (
                  <Badge tone={own === -1 ? "amber" : "green"}>
                    {own === -1 ? "Hết giờ · Không trả lời" : "Đã gửi"}
                  </Badge>
                ) : (
                  <Button
                    disabled={busy || selected === undefined || !left || live.revealed || !live.active}
                    onClick={() => {
                      if (selected !== undefined) void run(() => answerLive(selected));
                    }}
                  >
                    Xác nhận
                  </Button>
                )}
                {error && (
                  <p role="alert" className="error-text">
                    {error}
                  </p>
                )}
                {live.revealed && live.explanation && <p>{live.explanation}</p>}
              </div>
            )}
          </section>
          <aside>
            <Panel title={teacher ? "Tham gia phiên" : "Thông tin phiên"}>
              {teacher ? (
                live.active && live.code ? (
                  <>
                    <span className="large-session-code">{live.code}</span>
                    {qr && <img className="session-qr" src={qr} alt={`QR mở phiên ${live.code}`} />}
                    <p className="muted">
                      Quét mã QR hoặc nhập mã phiên để tham gia. Mã mới được tạo mỗi lần bắt đầu phiên.
                    </p>
                    <p className="answer-count">
                      <Users size={20} />
                      <strong>{(live.participants || []).length}</strong> sinh viên đã tham gia
                    </p>
                  </>
                ) : (
                  <p className="muted">Mã phiên và QR xuất hiện khi bắt đầu phiên.</p>
                )
              ) : (
                <p className="muted">
                  Bạn đã tham gia {live.classId ? `lớp ${className(live.classId)}` : "phiên"}. Câu hỏi tự cập nhật
                  khi giảng viên chuyển câu.
                </p>
              )}
            </Panel>
            <Panel title="Kết quả phiên">
              {teacher && (
                <p className="answer-count">
                  <Users size={20} />
                  <strong>{answered}</strong> câu trả lời
                </p>
              )}
              {live.revealed && q ? (
                <>
                  <p>
                    Tỷ lệ đúng:{" "}
                    {answered ? Math.round(((live.distribution?.[live.correct ?? -1] ?? 0) / answered) * 100) : 0}% · {answered}{" "}
                    sinh viên trả lời
                  </p>
                  {q.options.map((_, i) => {
                    const count = live.distribution?.[i] ?? 0;
                    return (
                      <div className="poll-result" key={i}>
                        <b>{String.fromCharCode(65 + i)}</b>
                        <progress max={Math.max(answered, 1)} value={count} />
                        <span>{count}</span>
                      </div>
                    );
                  })}
                </>
              ) : (
                <p className="muted">Kết quả hiển thị khi hết giờ, khi cả lớp đã trả lời hoặc giảng viên công bố.</p>
              )}
            </Panel>
          </aside>
        </div>
      )}
      {teacher && <LiveResults classIds={classes.map((c) => c.id)} />}
    </>
  );
}
