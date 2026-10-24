// PDF page operations. Every operation returns a NEW blob; the caller stores it
// as a new managed asset, so nothing is edited in place.
import type { Ann } from "./tome-db";

const lib = () => import("pdf-lib");
const toBlob = (bytes: Uint8Array) => new Blob([bytes as BlobPart], { type: "application/pdf" });

let pdfjsP: Promise<typeof import("pdfjs-dist")> | null = null;
export function loadPdfjs() {
  return (pdfjsP ??= (async () => {
    const pdfjs = await import("pdfjs-dist");
    const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
    return pdfjs;
  })());
}

/** Rebuild the document with pages in `order` (old indices). Omitted pages are removed. */
export async function rebuild(blob: Blob, order: number[]): Promise<Blob> {
  const { PDFDocument } = await lib();
  const src = await PDFDocument.load(await blob.arrayBuffer());
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, order);
  pages.forEach((p) => out.addPage(p));
  return toBlob(await out.save());
}

export async function rotate(blob: Blob, indices: number[]): Promise<Blob> {
  const { PDFDocument, degrees } = await lib();
  const doc = await PDFDocument.load(await blob.arrayBuffer());
  indices.forEach((i) => {
    const p = doc.getPage(i);
    p.setRotation(degrees((p.getRotation().angle + 90) % 360));
  });
  return toBlob(await doc.save());
}

export async function insertPdf(blob: Blob, other: Blob, at: number): Promise<{ blob: Blob; count: number }> {
  const { PDFDocument } = await lib();
  const doc = await PDFDocument.load(await blob.arrayBuffer());
  const o = await PDFDocument.load(await other.arrayBuffer());
  const copied = await doc.copyPages(o, o.getPageIndices());
  copied.forEach((p, k) => doc.insertPage(at + k, p));
  return { blob: toBlob(await doc.save()), count: copied.length };
}

async function toPngBytes(img: Blob): Promise<Uint8Array> {
  const bmp = await createImageBitmap(img);
  const c = document.createElement("canvas");
  c.width = bmp.width;
  c.height = bmp.height;
  c.getContext("2d")!.drawImage(bmp, 0, 0);
  const b = await new Promise<Blob>((r) => c.toBlob((x) => r(x!), "image/png"));
  return new Uint8Array(await b.arrayBuffer());
}

export async function insertImage(blob: Blob | null, img: Blob, at: number): Promise<Blob> {
  const { PDFDocument } = await lib();
  const doc = blob ? await PDFDocument.load(await blob.arrayBuffer()) : await PDFDocument.create();
  const embedded =
    img.type === "image/jpeg"
      ? await doc.embedJpg(new Uint8Array(await img.arrayBuffer()))
      : await doc.embedPng(await toPngBytes(img));
  const s = Math.min(595 / embedded.width, 842 / embedded.height, 1);
  const w = embedded.width * s, h = embedded.height * s;
  const page = doc.insertPage(at, [w, h]);
  page.drawImage(embedded, { x: 0, y: 0, width: w, height: h });
  return toBlob(await doc.save());
}

/** Annotations follow their pages when pages are reordered, removed or inserted. */
export function remapAnnotations(
  anns: Record<string, Ann[]> | undefined,
  order: (number | null)[],
): Record<string, Ann[]> {
  const out: Record<string, Ann[]> = {};
  order.forEach((old, idx) => {
    const list = old == null ? undefined : anns?.[String(old)];
    if (list?.length) out[String(idx)] = list;
  });
  return out;
}

/** Rotate normalized annotation coordinates 90° clockwise along with the page. */
export function rotateAnns(list: Ann[]): Ann[] {
  return list.map((a) => {
    if (a.type === "highlight") {
      const w = a.w ?? 0, h = a.h ?? 0;
      return { ...a, x: 1 - (a.y + h), y: a.x, w: h, h: w };
    }
    return {
      ...a,
      x: 1 - a.y,
      y: a.x,
      points: a.points?.map(([x, y]) => [1 - y, x] as [number, number]),
    };
  });
}
