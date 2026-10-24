import { putAsset, putItems, uid, type Item, type ItemKind } from "./tome-db";

const EXT: Record<string, ItemKind> = {
  pdf: "pdf",
  jpg: "image", jpeg: "image", png: "image", webp: "image", gif: "image",
  mp3: "audio", wav: "audio", m4a: "audio", aac: "audio", ogg: "audio", oga: "audio", flac: "audio",
  mp4: "video", m4v: "video", webm: "video", mov: "video", ogv: "video",
  txt: "text",
  md: "markdown", markdown: "markdown",
  docx: "docx",
  epub: "epub",
};

export const ACCEPT = Object.keys(EXT).map((e) => "." + e).join(",");

export function detectKind(name: string): ItemKind | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT[ext] ?? null;
}

export function cleanTitle(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  // eslint-disable-next-line no-control-regex
  const clean = base.replace(/[\u0000-\u001f<>:"/\\|?*]+/g, " ").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  return clean.slice(0, 120) || "Untitled";
}

export async function sha256(blob: Blob): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Quick signature check so obviously corrupted files are rejected early. */
async function looksValid(file: Blob, kind: ItemKind): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const s = String.fromCharCode(...head);
  if (kind === "pdf") return s.startsWith("%PDF");
  if (kind === "docx" || kind === "epub") return s.startsWith("PK");
  return file.size > 0;
}

export type KnownAsset = { hash?: string | undefined; assetId?: string | null | undefined };

export function knownAssets(items: Item[]): KnownAsset[] {
  return items.flatMap((i) => [{ hash: i.hash, assetId: i.assetId }, ...(i.blocks ?? [])]);
}

/** Copies a file into the managed library, reusing an identical copy in the same book. */
export async function storeFile(file: Blob, known: KnownAsset[]): Promise<{ assetId: string; hash: string }> {
  const hash = await sha256(file);
  const existing = known.find((k) => k.hash === hash && k.assetId);
  if (existing?.assetId) return { assetId: existing.assetId, hash };
  // Copy the bytes so the managed asset never depends on the original file.
  const copy = new Blob([await file.arrayBuffer()], { type: file.type });
  return { assetId: await putAsset(copy), hash };
}

export function friendlyError(e: unknown): string {
  const name = (e as { name?: string })?.name;
  if (name === "QuotaExceededError") return "There isn't enough storage space left. Free some space and try again.";
  return (e as Error)?.message || "Something went wrong.";
}

export async function importFiles(
  bookId: string,
  files: File[],
  existing: Item[],
  onProgress: (done: number, total: number, name: string) => void,
): Promise<{ added: Item[]; errors: string[] }> {
  const added: Item[] = [];
  const errors: string[] = [];
  const known = knownAssets(existing);
  let order = existing.length;
  for (let i = 0; i < files.length; i++) {
    const f = files[i]!;
    onProgress(i, files.length, f.name);
    const kind = detectKind(f.name);
    if (!kind) {
      errors.push(`${f.name}: this file type isn't supported.`);
      continue;
    }
    try {
      if (!(await looksValid(f, kind))) {
        errors.push(`${f.name}: the file looks damaged or isn't really a ${kind.toUpperCase()}.`);
        continue;
      }
      const { assetId, hash } = await storeFile(f, known);
      known.push({ hash, assetId });
      const item: Item = {
        id: uid(), bookId, kind, title: cleanTitle(f.name), order: order++,
        assetId, hash, mime: f.type, createdAt: Date.now(),
      };
      await putItems([item]); // each file is saved as soon as it is copied
      added.push(item);
    } catch (e) {
      errors.push(`${f.name}: ${friendlyError(e)}`);
    }
  }
  onProgress(files.length, files.length, "");
  return { added, errors };
}
