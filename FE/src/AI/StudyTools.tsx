import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useDemo } from "../data/DemoProvider";
import { PageHeader, Panel, Field, Button, Badge, Empty } from "../shared/UI";
import {
  aidsOf,
  createAid,
  deleteAid,
  dueCards,
  explanationsOf,
  generateAids,
  generateExplanations,
  reviewCard,
  saveExplanation,
  updateAid,
} from "../api/studyAi";
import type { Aid, AidKind, Explanation } from "../api/studyAi";
import { Emphasis, ExplanationView } from "./StudyText";

function CourseSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { data } = useDemo();
  return (
    <Field label="Học phần">
      <select
        aria-label="Học phần"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {data.admin.courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} · {c.title}
          </option>
        ))}
      </select>
    </Field>
  );
}
const firstCourse = (ids: string[]) => (ids.includes("cs301") ? "cs301" : ids[0] ?? "cs301");

/** GV: soạn, sửa và công bố Bài giảng AI, thẻ ôn và FAQ. */
export function TeacherStudyTools() {
  const { data } = useDemo();
  const [courseId, setCourseId] = useState(firstCourse(data.admin.courses.map((c) => c.id)));
  const [tab, setTab] = useState<"lesson" | AidKind>("lesson");
  return (
    <>
      <PageHeader
        title="Học liệu AI"
        description="AI soạn nháp từ học liệu đã lập chỉ mục · Giảng viên duyệt trước khi sinh viên thấy."
        action={<Badge tone="amber">Cần duyệt</Badge>}
      />
      <Panel>
        <div className="toolbar">
          <CourseSelect value={courseId} onChange={setCourseId} />
          <div className="tabs" role="tablist">
            {(
              [
                ["lesson", "Bài giảng AI"],
                ["card", "Thẻ ôn"],
                ["faq", "FAQ lớp"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                className={tab === key ? "selected" : ""}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Panel>
      {tab === "lesson" ? (
        <LessonExplanations courseId={courseId} />
      ) : (
        <AidEditor key={tab + courseId} courseId={courseId} kind={tab} />
      )}
    </>
  );
}

function LessonExplanations({ courseId }: { courseId: string }) {
  const { notify } = useDemo();
  const [rows, setRows] = useState<Explanation[]>([]),
    [drafts, setDrafts] = useState<Record<number, string>>({}),
    [newPage, setNewPage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    explanationsOf(courseId)
      .then(setRows)
      .catch((e) => notify((e as Error).message));
  }, [courseId, notify]);
  const replace = (row: Explanation) =>
    setRows((list) =>
      [...list.filter((r) => r.page !== row.page), row].sort((a, b) => a.page - b.page),
    );
  async function generate() {
    setBusy(true);
    try {
      setRows(await generateExplanations(courseId));
      notify("AI đã soạn bản nháp. Hãy đọc lại và công bố từng trang.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(page: number, body: { content?: string; published?: boolean }) {
    try {
      replace(await saveExplanation(courseId, page, body));
      setDrafts((d) => {
        const next = { ...d };
        delete next[page];
        return next;
      });
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <>
      <Panel
        title="Bài giảng AI theo trang"
        action={
          <Button disabled={busy} onClick={generate}>
            <Sparkles size={16} />
            {busy ? "Đang soạn…" : rows.length ? "Soạn lại bản nháp" : "AI soạn bài giảng"}
          </Button>
        }
      >
        <p className="muted">
          Mỗi trang có Ý chính · Ví dụ · Tóm tắt. Soạn lại giữ nguyên các trang
          giảng viên đã sửa; trang được soạn lại sẽ ẩn khỏi sinh viên cho đến khi
          công bố lại.
        </p>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const page = Number(newPage);
            if (page >= 1) {
              setDrafts((d) => ({ ...d, [page]: d[page] ?? "Ý chính\n" }));
              if (!rows.some((r) => r.page === page))
                setRows((list) =>
                  [
                    ...list,
                    {
                      id: `${courseId}:${page}`,
                      courseId,
                      page,
                      content: "",
                      published: false,
                      edited: true,
                      updatedAt: "",
                    },
                  ].sort((a, b) => a.page - b.page),
                );
              setNewPage("");
            }
          }}
        >
          <Field label="Tự viết cho trang">
            <input
              type="number"
              min={1}
              value={newPage}
              onChange={(e) => setNewPage(e.target.value)}
            />
          </Field>
          <Button variant="secondary" disabled={!newPage}>
            Thêm trang
          </Button>
        </form>
      </Panel>
      {rows.length === 0 && (
        <Empty
          title="Chưa có bài giảng AI"
          description="Upload, công bố và lập chỉ mục học liệu PDF rồi bấm “AI soạn bài giảng”."
        />
      )}
      {rows.map((row) => {
        const editing = drafts[row.page] !== undefined;
        return (
          <Panel
            key={row.page}
            title={`Trang ${row.page}`}
            action={
              <span className="inline-actions">
                <Badge tone={row.published ? "green" : "amber"}>
                  {row.published ? "Đã công bố" : "Bản nháp"}
                </Badge>
                {row.edited && <Badge>Giảng viên sửa</Badge>}
              </span>
            }
          >
            {editing ? (
              <Field label={`Nội dung trang ${row.page}`}>
                <textarea
                  rows={10}
                  value={drafts[row.page]}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [row.page]: e.target.value }))
                  }
                />
              </Field>
            ) : (
              <ExplanationView content={row.content} />
            )}
            <div className="inline-actions">
              {editing ? (
                <>
                  <Button
                    disabled={!drafts[row.page]?.trim()}
                    onClick={() => save(row.page, { content: drafts[row.page] })}
                  >
                    Lưu
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setDrafts((d) => {
                        const next = { ...d };
                        delete next[row.page];
                        return next;
                      });
                      if (!row.content) setRows((l) => l.filter((r) => r.page !== row.page));
                    }}
                  >
                    Hủy
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary small"
                    onClick={() => setDrafts((d) => ({ ...d, [row.page]: row.content }))}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="small"
                    onClick={() => save(row.page, { published: !row.published })}
                  >
                    {row.published ? "Ẩn" : "Công bố"}
                  </Button>
                </>
              )}
            </div>
          </Panel>
        );
      })}
    </>
  );
}

