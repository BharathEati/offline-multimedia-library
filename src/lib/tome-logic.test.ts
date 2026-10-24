import { describe, it, expect } from "vitest";
import { detectKind, cleanTitle } from "./import";
import { remapAnnotations, rotateAnns } from "./pdf-ops";
import type { Ann } from "./tome-db";

describe("import format detection", () => {
  it("recognises every v1 format", () => {
    expect(detectKind("a.PDF")).toBe("pdf");
    expect(detectKind("a.jpeg")).toBe("image");
    expect(detectKind("a.webp")).toBe("image");
    expect(detectKind("a.m4a")).toBe("audio");
    expect(detectKind("a.wav")).toBe("audio");
    expect(detectKind("a.webm")).toBe("video");
    expect(detectKind("a.txt")).toBe("text");
    expect(detectKind("a.md")).toBe("markdown");
    expect(detectKind("a.docx")).toBe("docx");
    expect(detectKind("a.epub")).toBe("epub");
  });
  it("rejects unsupported files", () => expect(detectKind("a.exe")).toBeNull());
  it("sanitizes titles", () => expect(cleanTitle('my:bad/<file>_name.pdf')).toBe("my bad file name"));
});

const note = (id: string): Ann => ({ id, type: "note", x: 0.25, y: 0.1, color: "x" });

describe("PDF annotations follow pages", () => {
  it("moves with reorder and drops deleted pages", () => {
    const out = remapAnnotations({ "0": [note("a")], "2": [note("c")] }, [2, null, 1]);
    expect(out["0"]?.[0]?.id).toBe("c");
    expect(out["1"]).toBeUndefined();
    expect(Object.keys(out)).toEqual(["0"]);
  });
  it("rotates coordinates clockwise", () => {
    const [r] = rotateAnns([note("a")]);
    expect(r?.x).toBeCloseTo(0.9);
    expect(r?.y).toBeCloseTo(0.25);
  });
});
