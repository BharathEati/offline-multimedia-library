import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Search, Trash2, ImageUp, LayoutGrid, Library as Shelf } from "lucide-react";
import {
  createBook, deleteBook, getMeta, listBooks, putBook, replaceCover, setMeta, sortAndFilter,
  type Book, type SortKey,
} from "@/lib/tome-db";
import { BookCover } from "./BookCover";
import { WelcomeLetter } from "./WelcomeLetter";
import { seedSampleBook } from "@/lib/sample";
import { AppSettings } from "./AppSettings";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n;
  let u = -1;
  do { v /= 1024; u++; } while (v >= 1024 && u < units.length - 1);
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[u]}`;
}

function StorageFootnote() {
  const [est, setEst] = useState<{ usage: number; quota: number } | null>(null);
  useEffect(() => {
    let live = true;
    const read = () => navigator.storage?.estimate?.().then((e) => {
      if (live && e && e.quota) setEst({ usage: e.usage ?? 0, quota: e.quota });
    }).catch(() => {});
    read();
    window.addEventListener("tome-saved", read);
    return () => { live = false; window.removeEventListener("tome-saved", read); };
  }, []);
  if (!est) return null;
  const pct = Math.min(100, Math.round((est.usage / est.quota) * 100));
  return (
    <footer className="mx-auto max-w-6xl px-6 pb-10">
      <p className="tome-db">Tome is using {formatBytes(est.usage)} of about {formatBytes(est.quota)} available on this device ({pct}%). Everything is stored locally.</p>
    </footer>
  );
}

export function Library() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<"grid" | "shelf">("grid");
  const [creating, setCreating] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [selected, setSelected] = useState<Book | null>(null);
  const [saved, setSaved] = useState(false);

  const refresh = () => listBooks().then(setBooks);
  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 1200); };

  useEffect(() => {
    getMeta<boolean>("welcomed").then(async (w) => {
      if (!w) {
        await seedSampleBook();
        setWelcome(true);
      }
      refresh();
    });
    getMeta<"grid" | "shelf">("view").then((v) => v && setView(v));
  }, []);

  const shown = useMemo(() => (books ? sortAndFilter(books, query, sort) : []), [books, query, sort]);

  const changeView = (v: "grid" | "shelf") => { setView(v); setMeta("view", v); };

  return (
    <div className="min-h-screen">
      <header className="tome-header">
        <span className="tome-wordmark">Tome</span>
        <div className="tome-search">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search books, tags, collections" aria-label="Search" />
        </div>
        <div className="flex items-center gap-2">
          <AppSettings />
          <span className={`tome-saved ${saved ? "opacity-100" : "opacity-0"}`}>Saved</span>
          <button className="tome-btn tome-btn-primary" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New book
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="tome-display">Library</h1>
            <p className="mt-1 text-sm text-muted-foreground">{books ? `${books.length} ${books.length === 1 ? "book" : "books"}` : " "}</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="tome-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
              <option value="recent">Recently opened</option>
              <option value="title">Title</option>
              <option value="created">Date created</option>
            </select>
            <div className="tome-segment" role="group" aria-label="View">
              <button aria-pressed={view === "grid"} onClick={() => changeView("grid")} title="Grid"><LayoutGrid className="h-4 w-4" /></button>
              <button aria-pressed={view === "shelf"} onClick={() => changeView("shelf")} title="Bookshelf"><Shelf className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {books && books.length === 0 && (
          <div className="tome-empty">
            <p className="tome-reading text-xl">Your shelf is waiting.</p>
            <p className="mt-2 text-sm text-muted-foreground">Create a book, give it a cover, and bind your files together.</p>
            <button className="tome-btn tome-btn-primary mt-6" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Create your first book</button>
          </div>
        )}

        {view === "grid" ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {shown.map((b) => (
              <button key={b.id} className="tome-grid-item text-left" onClick={() => setSelected(b)}>
                <BookCover book={b} className="tome-cover-hover" />
                <div className="mt-3 truncate text-sm font-medium">{b.title}</div>
                <div className="text-xs text-muted-foreground">{b.openedAt ? "Opened " + new Date(b.openedAt).toLocaleDateString() : "Never opened"}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="tome-shelf">
            <div className="tome-shelf-row">
              {shown.map((b) => (
                <button key={b.id} className="tome-book3d" onClick={() => setSelected(b)} aria-label={b.title}>
                  <BookCover book={b} className="tome-book3d-front" />
                  <span className="tome-book3d-pages" />
                </button>
              ))}
            </div>
            <div className="tome-shelf-plank" />
          </div>
        )}
      </main>

      <StorageFootnote />

      {creating && <CreateDialog onClose={() => setCreating(false)} onCreate={async (t, c) => { await createBook(t, c); setCreating(false); refresh(); flashSaved(); }} />}
      {selected && (
        <BookSheet
          book={selected}
          onClose={() => setSelected(null)}
          onChange={async (b) => { setSelected(b); await refresh(); flashSaved(); }}
          onDeleted={async () => { setSelected(null); await refresh(); }}
        />
      )}
      {welcome && <WelcomeLetter onClose={() => { setWelcome(false); setMeta("welcomed", true); }} />}
    </div>
  );
}

function CreateDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (t: string, c: File | null) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!cover) return; const u = URL.createObjectURL(cover); setPreview(u); return () => URL.revokeObjectURL(u); }, [cover]);

  return (
    <div className="tome-overlay" onClick={onClose}>
      <form className="tome-dialog" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onCreate(title, cover); }}>
        <h2 className="text-lg font-semibold">New book</h2>
        <div className="mt-5 flex gap-5">
          <button type="button" className="tome-cover-pick" onClick={() => fileRef.current?.click()}>
            {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <><ImageUp className="h-5 w-5" /><span className="text-xs">Add cover</span></>}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
          <label className="flex-1">
            <span className="text-xs font-medium text-muted-foreground">Title</span>
            <input autoFocus className="tome-input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled" />
            <p className="mt-3 text-xs text-muted-foreground">Covers are optional — Tome will design one for you.</p>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="tome-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="tome-btn tome-btn-primary">Create</button>
        </div>
      </form>
    </div>
  );
}

function BookSheet({ book, onClose, onChange, onDeleted }: { book: Book; onClose: () => void; onChange: (b: Book) => void; onDeleted: () => void }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(book.title);
  const [tags, setTags] = useState(book.tags.join(", "));
  const [collection, setCollection] = useState(book.collection ?? "");
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-save edits after a short pause.
  useEffect(() => {
    const t = setTimeout(async () => {
      const next: Book = { ...book, title: title.trim() || "Untitled", collection: collection.trim() || null, tags: tags.split(",").map((s) => s.trim()).filter(Boolean) };
      if (next.title !== book.title || next.collection !== book.collection || next.tags.join() !== book.tags.join()) {
        await putBook(next); onChange(next);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [title, tags, collection]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tome-overlay" onClick={onClose}>
      <div className="tome-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-6">
          <div className="w-32 shrink-0">
            <BookCover book={book} />
            <button className="tome-btn mt-3 w-full justify-center text-xs" onClick={() => fileRef.current?.click()}><ImageUp className="h-3.5 w-3.5" /> Replace cover</button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) onChange(await replaceCover(book, f)); }} />
          </div>
          <div className="flex-1 space-y-3">
            <label className="block"><span className="text-xs font-medium text-muted-foreground">Title</span><input className="tome-input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label className="block"><span className="text-xs font-medium text-muted-foreground">Collection</span><input className="tome-input mt-1" value={collection} onChange={(e) => setCollection(e.target.value)} placeholder="e.g. Research" /></label>
            <label className="block"><span className="text-xs font-medium text-muted-foreground">Tags</span><input className="tome-input mt-1" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated" /></label>
            <button className="tome-btn tome-btn-primary w-full justify-center" onClick={async () => { await putBook({ ...book, openedAt: Date.now() }); onClose(); navigate({ to: "/book/$id", params: { id: book.id } }); }}>
              Open
            </button>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          {confirm ? (
            <div className="flex items-center gap-2 text-sm">
              <span>Delete this book and its cover from Tome? Your original files are untouched.</span>
              <button className="tome-btn tome-btn-danger" onClick={async () => { await deleteBook(book); onDeleted(); }}>Delete</button>
              <button className="tome-btn" onClick={() => setConfirm(false)}>Keep</button>
            </div>
          ) : (
            <button className="tome-btn text-destructive" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Delete book</button>
          )}
          {!confirm && <button className="tome-btn" onClick={onClose}>Done</button>}
        </div>
      </div>
    </div>
  );
}
