import { Link } from "react-router-dom";
import { Panel, Empty, Badge } from "../shared/UI";
import { useDemo } from "../data/DemoProvider";
import { essayDraft } from "./model";
export function LearningInsights() {
  const { data } = useDemo();
  const pages = [1, 2, 3, 4]
    .map((page) => {
      const questions = data.questions.filter((q) => q.page === page);
      let wrong = 0,
        answered = 0;
      for (const session of data.sessions)
        for (const q of questions) {
          const a = data.studySessions[session.id]?.answers[q.id];
          if (a !== undefined) {
            answered++;
            if (a !== q.correct) wrong++;
          }
        }
      const gaps = data.gaps.filter(
        (g) => g.page === page && !g.response,
      ).length;
      return { page, wrong, answered, gaps };
    })
    .filter((p) => p.wrong || p.gaps);
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
        Phạm vi: dữ liệu phiên tự học CSE301 của tài khoản sinh viên trong bản
        FE. Phân tích quy tắc cục bộ; chưa gọi mô hình AI.
      </p>
    </Panel>
  );
}
export function EssayDraft({ answer }: { answer: string }) {
  const draft = essayDraft(answer);
  return (
    <div className="reply-block">
      <div className="panel-heading">
        <h3>Gợi ý chấm nháp theo tiêu chí</h3>
        <Badge tone="amber">Chờ giảng viên duyệt</Badge>
      </div>
      <p>Điểm đề xuất: {draft.score}/3</p>
      <ul>
        {draft.checks.map((c) => (
          <li key={c.label}>
            {c.met ? "Đã ghi nhận" : "Cần bổ sung"}: {c.label}
          </li>
        ))}
      </ul>
      <p>{draft.feedback}</p>
      <small>
        Gợi ý cục bộ hỗ trợ rà soát; giảng viên quyết định điểm và phản hồi
        trước khi công bố.
      </small>
    </div>
  );
}
