import { learningSummary } from "../data/learningSummary";
import { useState } from "react";
import { Download, TrendingUp, CheckCircle2, ArrowUpDown } from "lucide-react";
import { studyFor, studyCompletion } from "../data/study";
import { useDemo } from "../data/DemoProvider";
import {
  PageHeader,
  Panel,
  Badge,
  Button,
  SearchField,
  MetricStrip,
  Field,
} from "./UI";
import { useAccount } from "./AccountProvider";
import { CourseContext } from "./CourseComponents";
export async function exportWorkbook(
  title: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title);
  sheet.addRow(headers);
  rows.forEach((r) => sheet.addRow(r));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFA4262C" },
  };
  sheet.columns.forEach((c) => {
    c.width = 25;
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `VJU-${title}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** Vietnamese names keep the given name last; the grade sheet needs both columns (UC-G01). */
export function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { family: parts.slice(0, -1).join(" "), given: parts[parts.length - 1] };
}
export function DiemSo({ teacher = false }: { teacher?: boolean }) {
  const { data, notify } = useDemo();
  const { account } = useAccount();
  const [query, setQuery] = useState(""),
    [classCode, setClassCode] = useState(""),
    [ascending, setAscending] = useState(true);
  const classes = data.analytics.classes;
  const selectedClass = classes.find((c) => c.id === classCode) ?? classes[0];
  const { self, average, sessions, assignments } = learningSummary(data);
  const onTime = sessions.filter(
    (session) => studyCompletion(studyFor(data, session.id), session) === "on-time",
  ).length;
  const rows = (selectedClass?.students ?? [])
    .filter((s) => (s.name + s.id).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) =>
      ascending
        ? a.name.localeCompare(b.name, "vi")
        : b.name.localeCompare(a.name, "vi"),
    );
  async function download() {
    try {
      await exportWorkbook(
        teacher ? `Bang-diem-${selectedClass?.name ?? ""}` : "Bang-diem",
        ["STT", "Mã SV", "Họ đệm", "Tên", "Điểm tự học", "Điểm TB bài tập"],
        teacher
          ? rows.map((s, i) => [
              i + 1,
              s.id,
              splitName(s.name).family,
              splitName(s.name).given,
              s.selfStudy,
              s.average,
            ])
          : [
              [
                1,
                account?.id ?? "",
                splitName(data.profile.name).family,
                splitName(data.profile.name).given,
                self,
                average,
              ],
            ],
      );
      notify("Đã xuất bảng điểm thành tệp Excel.");
    } catch {
      notify("Không xuất được Excel. Hãy thử lại.");
    }
  }
  return (
    <>
      <PageHeader
        title={teacher ? "Bảng điểm" : "Kết quả học tập"}
        description={
          teacher
            ? "Điểm tự học và bài tập theo học phần."
            : "Nhìn lại những gì bạn đã hoàn thành."
        }
        action={
          <Button variant="secondary" onClick={download}>
            <Download size={17} />
            Xuất Excel
          </Button>
        }
      />
      {teacher && (
        <div className="grade-class-selector">
          <Field label="Lớp học">
            <select
              aria-label="Lớp học"
              value={selectedClass?.id ?? ""}
              onChange={(e) => {
                setClassCode(e.target.value);
                setQuery("");
              }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.courseTitle}
                </option>
              ))}
            </select>
          </Field>
          <span>
            Học kỳ {selectedClass?.term} · {selectedClass?.year}
          </span>
        </div>
      )}
      <CourseContext teacher={teacher} />
      {!teacher && (
        <MetricStrip
          items={[
            {
              label: "Điểm tự học",
              value: `${self}/10`,
              note: "Chỉ tính phiên đúng hạn",
            },
            {
              label: "Điểm TB bài tập",
              value: `${average}/10`,
              note: "Trung bình cộng các bài",
            },
            {
              label: "Phiên đã hoàn thành",
              value: `${onTime}/${sessions.length}`,
              note: "Đúng hạn trên tổng số phiên",
            },
          ]}
        />
      )}
      {teacher ? (
        <Panel>
          <div className="toolbar">
            <h2>
              {selectedClass?.name ?? "Chưa có lớp"} · {rows.length} sinh viên
            </h2>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Tìm tên hoặc mã sinh viên…"
            />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã sinh viên</th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => setAscending(!ascending)}
                    >
                      Họ đệm
                      <ArrowUpDown size={13} />
                    </button>
                  </th>
                  <th>Tên</th>
                  <th>Điểm tự học</th>
                  <th>TB bài tập</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>{s.id}</td>
                    <td>{splitName(s.name).family}</td>
                    <td>
                      <strong>{splitName(s.name).given}</strong>
                    </td>
                    <td>{s.selfStudy}</td>
                    <td>
                      <strong>{s.average}</strong>
                    </td>
                    <td>
                      <Badge tone={s.average < 5 ? "amber" : "green"}>
                        {s.average < 5 ? "Cần hỗ trợ" : "Đã cập nhật"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <p className="empty">Không tìm thấy sinh viên phù hợp.</p>
            )}
          </div>
        </Panel>
      ) : (
        <>
          <Panel title="Chi tiết điểm tự học">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Phiên tự học</th>
                    <th>Trạng thái</th>
                    <th>Tính điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions
                    .map((session) => {
                      const status = studyCompletion(
                        studyFor(data, session.id),
                        session,
                      );
                      return [
                        session.title,
                        status === "on-time"
                          ? "Đúng hạn"
                          : status === "late"
                            ? "Hoàn thành muộn"
                            : "Chưa hoàn thành",
                        status === "on-time" ? "Có" : "Không",
                      ];
                    })
                    .map(([t, s, c]) => (
                      <tr key={t}>
                        <td>
                          <strong>{t}</strong>
                        </td>
                        <td>
                          <Badge tone={s === "Đúng hạn" ? "green" : "amber"}>
                            {s}
                          </Badge>
                        </td>
                        <td>{c}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="formula-note">
              <CheckCircle2 size={16} />
              Điểm tự học = số phiên hoàn thành đúng hạn / tổng số phiên × 10.
            </p>
          </Panel>
          <Panel title="Điểm bài tập">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Bài tập</th>
                    <th>Điểm /10</th>
                    <th>Nhận xét</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gradeHistory.map((r) => (
                    <tr key={r.id}>
                      <td>{r.title}</td>
                      <td>{r.score}</td>
                      <td>{r.comment}</td>
                    </tr>
                  ))}
                  {assignments.map((a) => {
                    const result = data.assessments[a.id]?.result;
                    return (
                      <tr key={a.id}>
                        <td>{a.title}</td>
                        <td>{result?.score ?? "Chưa nộp"}</td>
                        <td>
                          {result
                            ? result.approved
                              ? result.comment || "Đã duyệt điểm."
                              : "Điểm tạm tính; tự luận chờ duyệt."
                            : "Chưa có bài làm"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="formula-note">
              <TrendingUp size={16} />
              Điểm TB bài tập = trung bình cộng điểm các bài đã nộp.
            </p>
          </Panel>
        </>
      )}
    </>
  );
}
