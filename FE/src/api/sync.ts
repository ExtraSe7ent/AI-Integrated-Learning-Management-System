import { api } from "./client";
import type { Assessment, DemoData, StudyProgress } from "../data/fixtures";

type Item = { id: string };
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const url = (base: string, id: string) => `${base}/${encodeURIComponent(id)}`;

/** Sends one id-keyed list's changes: deletes and updates first, so a new row never hits a stale rule. */
async function syncList<T extends Item>(base: string, before: T[], after: T[]) {
  const old = new Map(before.map((x) => [x.id, x]));
  const next = new Map(after.map((x) => [x.id, x]));
  for (const x of before)
    if (!next.has(x.id)) await api(url(base, x.id), { method: "DELETE" });
  for (const x of after) {
    const prev = old.get(x.id);
    if (prev && !same(prev, x))
      await api(url(base, x.id), { method: "PUT", body: x });
  }
  for (const x of after)
    if (!old.has(x.id)) await api(base, { method: "POST", body: x });
}
async function syncUsers(before: DemoData, after: DemoData) {
  const old = new Map(before.admin.users.map((u) => [u.id, u]));
  const added = after.admin.users.filter((u) => !old.has(u.id));
  if (added.length)
    await api("/api/users/import", { method: "POST", body: added });
  for (const u of after.admin.users) {
    const prev = old.get(u.id);
    if (!prev || same(prev, u)) continue;
    if (u.mustChange && !prev.mustChange)
      await api(url("/api/users", u.id) + "/reset-password", {
        method: "POST",
      });
    if (u.role !== prev.role || u.active !== prev.active)
      await api(url("/api/users", u.id), {
        method: "PUT",
        body: { id: u.id, name: u.name, role: u.role, active: u.active },
      });
  }
}
async function syncClasses(before: DemoData, after: DemoData) {
  await syncList("/api/class-info", before.admin.classes, after.admin.classes);
  const old = new Map(before.admin.classes.map((c) => [c.id, c]));
  for (const c of after.admin.classes) {
    const prev = old.get(c.id);
    const added = prev
      ? c.studentIds.filter((id) => !prev.studentIds.includes(id))
      : [];
    if (added.length)
      await api(url("/api/class-info", c.id) + "/enroll", {
        method: "POST",
        body: added,
      });
  }
}
async function syncCoordination(before: DemoData, after: DemoData) {
  const a = before.coordination,
    b = after.coordination;
  await syncList("/api/coordination/items", a.items, b.items);
  await syncList("/api/coordination/requests", a.requests, b.requests);
  await syncList("/api/coordination/references", a.references, b.references);
  for (const id of a.completed)
    if (!b.completed.includes(id))
      await api(url("/api/coordination/completed", id), { method: "DELETE" });
  for (const id of b.completed)
    if (!a.completed.includes(id))
      await api(url("/api/coordination/completed", id), { method: "PUT" });
}
async function syncNotices(before: string[], after: string[], audience: string) {
  for (const message of after.slice(before.length))
    await api("/api/notices", { method: "POST", body: { audience, message } });
}
async function syncLive(before: DemoData, after: DemoData, accountId: string, student: boolean) {
  const a = before.live,
    b = after.live;
  if (student) {
    const join =
      !(a.participants || []).includes(accountId) &&
      (b.participants || []).includes(accountId);
    const answer =
      a.answers[accountId] === undefined ? b.answers[accountId] : undefined;
    if (join || answer !== undefined)
      await api("/api/live/me", { method: "PUT", body: { join, answer } });
    return;
  }
  await api("/api/live", {
    method: "PUT",
    body: {
      active: b.active,
      question: b.question,
      revealed: b.revealed,
      expiresAt: b.expiresAt,
      reset: Object.keys(b.answers).length === 0,
    },
  });
}

/** Results computed by the server replace the optimistic local value. */
export type ServerPatch = (d: DemoData) => DemoData;

