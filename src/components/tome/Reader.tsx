import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Pencil, Plus } from "lucide-react";
import { getMeta, setMeta, type Book, type Item } from "@/lib/tome-db";
import { MISSING, Problem, useAssetBlob, type Nav, type NavRef } from "./views/shared";
import { PdfView } from "./views/PdfView";
import { DocxView, EpubView, ImageView, MediaView, PageView, TextView } from "./views/DocViews";
import { SavedBadge } from "./SavedBadge";

export function Reader({ book, items, onEdit }: { book: Book; items: Item[]; onEdit: () => void }) {
  const [index, setIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [info, setInfo] = useState("");
  const dir = useRef<"next" | "prev">("next");
  const nav = useRef<Nav | null>(null);

  useEffect(() => {
    getMeta<{ itemId: string }>(`pos:${book.id}`).then((p) => {
      const i = items.findIndex((x) => x.id === p?.itemId);
      setIndex(i >= 0 ? i : 0);
    });
    getMeta<number>(`zoom:${book.id}`).then((z) => z && setZoom(z));
  }, [book.id, items]);

  const item = index != null ? items[index] : undefined;
  useEffect(() => {
    if (item) setMeta(`pos:${book.id}`, { itemId: item.id });
    setInfo("");
  }, [item, book.id]);

  const changeZoom = (z: number) => {
    const v = Math.min(3, Math.max(0.5, Math.round(z * 100) / 100));
    setZoom(v);
    setMeta(`zoom:${book.id}`, v);
  };

  const go = useCallback(
    (d: "next" | "prev") => {
      dir.current = d;
      if (d === "next" ? nav.current?.next() : nav.current?.prev()) return;
      setIndex((i) => {
        if (i == null) return i;
        const n = d === "next" ? i + 1 : i - 1;
        return n < 0 || n >= items.length ? i : n;
      });
    },
    [items.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,select,audio,video,[contenteditable=true]")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go("next"); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go("prev"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const atStart = index === 0 && !info.startsWith("Page") ;
  const zoomable = item?.kind === "pdf" || item?.kind === "image";

  return (
    <div className="tome-reader">
      <header className="tome-reader-bar">
        <Link to="/" className="tome-btn" aria-label="Back to library"><ArrowLeft className="h-4 w-4" /> Library</Link>
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-sm font-medium">{book.title}</span>
          {items.length > 1 && index != null && (
            <select className="tome-select max-w-56" aria-label="Contents" value={index}
              onChange={(e) => { const n = Number(e.target.value); dir.current = n > index ? "next" : "prev"; setIndex(n); }}>
              {items.map((it, i) => <option key={it.id} value={i}>{i + 1}. {it.title}</option>)}
            </select>
          )}
        </div>
        <div className="flex items-center gap-1">
          <SavedBadge />
          {zoomable && (
            <div className="tome-segment">
              <button onClick={() => changeZoom(zoom - 0.25)} aria-label="Zoom out"><Minus className="h-3.5 w-3.5" /></button>
              <button onClick={() => changeZoom(1)} className="text-xs tabular-nums" aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
              <button onClick={() => changeZoom(zoom + 0.25)} aria-label="Zoom in"><Plus className="h-3.5 w-3.5" /></button>
            </div>
          )}
          <button className="tome-btn tome-btn-primary" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Edit</button>
        </div>
      </header>

      <main className="tome-reader-stage">
        {items.length === 0 ? (
          <div className="tome-empty m-auto max-w-md">
            <p className="tome-reading text-xl">This book has no pages yet.</p>
            <button className="tome-btn tome-btn-primary mt-5" onClick={onEdit}>Add content</button>
          </div>
        ) : item ? (
          <div key={item.id} className={`tome-item tome-turn-${dir.current}`}>
            <ItemView item={item} nav={nav} zoom={zoom} onInfo={setInfo} />
          </div>
        ) : null}
        {items.length > 0 && (
          <>
            <button className="tome-side tome-side-left" onClick={() => go("prev")} disabled={atStart} aria-label="Previous"><ChevronLeft className="h-5 w-5" /></button>
            <button className="tome-side tome-side-right" onClick={() => go("next")} aria-label="Next"><ChevronRight className="h-5 w-5" /></button>
          </>
        )}
      </main>

      {item && (
        <footer className="tome-reader-foot">
          {item.title} · {index! + 1} of {items.length}{info && ` · ${info}`}
        </footer>
      )}
    </div>
  );
}

function ItemView({ item, nav, zoom, onInfo }: { item: Item; nav: NavRef; zoom: number; onInfo: (s: string) => void }) {
  switch (item.kind) {
    case "pdf": return <PdfReader item={item} nav={nav} zoom={zoom} onInfo={onInfo} />;
    case "image": return <ImageView item={item} zoom={zoom} />;
    case "audio":
    case "video": return <MediaView item={item} />;
    case "text":
    case "markdown": return <TextView item={item} />;
    case "docx": return <DocxView item={item} />;
    case "epub": return <EpubView item={item} nav={nav} />;
    case "page": return <PageView item={item} />;
  }
}

function PdfReader({ item, nav, zoom, onInfo }: { item: Item; nav: NavRef; zoom: number; onInfo: (s: string) => void }) {
  const { blob, missing } = useAssetBlob(item.assetId);
  const [page, setPage] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const st = useRef({ page: 0, count: 0 });
  st.current = { page: page ?? 0, count };

  useEffect(() => {
    getMeta<number>(`page:${item.id}`).then((p) => setPage(p ?? 0));
  }, [item.id]);
  useEffect(() => {
    if (page == null) return;
    if (count && page >= count) return setPage(count - 1);
    setMeta(`page:${item.id}`, page);
    onInfo(`Page ${page + 1} of ${count || "…"}`);
  }, [page, count]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    nav.current = {
      next: () => { const { page, count } = st.current; if (page < count - 1) { setPage(page + 1); return true; } return false; },
      prev: () => { if (st.current.page > 0) { setPage(st.current.page - 1); return true; } return false; },
    };
    return () => { nav.current = null; };
  }, [nav]);

  if (missing) return <Problem>{MISSING}</Problem>;
  if (!blob || page == null) return <div className="tome-loading m-auto" />;
  return <PdfView blob={blob} page={page} zoom={zoom} onCount={setCount} annotations={item.annotations} />;
}
