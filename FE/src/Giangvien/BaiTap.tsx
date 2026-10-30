import { EssayDraft } from "../AI/Insights";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Clock3,
  FileText,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Upload,
  Shuffle,
} from "lucide-react";
import { assessmentFor, updateAssessment, pointsFor } from "../data/assessment";
import { useDemo } from "../data/DemoProvider";
import { PageHeader, Panel, Button, Badge, Field } from "../shared/UI";
import { CourseContext } from "../shared/CourseComponents";
export function BaiTapGiangVien() {
  const { data, setData } = useDemo();
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
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    assignments: d.assignments.map((x) =>
                      x.id === a.id ? { ...x, published: !x.published } : x,
                    ),
                  }))
                }
              >
                {a.published ? "Ẩn bài tập" : "Công bố"}
              </Button>
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
              <FileText size={16} />3 loại câu hỏi
            </span>
            <span>
              <Shuffle size={16} />
              {a.random ? "Bật ngẫu nhiên hóa" : "Thứ tự cố định"}
            </span>
            <span>{a.attempts} lượt làm</span>
          </div>
          <div className="assignment-bottom">
            <span>
              {assessmentFor(data, a.id).result
                ? "1 bài nộp mới"
                : "Chưa có bài nộp"}
            </span>
            <small>Đóng: {new Date(a.closes).toLocaleString("vi-VN")}</small>
          </div>
        </Panel>
      ))}
    </>
  );
}
export function TaoBaiTap() {
  const { setData, notify } = useDemo();
  const navigate = useNavigate();
  const [suggested, setSuggested] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <PageHeader
        title="Tạo bài tập"
        description="Xác định mục tiêu, cấu trúc đề và điều kiện làm bài."
      />
      <CourseContext />
      <form
        className="editor-form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const opens = String(f.get("opens")),
            closes = String(f.get("closes"));
          if (Date.parse(closes) <= Date.parse(opens)) {
            setError("Hạn đóng phải sau thời gian mở.");
            return;
          }
          setData((d) => ({
            ...d,
            assignments: [
              ...d.assignments,
              {
                id: crypto.randomUUID(),
                title: String(f.get("title")),
                minutes: Number(f.get("minutes")),
                opens,
                closes,
                published: false,
                preventPaste: f.has("paste"),
                attempts: Number(f.get("attempts")),
                random: f.has("random"),
              },
            ],
          }));
          notify("Đã tạo bài tập nháp. Công bố khi đã kiểm tra nội dung.");
          navigate("/giang-vien/bai-tap");
        }}
      >
        <div>
          <Panel title="Thông tin bài tập">
            <Field label="Tên bài tập">
              <input
                name="title"
                required
                placeholder="Ví dụ: Thiết kế API quản lý thư viện"
              />
            </Field>
            <Field label="Hướng dẫn làm bài">
              <textarea
                name="description"
                rows={4}
                defaultValue="Đọc kỹ từng câu hỏi. Trình bày rõ lý do lựa chọn trong phần tự luận."
              />
            </Field>
            <div className="form-grid">
              <Field label="Thời gian mở">
                <input
                  name="opens"
                  required
                  type="datetime-local"
                  defaultValue="2026-10-16T08:00"
                />
              </Field>
              <Field label="Thời gian đóng">
                <input
                  name="closes"
                  required
                  type="datetime-local"
                  defaultValue="2027-01-31T23:59"
                />
              </Field>
            </div>
          </Panel>
          <Panel title="Cấu trúc đề mẫu" action={<Badge>10 điểm</Badge>}>
            <p className="muted">
              Bản FE hiện có một cấu trúc làm bài mẫu với 3 loại câu hỏi; nội
              dung đề mới dùng lại bộ câu hỏi này.
            </p>
            {[
              ["Trắc nghiệm", "1 câu", "4 điểm"],
              ["Điền trống", "1 câu", "3 điểm"],
              ["Tự luận", "1 câu", "3 điểm"],
            ].map(([t, c, p]) => (
              <div className="structure-row" key={t}>
                <strong>{t}</strong>
                <span>{c}</span>
                <Badge>{p}</Badge>
              </div>
            ))}
            <div className="row-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSuggested(true)}
              >
                <Sparkles size={16} />
                Xem gợi ý AI mẫu
              </Button>
              <Link
                className="button secondary"
                to="/giang-vien/ngan-hang-cau-hoi"
              >
                <Upload size={16} />
                Import câu hỏi
              </Link>
            </div>
            {suggested && (
              <div className="reply-block">
                <Badge tone="amber">Cần giảng viên rà soát</Badge>
                <p>
                  Gợi ý minh họa: tạo endpoint mượn sách, xác định HTTP method
                  và mã phản hồi. Không có model AI được gọi.
                </p>
                <Button
                  type="button"
                  variant="secondary small"
                  onClick={() =>
                    notify("Đã duyệt gợi ý mẫu cho cấu trúc đề hiện tại.")
                  }
                >
                  <CheckCircle2 size={16} />
                  Duyệt gợi ý mẫu
                </Button>
              </div>
            )}
          </Panel>
        </div>
        <aside>
          <Panel title="Điều kiện làm bài">
            <Field label="Thời gian làm (phút)">
              <input
                type="number"
                min={1}
                max={180}
                defaultValue={30}
                name="minutes"
                required
              />
            </Field>
            <Field label="Số lượt làm tối đa">
              <input
                type="number"
                min={1}
                max={10}
                defaultValue={3}
                name="attempts"
                required
              />
            </Field>
            <label className="checkbox-field">
              <input type="checkbox" name="paste" defaultChecked />
              Không cho dán nội dung
            </label>
            <label className="checkbox-field">
              <input type="checkbox" name="random" />
              Yêu cầu ngẫu nhiên hóa khi tích hợp BE
            </label>
            <p className="muted">
              Hết giờ tự nộp. Điểm tự luận cần giảng viên duyệt.
            </p>
          </Panel>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <Button type="submit">Lưu bài tập nháp</Button>
        </aside>
      </form>
    </>
  );
}
export function ChamBai() {
  const { data, setData, notify } = useDemo();
  const [score, setScore] = useState(2.5),
    [comment, setComment] = useState(
      "Endpoint và HTTP method phù hợp. Cần bổ sung mô tả khi sách không còn sẵn.",
    );
  const [params] = useSearchParams();
  const assignmentId = params.get("bai") || "a1";
  const result = assessmentFor(data, assignmentId).result;
  return (
    <>
      <PageHeader
        title="Chấm bài & phản hồi"
        description="Thiết kế API quản lý thư viện · Duyệt điểm trước khi công bố."
      />
      <CourseContext />
      <div className="grading-layout">
        <aside>
          <Panel title="Bài nộp">
            <button className="submission-person selected">
              <span className="avatar small">QA</span>
              <div>
                <strong>Nguyễn Quang Anh</strong>
                <small>
                  23110149 · {result ? "Đã nộp" : "Bài nộp minh họa"}
                </small>
              </div>
              <Badge tone="amber">Chờ duyệt</Badge>
            </button>
          </Panel>
        </aside>
        <Panel>
          <div className="panel-heading">
            <h2>Câu 3 · Tự luận</h2>
            <Badge>3 điểm</Badge>
          </div>
          <h3>Thiết kế API cho thao tác mượn sách</h3>
          <div className="submission-answer">
            {result?.answers[2] ||
              "Bài làm minh họa: POST /api/loans với bookId và studentId trong request body. Trả về 201 khi tạo thành công, 409 khi sách đã được mượn."}
          </div>
          {!result && (
            <div className="ai-grading">
              <Sparkles size={20} />
              <div>
                <strong>Gợi ý chấm nháp · Minh họa</strong>
                <p>
                  Phương án phù hợp về endpoint và method; cần bổ sung trường
                  hợp lỗi. Giảng viên quyết định điểm cuối cùng.
                </p>
                <span>Điểm đề xuất mẫu: 2.5 / 3</span>
              </div>
            </div>
          )}
          {result && <EssayDraft answer={result.answers[2] || ""} />}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!result) {
                notify(
                  "Chưa có bài nộp. Sinh viên cần nộp bài trước khi chấm.",
                );
                return;
              }
              const base = pointsFor(result)[0] + pointsFor(result)[1];
              setData((d) => ({
                ...updateAssessment(d, assignmentId, {
                  result: {
                    ...result,
                    score: Math.round((base + score) * 10) / 10,
                    questionPoints: [
                      pointsFor(result)[0],
                      pointsFor(result)[1],
                      score,
                    ],
                    approved: true,
                    comment,
                  },
                }),
                notices: [
                  ...d.notices,
                  "Điểm bài tập đã được giảng viên công bố.",
                ],
                readNotices: false,
              }));
              notify("Đã công bố điểm và phản hồi trên trình duyệt này.");
            }}
          >
            <Field label="Điểm tự luận (0–3)">
              <input
                required
                type="number"
                step="0.1"
                min={0}
                max={3}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
              />
            </Field>
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
      </div>
    </>
  );
}
