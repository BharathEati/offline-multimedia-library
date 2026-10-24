import { useRef, useState } from "react";
import { RotateCw, Trash2, FilePlus2, ImagePlus, PenLine, Highlighter, StickyNote, Eraser, X, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { putAsset, putItem, releaseAssets, type Ann, type Item } from "@/lib/tome-db";
import { insertImage, insertPdf, rebuild, remapAnnotations, rotate, rotateAnns } from "@/lib/pdf-ops";
import { friendlyError } from "@/lib/import";
import { MISSING, Problem, useAssetBlob } from "../views/shared";
import { PdfThumb, PdfView, usePdfDoc } from "../views/PdfView";
import type { Tool } from "../views/AnnotationLayer";

export function PdfEditor({ item, onItem }: { item: Item; onItem: (i: Item) => void }) {
  const { blob, missing } = useAssetBlob(item.assetId);
  const { doc, err } = usePdfDoc(blob);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [annotate, setAnnotate] = useState<number | null>(null);
  const [tool, setTool] = useState<Tool>("highlight");
  const drag = useRef<number | null>(null);
  const pdfIn = useRef<HTMLInputElement>(null);
  const imgIn = useRef<HTMLInputElement>(null);
  const n = doc?.numPages ?? 0;
  const insertAt = sel.size ? Math.max(...sel) + 1 : n;

  /** Store the new PDF as a fresh managed copy, then retire the old copy. */
  async function commit(label: string, make: () => Promise<{ blob: Blob; anns: Record<string, Ann[]> }>) {
    setBusy(label);
    setError(null);
    try {
      const { blob: out, anns } = await make();
      const assetId = await putAsset(out);
      const next: Item = { ...item, assetId, hash: undefined, annotations: anns };
      await putItem(next);
      if (item.assetId) await releaseAssets(item.bookId, [item.assetId]);
      setSel(new Set());
      onItem(next);
    } catch (e) {
      setError(`Couldn't ${label.toLowerCase()}: ${friendlyError(e)}`);
    } finally {
      setBusy(null);
    }
  }

  const reorder = (order: (number | null)[]) =>
    commit("Reorder pages", async () => ({
      blob: await rebuild(blob!, order.filter((x): x is number => x != null)),
      anns: remapAnnotations(item.annotations, order),
    }));

  const doDelete = () => {
    if (sel.size >= n) return setError("A PDF needs at least one page. Remove the whole document from the content list instead.");
    reorder([...Array(n).keys()].filter((i) => !sel.has(i)));
  };
  const doRotate = () =>
    commit("Rotate pages", async () => {
      const anns = { ...(item.annotations ?? {}) };
      sel.forEach((i) => { const a = anns[String(i)]; if (a) anns[String(i)] = rotateAnns(a); });
      return { blob: await rotate(blob!, [...sel]), anns };
    });
  const shiftAnns = (count: number) =>
    remapAnnotations(item.annotations, [...Array(insertAt).keys(), ...Array(count).fill(null), ...[...Array(n - insertAt).keys()].map((k) => k + insertAt)]);

  const onDrop = (to: number) => {
    const from = drag.current;
    drag.current = null;
    if (from == null || from === to) return;
    const order: number[] = [...Array(n).keys()];
    const [m] = order.splice(from, 1);
    order.splice(to, 0, m!);
    reorder(order);
  };

  if (missing) return <Problem>{MISSING}</Problem>;
  if (err) return <Problem>{err}</Problem>;

  if (annotate != null && blob) {
    return (
      <div className="flex h-full flex-col">
        <div className="tome-toolbar">
          <button className="tome-btn" onClick={() => setAnnotate(null)}><LayoutGrid className="h-4 w-4" /> All pages</button>
          <div className="tome-segment" role="group" aria-label="Annotation tool">
            {([["highlight", Highlighter, "Highlight"], ["ink", PenLine, "Draw"], ["note", StickyNote, "Note"], ["erase", Eraser, "Erase"]] as const).map(([t, Icon, label]) => (
              <button key={t} aria-pressed={tool === t} onClick={() => setTool(t)} title={label}><Icon className="h-4 w-4" /></button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <button className="tome-btn" disabled={annotate === 0} onClick={() => setAnnotate(annotate - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            <span className="tabular-nums">{annotate + 1} / {n}</span>
            <button className="tome-btn" disabled={annotate >= n - 1} onClick={() => setAnnotate(annotate + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <p className="px-4 pb-1 text-xs text-muted-foreground">Highlight by dragging a box, draw freely, or click to place a note. Annotations are saved with this book.</p>
        <div className="relative min-h-0 flex-1">
          <PdfView blob={blob} page={annotate} tool={tool} annotations={item.annotations}
            onAnnotations={(page, a) => {
              const next = { ...item, annotations: { ...(item.annotations ?? {}), [String(page)]: a } };
              putItem(next);
              onItem(next);
            }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="tome-toolbar">
        <span className="text-sm text-muted-foreground">{sel.size ? `${sel.size} selected` : `${n} pages · drag to reorder`}</span>
        <div className="flex flex-wrap items-center gap-1">
          <button className="tome-btn" disabled={!sel.size || !!busy} onClick={doRotate}><RotateCw className="h-4 w-4" /> Rotate</button>
          <button className="tome-btn" disabled={!sel.size || !!busy} onClick={doDelete}><Trash2 className="h-4 w-4" /> Delete</button>
          <button className="tome-btn" disabled={!!busy} onClick={() => pdfIn.current?.click()}><FilePlus2 className="h-4 w-4" /> Insert PDF</button>
          <button className="tome-btn" disabled={!!busy} onClick={() => imgIn.current?.click()}><ImagePlus className="h-4 w-4" /> Insert image</button>
          <button className="tome-btn" disabled={!n} onClick={() => setAnnotate(sel.size ? Math.min(...sel) : 0)}><Highlighter className="h-4 w-4" /> Annotate</button>
          {sel.size > 0 && <button className="tome-btn" onClick={() => setSel(new Set())} aria-label="Clear selection"><X className="h-4 w-4" /></button>}
        </div>
        <input ref={pdfIn} type="file" accept=".pdf" hidden onChange={(e) => {
          const f = e.target.files?.[0]; e.target.value = "";
          if (f) commit("Insert pages", async () => { const r = await insertPdf(blob!, f, insertAt); return { blob: r.blob, anns: shiftAnns(r.count) }; });
        }} />
        <input ref={imgIn} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => {
          const f = e.target.files?.[0]; e.target.value = "";
          if (f) commit("Insert image", async () => ({ blob: await insertImage(blob!, f, insertAt), anns: shiftAnns(1) }));
        }} />
      </div>
      {(busy || error) && <div className={`mx-4 mb-2 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>{error ?? `${busy}…`}</div>}
      <div className="tome-thumbs">
        {doc && [...Array(n).keys()].map((i) => (
          <button key={`${item.assetId}-${i}`} draggable
            className={`tome-thumb ${sel.has(i) ? "is-selected" : ""}`}
            onClick={() => setSel((s) => { const x = new Set(s); if (x.has(i)) x.delete(i); else x.add(i); return x; })}
            onDoubleClick={() => setAnnotate(i)}
            onDragStart={() => (drag.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
            aria-pressed={sel.has(i)} aria-label={`Page ${i + 1}`}>
            <PdfThumb doc={doc} index={i} />
            <span className="tome-thumb-num">{i + 1}{item.annotations?.[String(i)]?.length ? " ·" : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