async function syncAssessments(before: DemoData, after: DemoData) {
  const patches: ServerPatch[] = [];
  for (const [id, record] of Object.entries(after.assessments)) {
    if (same(before.assessments[id], record)) continue;
    const saved = await api<Assessment>(url("/api/assessments", id), {
      method: "PUT",
      body: record,
    });
    patches.push((d) => ({
      ...d,
      assessments: { ...d.assessments, [id]: saved },
    }));
  }
  return patches;
}
async function syncProgress(before: DemoData, after: DemoData) {
  for (const [id, record] of Object.entries(after.studySessions) as [
    string,
    StudyProgress,
  ][])
    if (!same(before.studySessions[id], record))
      await api(url("/api/study-progress", id), { method: "PUT", body: record });
}
async function syncChatRatings(before: DemoData, after: DemoData) {
  const old = new Map(
    before.chat.map((m) => [(m as { id?: string }).id, m.rating]),
  );
  for (const m of after.chat) {
    const id = (m as { id?: string }).id;
    if (id && m.rating && old.has(id) && old.get(id) !== m.rating)
      await api(`/api/ai/messages/${encodeURIComponent(id)}/rating`, {
        method: "PUT",
        body: { rating: m.rating },
      });
  }
}
function changedProfile(before: DemoData, after: DemoData) {
  const slices = ["profile", "teacherProfile", "deanProfile", "leaderProfile"] as const;
  const changed = slices.find((s) => !same(before[s], after[s]));
  return changed ? after[changed] : null;
}

/** Pushes the difference between two states to the REST API. Authorization is enforced by the server. */
export async function pushChanges(
  before: DemoData,
  after: DemoData,
  account: { id: string; role: string },
): Promise<ServerPatch[]> {
  const student = account.role === "sinh-vien";
  if (before.admin.users !== after.admin.users) await syncUsers(before, after);
  if (before.admin.courses !== after.admin.courses)
    await syncList("/api/courses", before.admin.courses, after.admin.courses);
  if (before.admin.classes !== after.admin.classes)
    await syncClasses(before, after);
  if (before.lessons !== after.lessons)
    await syncList("/api/lessons", before.lessons, after.lessons);
  if (before.questions !== after.questions)
    await syncList("/api/questions", before.questions, after.questions);
  if (before.sessions !== after.sessions)
    await syncList("/api/sessions", before.sessions, after.sessions);
  if (before.assignments !== after.assignments)
    await syncList("/api/assignments", before.assignments, after.assignments);
  if (before.resources !== after.resources)
    await syncList("/api/resources", before.resources, after.resources);
  if (before.gaps !== after.gaps)
    await syncList("/api/gaps", before.gaps, after.gaps);
  if (before.feedback !== after.feedback)
    await syncList("/api/feedback", before.feedback, after.feedback);
  if (before.appeals !== after.appeals)
    await syncList("/api/appeals", before.appeals, after.appeals);
  if (before.aiReminders !== after.aiReminders)
    await syncList(
      "/api/reminders",
      before.aiReminders.map((r) => ({ ...r })),
      after.aiReminders.map((r) => ({ ...r })),
    );
  if (before.coordination !== after.coordination)
    await syncCoordination(before, after);
  if (before.notices !== after.notices)
    await syncNotices(before.notices, after.notices, "student");
  if (before.teacherNotices !== after.teacherNotices)
    await syncNotices(before.teacherNotices, after.teacherNotices, "teacher");
  if (before.live !== after.live)
    await syncLive(before, after, account.id, student);
  if (before.studySessions !== after.studySessions)
    await syncProgress(before, after);
  if (before.chat !== after.chat) await syncChatRatings(before, after);
  const profile = changedProfile(before, after);
  if (profile) await api("/api/me/profile", { method: "PUT", body: profile });
  const read = (d: DemoData) =>
    d.readNotices || d.readTeacherNotices || d.readDeanNotices || d.readLeaderNotices;
  if (before.notes !== after.notes || read(before) !== read(after))
    await api("/api/me/preferences", {
      method: "PUT",
      body: { notes: after.notes, noticesRead: read(after) },
    });
  return before.assessments !== after.assessments
    ? syncAssessments(before, after)
    : [];
}
