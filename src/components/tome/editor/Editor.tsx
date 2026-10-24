import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, FileText, FileType, GripVertical, Image, ImageUp, Music, NotebookText, Plus, Trash2, Upload, Video, FileCode2, ArrowUp, ArrowDown } from "lucide-react";
import { deleteItem, putBook, putItem, putItems, replaceCover, uid, type Book, type Item, type ItemKind } from "@/lib/tome-db";
import { ACCEPT, importFiles } from "@/lib/import";
import { BookCover } from "../BookCover";
import { SavedBadge } from "../SavedBadge";
import { PdfEditor } from "./PdfEditor";
import { PageEditor } from "./PageEditor";
import { DocxView, EpubView, ImageView, MediaView, TextView } from "../views/DocViews";
import type { Nav } from "../views/shared";

const ICON: Record<ItemKind, typeof FileText> = {
  pdf: FileText, image: Image, audio: Music, video: Video, text: FileType, markdown: FileCode2, docx: FileText, epub: BookOpen, page: NotebookText,
};
const LABEL: Record<ItemKind, string> = {
  pdf: "PDF", image: "Image", audio: "Audio", video: "Video", text: "Text", markdown: "Markdown", docx: "Word", epub: "EPUB", page: "Custom page",
};

export function Editor({ book, items, onBook, setItems, onRead }: {
  book: Book; items: Item[]; onBook: (b: Book) => void; setItems: (i: Item[]) => void; onRead: () => void;
}) {
  const [selId, setSelId] = useState<string | null>(items[0]?.id ?? null);
  const [title, setTitle] = useState(book.title);
  const [progress, setProgress] = useState<{ done: number; total: number; name: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const fileIn = useRef<HTMLInputElement>(null);
  const coverIn = useRef<HTMLInputElement>(null);
  const drag = useRef<number | null>(null);
  const navDummy = useRef<Nav | null>(null);
  const sel = items.find((i) => i.id === selId);

  useEffect(() => {
    const t = setTimeout(() => {
      const v = title.trim() || "Untitled";
      if (v !== book.title) { const b = { ...book, title: v }; putBook(b); onBook(b); }
    }, 500);
    return () => clearTimeout(t);
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateItem = (it: Item) => setItems(items.map((x) => (x.id === it.id ? it : x)));
  const saveOrder = async (next: Item[]) => {
    const ordered = next.map((it, i) => ({ ...it, order: i }));
    setItems(ordered);
    await putItems(ordered);
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m!);
    saveOrder(next);
  };

  const onFiles = async (files: File[]) => {
    if (!files.length) return;
    setErrors([]);
    setProgress({ done: 0, total: files.length, name: "" });
    const { added, errors } = await importFiles(book.id, files, items, (done, total, name) => setProgress({ done, total, name }));
    setProgress(null);
    setErrors(errors);
    if (added.length) { setItems([...items, ...added]); setSelId(added[0]!.id); }
  };

  const newPage = async () => {
    const it: Item = { id: uid(), bookId: book.id, kind: "page", title: "Untitled page", order: items.length, assetId: null, blocks: [{ id: uid(), type: "text", text: "", width: "full" }], createdAt: Date.now() };
    await putItem(it);
    setItems([...items, it]);
    setSelId(it.id);
  };

  return (
    <div className="tome-editor">
      <aside className="tome-editor-side"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); onFiles([...e.dataTransfer.files]); } }}>
        <div className="flex items-center justify-between">
          <Link to="/" className="tome-btn -ml-2" aria-label="Back to library"><ArrowLeft className="h-4 w-4" /> Library</Link>
          <SavedBadge />
        </div>
        <div className="mt-4 flex gap-3">
          <button className="w-16 shrink-0" onClick={() => coverIn.current?.click()} title="Replace cover" aria-label="Replace cover">
            <BookCover book={book} />
          </button>
          <input ref={coverIn} type="file" accept="image/jpeg,image/png,image/webp" hidden
            onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onBook(await replaceCover(book, f)); }} />
          <div className="min-w-0 flex-1">
            <input className="tome-title-input" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Book title" />
            <button className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => coverIn.current?.click()}>
              <ImageUp className="h-3 w-3" /> Change cover
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="tome-btn tome-btn-primary justify-center" onClick={() => fileIn.current?.click()} disabled={!!progress}><Upload className="h-4 w-4" /> Import</button>
          <button className="tome-btn tome-btn-outline justify-center" onClick={newPage}><Plus className="h-4 w-4" /> New page</button>
        </div>
        <input ref={fileIn} type="file" multiple accept={ACCEPT} hidden onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; onFiles(f); }} />
        {progress && (
          <div className="mt-3">
            <div className="tome-progress"><span style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
            <p className="mt-1 truncate text-xs text-muted-foreground">Copying {progress.name} ({progress.done + 1}/{progress.total})</p>
          </div>
        )}
        {errors.length > 0 && (
          <ul className="tome-errors">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
            <button className="mt-1 text-xs underline" onClick={() => setErrors([])}>Dismiss</button>
          </ul>
        )}

        <p className="mt-6 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Contents</p>
        {items.length === 0 && <p className="text-sm text-muted-foreground">Import files or drop them here. PDF, EPUB, Word, images, audio, video, text and Markdown are supported.</p>}
        <ol className="space-y-1">
          {items.map((it, i) => {
            const Icon = ICON[it.kind];
            return (
              <li key={it.id} draggable onDragStart={() => (drag.current = i)} onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { if (drag.current != null) { e.stopPropagation(); move(drag.current, i); drag.current = null; } }}
                className={`tome-list-item ${it.id === selId ? "is-active" : ""}`}>
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setSelId(it.id)}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate text-sm">{it.title}</span>
                </button>
                <span className="tome-list-actions">
                  <button onClick={() => move(i, i - 1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => move(i, i + 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                </span>
              </li>
            );
          })}
        </ol>
      </aside>

      <section className="tome-editor-main">
        <div className="tome-editor-head">
          {sel ? (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="tome-chip">{LABEL[sel.kind]}</span>
              <input className="tome-title-input flex-1" value={sel.title} aria-label="Item title"
                onChange={(e) => { const it = { ...sel, title: e.target.value }; updateItem(it); putItem(it); }} />
              {confirmDel === sel.id ? (
                <span className="flex items-center gap-2 text-sm">
                  Remove from this book?
                  <button className="tome-btn tome-btn-danger" onClick={async () => {
                    await deleteItem(sel);
                    const rest = items.filter((x) => x.id !== sel.id);
                    await saveOrder(rest);
                    setSelId(rest[0]?.id ?? null);
                    setConfirmDel(null);
                  }}>Remove</button>
                  <button className="tome-btn" onClick={() => setConfirmDel(null)}>Keep</button>
                </span>
              ) : (
                <button className="tome-btn text-destructive" onClick={() => setConfirmDel(sel.id)}><Trash2 className="h-4 w-4" /> Remove</button>
              )}
            </div>
          ) : <span className="text-sm text-muted-foreground">Nothing selected</span>}
          <button className="tome-btn tome-btn-primary" onClick={onRead}><BookOpen className="h-4 w-4" /> Read</button>
        </div>
        <div className="tome-editor-body">
          {!sel ? (
            <div className="tome-empty m-auto max-w-md">
              <p className="tome-reading text-xl">Start filling your book.</p>
              <p className="mt-2 text-sm text-muted-foreground">Import files, or create a page that mixes text, pictures and recordings.</p>
            </div>
          ) : sel.kind === "pdf" ? (
            <PdfEditor key={sel.id} item={sel} onItem={updateItem} />
          ) : sel.kind === "page" ? (
            <PageEditor key={sel.id} item={sel} allItems={items} onItem={updateItem} />
          ) : (
            <div className="flex h-full flex-col">
              <p className="px-6 pt-3 text-xs text-muted-foreground">Preview. Imported {LABEL[sel.kind]} files are read-only in Tome — you can rename, reorder or remove them.</p>
              <div className="relative min-h-0 flex-1">
                {sel.kind === "image" ? <ImageView item={sel} zoom={1} />
                  : sel.kind === "audio" || sel.kind === "video" ? <MediaView item={sel} />
                  : sel.kind === "docx" ? <DocxView item={sel} />
                  : sel.kind === "epub" ? <EpubView item={sel} nav={navDummy} />
                  : <TextView item={sel} />}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
