import { createBook, listBooks, putItems, uid, type Item } from "./tome-db";

const WELCOME_TEXT = `This is a Tome book. Everything you see lives on this computer — no accounts, no cloud, no tracking.

A book is a binder for your files. Press Edit (top right) to add PDFs, EPUBs, Word documents, pictures, music, videos, and notes. Imported files are copied into Tome, so your originals are never touched.`;

const IDEAS_TEXT = `Some things people bind into books:

• A trip — tickets as PDFs, photos, a voice memo, and a page of notes.
• A course — lecture slides, readings, and your own summary pages.
• A recipe collection — scanned cards, photos of the results, and variations.

Custom pages like this one mix text, images, audio and video in two widths. In Edit mode, hover a block to move it, resize it, or remove it.`;

/** Builds the "A Tour of Tome" sample book shown on first launch. Text-only, so it works fully offline. */
let seeding: Promise<void> | null = null;

export function seedSampleBook(): Promise<void> {
  // Idempotent: effects can fire twice in dev, never seed a second copy.
  return (seeding ??= seed());
}

async function seed(): Promise<void> {
  if ((await listBooks()).some((b) => b.sample)) return;
  const book = await createBook("A Tour of Tome", null, { sample: true, tags: ["welcome"] });
  const now = Date.now();
  const items: Item[] = [
    {
      id: uid(), bookId: book.id, kind: "page", title: "Welcome", order: 0, assetId: null, createdAt: now,
      blocks: [{ id: uid(), type: "text", text: WELCOME_TEXT, width: "full" }],
    },
    {
      id: uid(), bookId: book.id, kind: "page", title: "What to bind", order: 1, assetId: null, createdAt: now,
      blocks: [{ id: uid(), type: "text", text: IDEAS_TEXT, width: "full" }],
    },
  ];
  await putItems(items);
}
