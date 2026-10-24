import { useRef, useState } from "react";
import { StickyNote } from "lucide-react";
import { uid, type Ann } from "@/lib/tome-db";

export type Tool = "ink" | "highlight" | "note" | "erase";
export const ANN_COLORS = { ink: "#2f5bd3", highlight: "#f4d03f", note: "#e8a33d" } as const;

export function AnnotationLayer({
  anns, tool, onChange,
}: { anns: Ann[]; tool?: Tool | null | undefined; onChange?: ((a: Ann[]) => void) | undefined }) {
  const box = useRef<HTMLDivElement>(null);
  const start = useRef<[number, number]>([0, 0]);
  const [draft, setDraft] = useState<Ann | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const pt = (e: React.PointerEvent): [number, number] => {
    const r = box.current!.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
  };

  const down = (e: React.PointerEvent) => {
    if (!tool || tool === "erase" || !onChange) return;
    const p = pt(e);
    if (tool === "note") {
      const text = window.prompt("Note text");
      if (text?.trim()) onChange([...anns, { id: uid(), type: "note", x: p[0], y: p[1], text: text.trim(), color: ANN_COLORS.note }]);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = p;
    setDraft(
      tool === "ink"
        ? { id: uid(), type: "ink", x: p[0], y: p[1], points: [p], color: ANN_COLORS.ink }
        : { id: uid(), type: "highlight", x: p[0], y: p[1], w: 0, h: 0, color: ANN_COLORS.highlight },
    );
  };
  const move = (e: React.PointerEvent) => {
    if (!draft) return;
    const p = pt(e);
    if (draft.type === "ink") setDraft({ ...draft, points: [...(draft.points ?? []), p] });
    else {
      const [sx, sy] = start.current;
      setDraft({ ...draft, x: Math.min(sx, p[0]), y: Math.min(sy, p[1]), w: Math.abs(p[0] - sx), h: Math.abs(p[1] - sy) });
    }
  };
  const up = () => {
    if (draft && onChange && ((draft.points?.length ?? 0) > 1 || (draft.w ?? 0) > 0.005)) onChange([...anns, draft]);
    setDraft(null);
  };
  const erase = (id: string) => tool === "erase" && onChange?.(anns.filter((a) => a.id !== id));

  const all = draft ? [...anns, draft] : anns;
  const active = !!tool && !!onChange;
  return (
    <div
      ref={box}
      className="absolute inset-0"
      style={{ cursor: active ? (tool === "erase" ? "pointer" : "crosshair") : "default", pointerEvents: active ? "auto" : "none", touchAction: active ? "none" : "auto" }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none">
        {all.map((a) =>
          a.type === "ink" ? (
            <polyline key={a.id} points={(a.points ?? []).map((p) => p.join(",")).join(" ")} fill="none" stroke={a.color}
              strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"
              style={{ pointerEvents: tool === "erase" ? "stroke" : "none" }} onClick={() => erase(a.id)} />
          ) : a.type === "highlight" ? (
            <rect key={a.id} x={a.x} y={a.y} width={a.w} height={a.h} fill={a.color} opacity={0.38}
              style={{ mixBlendMode: "multiply", pointerEvents: tool === "erase" ? "auto" : "none" }} onClick={() => erase(a.id)} />
          ) : null,
        )}
      </svg>
      {anns.filter((a) => a.type === "note").map((a) => (
        <div key={a.id} className="tome-note" style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%`, pointerEvents: "auto" }}>
          <button
            className="tome-note-pin"
            style={{ background: a.color }}
            aria-label="Note"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); if (tool === "erase") erase(a.id); else setOpen(open === a.id ? null : a.id); }}
          >
            <StickyNote className="h-3 w-3" />
          </button>
          {open === a.id && <div className="tome-note-text">{a.text}</div>}
        </div>
      ))}
    </div>
  );
}
