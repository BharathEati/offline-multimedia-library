import { describe, it, expect } from "vitest";
import { sortAndFilter, type Book } from "./tome-db";

const b = (id: string, title: string, createdAt: number, openedAt: number | null, tags: string[] = []): Book => ({
  id, title, coverId: null, collection: null, tags, createdAt, updatedAt: createdAt, openedAt,
});
const books = [b("1", "Zebra", 1, null), b("2", "Apple", 3, null, ["fruit"]), b("3", "Mango", 2, 10)];

describe("library sort & search", () => {
  it("sorts by title", () => expect(sortAndFilter(books, "", "title").map((x) => x.id)).toEqual(["2", "3", "1"]));
  it("sorts by created, newest first", () => expect(sortAndFilter(books, "", "created").map((x) => x.id)).toEqual(["2", "3", "1"]));
  it("recently opened comes first", () => expect(sortAndFilter(books, "", "recent")[0].id).toBe("3"));
  it("searches tags", () => expect(sortAndFilter(books, "fruit", "title").map((x) => x.id)).toEqual(["2"]));
});