function AidEditor({ courseId, kind }: { courseId: string; kind: AidKind }) {
  const { notify } = useDemo();
  const label = kind === "card" ? "thẻ ôn" : "FAQ";
  const [aids, setAids] = useState<Aid[]>([]),
    [busy, setBusy] = useState(false),
    [front, setFront] = useState(""),
    [back, setBack] = useState("");
  useEffect(() => {
    aidsOf(courseId, kind)
      .then(setAids)
      .catch((e) => notify((e as Error).message));
  }, [courseId, kind, notify]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Panel
        title={kind === "card" ? "Thẻ ôn tập" : "Câu hỏi thường gặp của lớp"}
        action={
          <Button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const created = await generateAids(courseId, kind);
                setAids((list) => [...list, ...created]);
                notify(`AI đã soạn ${created.length} ${label} nháp.`);
              })
            }
          >
            <Sparkles size={16} />
            {busy ? "Đang soạn…" : `AI soạn ${label}`}
          </Button>
        }
      >
        <p className="muted">
          {kind === "card"
            ? "AI soạn tối đa 5 thẻ, mỗi thẻ phải trích nguyên văn học liệu; thẻ không có nguồn bị loại."
            : "AI gom các kiến thức mờ chưa giải đáp (đã ẩn danh) thành tối đa 5 câu FAQ có nguồn."}
        </p>
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const aid = await createAid({ courseId, kind, front, back });
              setAids((list) => [...list, aid]);
              setFront("");
              setBack("");
            });
          }}
        >
          <Field label={kind === "card" ? "Mặt trước (câu hỏi)" : "Câu hỏi"}>
            <input required value={front} onChange={(e) => setFront(e.target.value)} />
          </Field>
          <Field label={kind === "card" ? "Mặt sau (giải thích)" : "Trả lời"}>
            <textarea required rows={3} value={back} onChange={(e) => setBack(e.target.value)} />
          </Field>
          <Button variant="secondary" disabled={busy || !front.trim() || !back.trim()}>
            Tự thêm {label}
          </Button>
        </form>
      </Panel>
      {aids.length === 0 && <Empty title={`Chưa có ${label}`} />}
      {aids.map((aid) => (
        <Panel
          key={aid.id}
          title={aid.front}
          action={
            <span className="inline-actions">
              <Badge tone={aid.published ? "green" : "amber"}>
                {aid.published ? "Đã công bố" : "Bản nháp"}
              </Badge>
              <Badge>{aid.origin === "ai" ? "AI soạn" : "Giảng viên"}</Badge>
            </span>
          }
        >
          <p>
            <Emphasis text={aid.back} />
          </p>
          {aid.page ? <small className="muted">Nguồn · Trang {aid.page}</small> : null}
          <div className="inline-actions">
            <Button
              variant="small"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const saved = await updateAid(aid.id, { published: !aid.published });
                  setAids((list) => list.map((a) => (a.id === aid.id ? saved : a)));
                })
              }
            >
              {aid.published ? "Ẩn" : "Công bố"}
            </Button>
            <Button
              variant="secondary small"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await deleteAid(aid.id);
                  setAids((list) => list.filter((a) => a.id !== aid.id));
                })
              }
            >
              Xóa
            </Button>
          </div>
        </Panel>
      ))}
    </>
  );
}

