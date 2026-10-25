// Local-first storage for Tome. Uses IndexedDB (an embedded, transactional
// database on the user's machine). Nothing ever leaves the device.

export type Book = {
  id: string;
  title: string;
  coverId: string | null; // asset id of the original uploaded cover
  collection: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  openedAt: number | null;
  sample?: boolean | undefined;
};

export type BlockType = "text" | "image" | "audio" | "video";
export type Block = {
  id: string;
  type: BlockType;
  text?: string | undefined;
  assetId?: string | undefined;
  hash?: string | undefined;
  width?: "full" | "half" | undefined;
};

export type Ann = {
  id: string;
  type: "ink" | "highlight" | "note";
  x: number; // normalized 0..1 page coordinates
  y: number;
  w?: number | undefined;
  h?: number | undefined;
  points?: [number, number][] | undefined;
  text?: string | undefined;
  color: string;
};

export type ItemKind = "pdf" | "image" | "audio" | "video" | "text" | "markdown" | "docx" | "epub" | "page";

export type Item = {
  id: string;
  bookId: string;
  kind: ItemKind;
  title: string;
  order: number;
  assetId: string | null;
  hash?: string | undefined; // content hash, used to avoid duplicate copies
  mime?: string | undefined;
  blocks?: Block[] | undefined; // custom pages
  annotations?: Record<string, Ann[]> | undefined; // PDF: page index -> annotations
  createdAt: number;
};

const DB_NAME = "tome";
const DB_VERSION = 2; // bump + add a migration step below for schema changes

let dbPromise: Promise<IDBDatabase> | null = null;
function open(): Promise<IDBDatabase> {
  return (dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      const from = e.oldVersion;
      if (from < 1) {
        db.createObjectStore("books", { keyPath: "id" });
        db.createObjectStore("assets");
        db.createObjectStore("meta");
      }
      if (from < 2) {
        db.createObjectStore("items", { keyPath: "id" }).createIndex("bookId", "bookId");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  }));
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
    t.oncomplete = () => {
      if (mode === "readwrite") window.dispatchEvent(new Event("tome-saved"));
      resolve(result);
    };
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const uid = () => crypto.randomUUID();

// ---------- books ----------
export const listBooks = () => tx<Book[]>(["books"], "readonly", (t) => t.objectStore("books").getAll());
export const getBook = (id: string) =>
  tx<Book | undefined>(["books"], "readonly", (t) => t.objectStore("books").get(id));
export const putBook = (b: Book) =>
  tx(["books"], "readwrite", (t) => {
    t.objectStore("books").put({ ...b, updatedAt: Date.now() });
  });

export async function createBook(title: string, cover: Blob | null, extra: Partial<Book> = {}): Promise<Book> {
  const now = Date.now();
  const book: Book = {
    id: uid(),
    title: title.trim() || "Untitled",
    coverId: cover ? uid() : null,
    collection: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
    openedAt: null,
    ...extra,
  };
  await tx(["books", "assets"], "readwrite", (t) => {
    if (cover && book.coverId) t.objectStore("assets").put(cover, book.coverId);
    t.objectStore("books").put(book);
  });
  return book;
}

export async function replaceCover(book: Book, cover: Blob): Promise<Book> {
  const coverId = uid();
  const next = { ...book, coverId, updatedAt: Date.now() };
  await tx(["books", "assets"], "readwrite", (t) => {
    t.objectStore("assets").put(cover, coverId);
    if (book.coverId) t.objectStore("assets").delete(book.coverId);
    t.objectStore("books").put(next);
  });
  return next;
}

export async function deleteBook(book: Book) {
  const items = await listItems(book.id);
  const assets = new Set(items.flatMap(itemAssetIds));
  if (book.coverId) assets.add(book.coverId);
  await tx(["books", "assets", "items", "meta"], "readwrite", (t) => {
    assets.forEach((a) => t.objectStore("assets").delete(a));
    items.forEach((i) => t.objectStore("items").delete(i.id));
    t.objectStore("meta").delete(`pos:${book.id}`);
    t.objectStore("books").delete(book.id);
  });
}

// ---------- items ----------
export async function listItems(bookId: string): Promise<Item[]> {
  const all = await tx<Item[]>(["items"], "readonly", (t) =>
    t.objectStore("items").index("bookId").getAll(bookId),
  );
  return all.sort((a, b) => a.order - b.order);
}
export const putItem = (i: Item) =>
  tx(["items"], "readwrite", (t) => {
    t.objectStore("items").put(i);
  });
export const putItems = (items: Item[]) =>
  tx(["items"], "readwrite", (t) => {
    items.forEach((i) => t.objectStore("items").put(i));
  });

export function itemAssetIds(i: Item): string[] {
  const ids = [i.assetId, ...(i.blocks ?? []).map((b) => b.assetId)];
  return ids.filter((x): x is string => !!x);
}

/** Deletes assets that no item in the book references anymore. */
export async function releaseAssets(bookId: string, candidates: string[]) {
  if (!candidates.length) return;
  const items = await listItems(bookId);
  const used = new Set(items.flatMap(itemAssetIds));
  const orphans = candidates.filter((c) => !used.has(c));
  if (orphans.length) await deleteAssets(orphans);
}

export async function deleteItem(item: Item) {
  await tx(["items"], "readwrite", (t) => {
    t.objectStore("items").delete(item.id);
  });
  await releaseAssets(item.bookId, itemAssetIds(item));
}

// ---------- assets ----------
export async function putAsset(blob: Blob): Promise<string> {
  const id = uid();
  await tx(["assets"], "readwrite", (t) => {
    t.objectStore("assets").put(blob, id);
  });
  return id;
}
export const getAsset = (id: string) =>
  tx<Blob | undefined>(["assets"], "readonly", (t) => t.objectStore("assets").get(id));
export const deleteAssets = (ids: string[]) =>
  tx(["assets"], "readwrite", (t) => {
    ids.forEach((id) => t.objectStore("assets").delete(id));
  });

// ---------- meta (preferences, reading state) ----------
export const getMeta = <T>(key: string) =>
  tx<T | undefined>(["meta"], "readonly", (t) => t.objectStore("meta").get(key));
export const setMeta = (key: string, value: unknown) =>
  tx(["meta"], "readwrite", (t) => {
    t.objectStore("meta").put(value, key);
  });

/** Clear every Tome store together. Source files outside Tome are never accessed. */
export async function clearAppData() {
  await tx(["books", "items", "assets", "meta"], "readwrite", (t) => {
    for (const store of ["books", "items", "assets", "meta"]) t.objectStore(store).clear();
    // Keep the resulting library empty instead of re-importing the tour on restart.
    t.objectStore("meta").put(true, "welcomed");
  });
}

// ---------- library helpers ----------
export type SortKey = "recent" | "title" | "created";

export function sortAndFilter(books: Book[], query: string, sort: SortKey, collection: string | null = null): Book[] {
  const q = query.trim().toLowerCase();
  let filtered = q
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q)) ||
          (b.collection ?? "").toLowerCase().includes(q),
      )
    : books;
  if (collection) filtered = filtered.filter((b) => b.collection === collection);
  const s = [...filtered];
  if (sort === "title") s.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === "created") s.sort((a, b) => b.createdAt - a.createdAt);
  else s.sort((a, b) => (b.openedAt ?? b.createdAt) - (a.openedAt ?? a.createdAt));
  return s;
}

export function fallbackHue(title: string): number {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
