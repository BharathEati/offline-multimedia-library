// Local-first storage for Tome. Uses the browser's IndexedDB (an embedded
// database on the user's machine). Nothing leaves the device.

export type Book = {
  id: string;
  title: string;
  coverId: string | null; // asset id of the original uploaded cover
  collection: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  openedAt: number | null;
};

const DB_NAME = "tome";
const DB_VERSION = 1; // bump + add a migration step below for schema changes

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      const from = e.oldVersion;
      if (from < 1) {
        db.createObjectStore("books", { keyPath: "id" });
        db.createObjectStore("assets"); // key: asset id, value: Blob
        db.createObjectStore("meta");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(
  stores: string[],
  mode: IDBTransactionMode,
  fn: (t: IDBTransaction) => IDBRequest<T> | void,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    let result: T;
    const r = fn(t);
    if (r) r.onsuccess = () => (result = r.result);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const listBooks = () =>
  tx<Book[]>(["books"], "readonly", (t) => t.objectStore("books").getAll());

export const putBook = (b: Book) =>
  tx(["books"], "readwrite", (t) => {
    t.objectStore("books").put({ ...b, updatedAt: Date.now() });
  });

export async function createBook(title: string, cover: Blob | null): Promise<Book> {
  const now = Date.now();
  const book: Book = {
    id: crypto.randomUUID(),
    title: title.trim() || "Untitled",
    coverId: cover ? crypto.randomUUID() : null,
    collection: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
    openedAt: null,
  };
  // Atomic: book + cover saved together or not at all.
  await tx(["books", "assets"], "readwrite", (t) => {
    if (cover && book.coverId) t.objectStore("assets").put(cover, book.coverId);
    t.objectStore("books").put(book);
  });
  return book;
}

export async function replaceCover(book: Book, cover: Blob): Promise<Book> {
  const next = { ...book, coverId: crypto.randomUUID(), updatedAt: Date.now() };
  await tx(["books", "assets"], "readwrite", (t) => {
    t.objectStore("assets").put(cover, next.coverId!);
    if (book.coverId) t.objectStore("assets").delete(book.coverId);
    t.objectStore("books").put(next);
  });
  return next;
}

export const deleteBook = (book: Book) =>
  tx(["books", "assets"], "readwrite", (t) => {
    if (book.coverId) t.objectStore("assets").delete(book.coverId);
    t.objectStore("books").delete(book.id);
  });

export const getAsset = (id: string) =>
  tx<Blob | undefined>(["assets"], "readonly", (t) => t.objectStore("assets").get(id));

export const getMeta = <T>(key: string) =>
  tx<T | undefined>(["meta"], "readonly", (t) => t.objectStore("meta").get(key));

export const setMeta = (key: string, value: unknown) =>
  tx(["meta"], "readwrite", (t) => {
    t.objectStore("meta").put(value, key);
  });

export type SortKey = "recent" | "title" | "created";

export function sortAndFilter(books: Book[], query: string, sort: SortKey): Book[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q)) ||
          (b.collection ?? "").toLowerCase().includes(q),
      )
    : books;
  const s = [...filtered];
  if (sort === "title") s.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === "created") s.sort((a, b) => b.createdAt - a.createdAt);
  else s.sort((a, b) => (b.openedAt ?? b.createdAt) - (a.openedAt ?? a.createdAt));
  return s;
}

// Deterministic generated cover palette from the title.
export function fallbackHue(title: string): number {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