/** SV: ôn thẻ theo lịch lặp lại và đọc FAQ của lớp. */
export function StudentReview() {
  const { data, notify } = useDemo();
  const [courseId, setCourseId] = useState(firstCourse(data.admin.courses.map((c) => c.id)));
  const [aids, setAids] = useState<Aid[]>([]),
    [flipped, setFlipped] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setFlipped(false);
    aidsOf(courseId)
      .then(setAids)
      .catch((e) => notify((e as Error).message));
  }, [courseId, notify]);
  const due = dueCards(aids);
  const card = due[0];
  const faq = aids.filter((a) => a.kind === "faq");
  const cards = aids.filter((a) => a.kind === "card");
  async function answer(remembered: boolean) {
    if (!card) return;
    setBusy(true);
    try {
      const review = await reviewCard(card.id, remembered);
      setAids((list) => list.map((a) => (a.id === card.id ? { ...a, review } : a)));
      setFlipped(false);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Ôn tập"
        description="Thẻ ôn và FAQ do giảng viên duyệt từ học liệu của học phần."
        action={<Badge tone="green">Không tính điểm</Badge>}
      />
      <Panel>
        <CourseSelect value={courseId} onChange={setCourseId} />
      </Panel>
      <Panel
        title="Thẻ ôn đến hạn"
        action={<Badge>{due.length}/{cards.length} thẻ</Badge>}
      >
        {card ? (
          <div className="review-card">
            {card.topic && <Badge>{card.topic}</Badge>}
            <h3>{card.front}</h3>
            {flipped ? (
              <>
                <p>
                  <Emphasis text={card.back} />
                </p>
                {card.page ? (
                  <Link
                    className="source-chip"
                    to={`/sinh-vien/hoc/${courseId}?trang=${card.page}`}
                  >
                    Xem nguồn · Trang {card.page}
                  </Link>
                ) : null}
                <div className="inline-actions">
                  <Button disabled={busy} onClick={() => answer(true)}>
                    Đã nhớ
                  </Button>
                  <Button variant="secondary" disabled={busy} onClick={() => answer(false)}>
                    Chưa nhớ
                  </Button>
                </div>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setFlipped(true)}>
                Lật thẻ
              </Button>
            )}
          </div>
        ) : (
          <Empty
            title={cards.length ? "Đã ôn hết thẻ đến hạn" : "Chưa có thẻ ôn"}
            description={
              cards.length
                ? "Thẻ nhớ được sẽ quay lại sau 1, 3, 7, 14 rồi 30 ngày."
                : "Giảng viên chưa công bố thẻ ôn cho học phần này."
            }
          />
        )}
      </Panel>
      <Panel title="Câu hỏi thường gặp">
        {faq.length ? (
          faq.map((a) => (
            <details key={a.id} className="faq-item">
              <summary>{a.front}</summary>
              <p>
                <Emphasis text={a.back} />
              </p>
            </details>
          ))
        ) : (
          <Empty title="Chưa có FAQ" description="Giảng viên chưa công bố FAQ của lớp." />
        )}
      </Panel>
    </>
  );
}
