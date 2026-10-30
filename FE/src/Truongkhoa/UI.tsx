import { useSearchParams } from "react-router-dom";
import { Empty, Field, MetricStrip } from "../shared/UI";
import { ACTIVE_TERM, deanLink, terms } from "./data";

const assets = {
  workspace: "86b8f.svg",
  dashboard: "7d579.svg",
  dashboardActive: "ff887.svg",
  book: "b29c7.svg",
  bookActive: "a8dd4.svg",
  alert: "f8921.svg",
  alertActive: "9d6c1.svg",
  user: "856ec.svg",
  bell: "0fefc.svg",
  down: "b3f51.svg",
  right: "299c8.svg",
};
export function DeanIcon({ name }: { name: keyof typeof assets }) {
  return (
    <img
      className="dean-icon"
      src={`/figma/dean/${assets[name]}`}
      alt=""
      aria-hidden="true"
    />
  );
}
export function useFacultyScope() {
  const [params, setParams] = useSearchParams();
  const term = params.get("ky") === "2026-2" ? "2026-2" : ACTIVE_TERM;
  return {
    term,
    params,
    setParams,
    link: (path: string, filters?: Record<string, string>) =>
      deanLink(path, term, filters),
  };
}
export function TermFilter() {
  const { term, params, setParams } = useFacultyScope();
  return (
    <Field label="Học kỳ">
      <select
        aria-label="Học kỳ"
        value={term}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          next.set("ky", e.target.value);
          next.delete("lop");
          setParams(next);
        }}
      >
        {terms.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
export function FacultyMetrics({
  items,
}: {
  items: { label: string; value: string; note: string }[];
}) {
  return (
    <div className={items.length === 4 ? "dean-metrics four" : "dean-metrics"}>
      <MetricStrip items={items} />
    </div>
  );
}
export function NoFacultyData() {
  const { setParams } = useFacultyScope();
  return (
    <Empty
      title="Chưa có lớp học trong học kỳ này"
      description="Chọn học kỳ khác để xem dữ liệu học tập của khoa."
      action={
        <button
          className="button secondary"
          onClick={() => setParams({ ky: ACTIVE_TERM })}
        >
          Về học kỳ I
        </button>
      }
    />
  );
}
