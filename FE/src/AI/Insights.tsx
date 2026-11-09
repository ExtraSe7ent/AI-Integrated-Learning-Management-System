import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Panel, Empty, Button, Badge } from "../shared/UI";
import { useDemo } from "../data/DemoProvider";
import { classInsights } from "../api/studyAi";
import type { Insights } from "../api/studyAi";

/** AI plan for the next in-class session, from wrong answers and open knowledge gaps. */
export function ClassInsights({ courseId = "cs301" }: { courseId?: string }) {
  const { notify } = useDemo();
  const [plan, setPlan] = useState<Insights>(),
    [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    try {
      setPlan(await classInsights(courseId));
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title="Gợi ý buổi học trên lớp"
      action={
        <Button variant="secondary" disabled={busy} onClick={load}>
          <Sparkles size={16} />
          {busy ? "Đang phân tích…" : plan ? "Phân tích lại" : "Tạo gợi ý"}
        </Button>
      }
    >
      {!plan ? (
        <p className="muted">
          Gom câu trả lời sai và kiến thức mờ (đã ẩn danh) thành chủ đề, câu hỏi
          thảo luận và hoạt động cho buổi học tới.
        </p>
      ) : (
        <div className="ai-insights">
          <p>
            <Badge tone={plan.mode === "ai" ? "green" : "neutral"}>
              {plan.mode === "ai" ? "AI" : "Thống kê"}
            </Badge>{" "}
            {plan.summary}
          </p>
          {plan.themes.length > 0 && (
            <>
              <h3>Chủ đề cần giảng lại</h3>
              <ul>
                {plan.themes.map((t, i) => (
                  <li key={i}>
                    <strong>{t.title}</strong>
                    {t.pages.length > 0 && ` · Trang ${t.pages.join(", ")}`}
                    {t.explanation && <p className="muted">{t.explanation}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {plan.discussion.length > 0 && (
            <>
              <h3>Câu hỏi thảo luận</h3>
              <ol>
                {plan.discussion.map((d, i) => (
                  <li key={i}>
                    {d.question}
                    {d.why && <p className="muted">{d.why}</p>}
                  </li>
                ))}
              </ol>
            </>
          )}
          {plan.activities.length > 0 && (
            <>
              <h3>Hoạt động trên lớp</h3>
              <ul>
                {plan.activities.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </>
          )}
          <p className="ai-safety-note">
            {plan.mode === "ai"
              ? "AI đề xuất từ dữ liệu lớp và nội dung học liệu; giảng viên quyết định nội dung buổi học."
              : "Chưa có dịch vụ AI hoặc AI không phản hồi: đề xuất theo quy tắc thống kê."}
          </p>
        </div>
      )}
    </Panel>
  );
}

export function LearningInsights() {
  const { data } = useDemo();
  const pages = data.analytics.pages.filter((p) => p.wrong || p.gaps);
  return (
    <Panel title="Phân tích học tập từ dữ liệu hiện có">
      {pages.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nội dung</th>
                <th>Dữ liệu quan sát</th>
                <th>Đề xuất</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.page}>
                  <td>Trang {p.page}</td>
                  <td>
                    {p.wrong}/{p.answered} câu trả lời sai · {p.gaps} kiến thức
                    mờ chưa giải đáp
                  </td>
                  <td>
                    Ôn lại học liệu trang {p.page}; giải thích các câu sai và
                    kiến thức mờ.{" "}
                    <Link className="text-link" to="/giang-vien/phan-hoi">
                      Mở phản hồi
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title="Chưa có vùng yếu được ghi nhận"
          description="Cần câu trả lời quiz hoặc kiến thức mờ để có căn cứ đề xuất."
        />
      )}
      <p className="ai-safety-note">
        Tổng hợp từ câu trả lời quiz và kiến thức mờ của mọi sinh viên, theo
        quy tắc thống kê.
      </p>
    </Panel>
  );
}
