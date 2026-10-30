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
} from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import { PageHeader, Panel, Button, Badge, Field, Journey } from "./UI";
import { CourseContext } from "./CourseComponents";
export function LopTrucTiep({ teacher = false }: { teacher?: boolean }) {
  const { data, setData, notify } = useDemo();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || ""),
    [joined, setJoined] = useState(false),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<number>(),
    [qr, setQr] = useState(""),
    [now, setNow] = useState(Date.now()),
    [offline, setOffline] = useState(!navigator.onLine);
  const live = data.live,
    questions = data.questions.filter((q) => q.approved),
    q = questions[live.question % Math.max(questions.length, 1)];
  const left = Math.max(0, Math.ceil((live.expiresAt - now) / 1000));
  const own = live.answers.sv1;
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
    let active = true;
    void QRCode.toDataURL(
      `${location.origin}/sinh-vien/tren-lop?code=${live.code}`,
      { margin: 1, width: 150, color: { dark: "#87252c" } },
    ).then((url) => {
      if (active) setQr(url);
    });
    return () => {
      active = false;
    };
  }, [live.code]);
  useEffect(() => {
    if (!live.active || live.revealed) return;
    if (left === 0 && live.expiresAt) {
      setData((d) => ({
        ...d,
        live: {
          ...d.live,
          revealed: true,
          answers:
            !teacher && joined && d.live.answers.sv1 === undefined
              ? { ...d.live.answers, sv1: -1 }
              : d.live.answers,
        },
      }));
    } else if (Object.keys(live.answers).length >= 4)
      setData((d) => ({ ...d, live: { ...d.live, revealed: true } }));
  }, [
    left,
    live.active,
    live.revealed,
    live.expiresAt,
    live.answers,
    joined,
    teacher,
    setData,
  ]);
  function start() {
    if (!questions.length) {
      notify("Cần ít nhất một câu hỏi đã duyệt.");
      return;
    }
    setData((d) => ({
      ...d,
      live: {
        ...d.live,
        active: true,
        revealed: false,
        answers: {},
        expiresAt: Date.now() + 45000,
      },
    }));
    setSelected(undefined);
  }
  function next() {
    setData((d) => ({
      ...d,
      live: {
        ...d.live,
        question: d.live.question + 1,
        revealed: false,
        answers: {},
        expiresAt: Date.now() + 45000,
      },
    }));
    setSelected(undefined);
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
          Bạn đang ngoại tuyến. Kiểm tra kết nối trước khi tiếp tục.
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
                if (code !== live.code || !live.active) {
                  setError(
                    "Mã phiên không đúng hoặc phiên chưa mở. Hãy kiểm tra lại với giảng viên.",
                  );
                  return;
                }
                setJoined(true);
                setError("");
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
              <Button>
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
            <p>
              Chọn câu trả lời của bạn. Cả lớp cùng nhìn lại kết quả sau mỗi
              lượt.
            </p>
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
                {left}s
              </span>
              {teacher && (
                <button
                  className="icon-button"
                  aria-label="Toàn màn hình câu hỏi"
                  onClick={() =>
                    document.querySelector(".live-board")?.requestFullscreen()
                  }
                >
                  <Maximize2 size={18} />
                </button>
              )}
            </div>
            <span className="muted">Câu {live.question + 1} · CSE301</span>
            <h2>{q?.text || "Chưa có câu hỏi được duyệt"}</h2>
            <div className="live-options">
              {q?.options.map((o, i) => (
                <button
                  key={i}
                  disabled={
                    teacher ||
                    !live.active ||
                    live.revealed ||
                    own !== undefined ||
                    !left
                  }
                  className={`${selected === i ? "chosen" : ""} ${live.revealed && q.correct === i ? "correct-option" : ""}`}
                  onClick={() => setSelected(i)}
                >
                  <b>{String.fromCharCode(65 + i)}</b>
                  <span>{o}</span>
                  {live.revealed && q.correct === i && (
                    <CheckCircle2 size={20} />
                  )}
                </button>
              ))}
            </div>
            {teacher ? (
              <div className="row-actions">
                {!live.active ? (
                  <Button onClick={start}>
                    <Play size={17} />
                    Bắt đầu phiên
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          live: { ...d.live, revealed: true },
                        }))
                      }
                    >
                      <BarChart3 size={17} />
                      Hiện đáp án
                    </Button>
                    <Button onClick={next}>
                      Câu tiếp theo
                      <SkipForward size={17} />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="live-submit">
                {own !== undefined ? (
                  <Badge tone={own === -1 ? "amber" : "green"}>
                    {own === -1
                      ? "Hết giờ · Chưa trả lời"
                      : "Đã gửi câu trả lời"}
                  </Badge>
                ) : (
                  <Button
                    disabled={selected === undefined || !left || live.revealed}
                    onClick={() => {
                      if (selected === undefined) return;
                      setData((d) => ({
                        ...d,
                        live: {
                          ...d.live,
                          answers: { ...d.live.answers, sv1: selected },
                        },
                      }));
                    }}
                  >
                    Xác nhận câu trả lời
                  </Button>
                )}
                {live.revealed && <p>{q?.explanation}</p>}
              </div>
            )}
          </section>
          <aside>
            <Panel title={teacher ? "Tham gia phiên" : "Thông tin phiên"}>
              <span className="large-session-code">{live.code}</span>
              {qr && (
                <img
                  className="session-qr"
                  src={qr}
                  alt={`QR mở phiên ${live.code}`}
                />
              )}
              <p className="muted">
                Quét mã QR hoặc nhập mã phiên để tham gia lớp học.
              </p>
            </Panel>
            <Panel title="Kết quả phiên">
              <p className="answer-count">
                <Users size={20} />
                <strong>{Object.keys(live.answers).length}</strong> câu trả lời
              </p>
              {live.revealed ? (
                q?.options.map((_, i) => {
                  const count = Object.values(live.answers).filter(
                    (v) => v === i,
                  ).length;
                  return (
                    <div className="poll-result" key={i}>
                      <b>{String.fromCharCode(65 + i)}</b>
                      <progress
                        max={Math.max(Object.keys(live.answers).length, 1)}
                        value={count}
                      />
                      <span>{count}</span>
                    </div>
                  );
                })
              ) : (
                <p className="muted">
                  Kết quả hiển thị khi hết giờ hoặc giảng viên công bố.
                </p>
              )}
            </Panel>
          </aside>
        </div>
      )}
    </>
  );
}
