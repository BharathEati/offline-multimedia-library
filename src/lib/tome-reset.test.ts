import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { clearAppData, createBook, getAsset, getMeta, listBooks, listItems, putAsset, putItem, setMeta } from "./tome-db";

it("deletes all managed content and preferences while preserving the source blob", async () => {
  const source = new Blob(["original source"], { type: "text/plain" });
  const book = await createBook("Delete test", source);
  const assetId = await putAsset(source);
  await putItem({ id: "reset-item", bookId: book.id, kind: "text", title: "Note", order: 0, assetId, createdAt: 1 });
  await setMeta("theme", "dark");
  await setMeta("pos:test", 7);
  await clearAppData();
  expect(await listBooks()).toEqual([]);
  expect(await listItems(book.id)).toEqual([]);
  expect(await getAsset(assetId)).toBeUndefined();
  if (book.coverId) expect(await getAsset(book.coverId)).toBeUndefined();
  expect(await getMeta("theme")).toBeUndefined();
  expect(await getMeta("pos:test")).toBeUndefined();
  expect(source.size).toBe(15);
  expect(await getMeta("welcomed")).toBe(true);
});

it("persists both requested appearance modes", async () => {
  await setMeta("theme", "dark");
  expect(await getMeta("theme")).toBe("dark");
  await setMeta("theme", "light");
  expect(await getMeta("theme")).toBe("light");
});