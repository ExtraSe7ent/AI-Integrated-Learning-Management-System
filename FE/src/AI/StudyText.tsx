import { Fragment } from "react";
import { explanationSections } from "../api/studyAi";

/** Renders **term** emphasis from model output as <strong>, never as HTML. */
export function Emphasis({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}

/** "Bài giảng AI" in its Ý chính / Ví dụ / Tóm tắt frame. */
export function ExplanationView({ content }: { content: string }) {
  return (
    <div className="ai-explanation">
      {explanationSections(content).map((s, i) => (
        <div key={i}>
          {s.heading && <h3>{s.heading}</h3>}
          {s.text.split("\n").map((line, j) => (
            <p key={j}>
              <Emphasis text={line} />
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
