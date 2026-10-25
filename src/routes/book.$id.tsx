import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getBook, listItems, putBook, type Book, type Item } from "@/lib/tome-db";
import { Reader } from "@/components/tome/Reader";
import { Editor } from "@/components/tome/editor/Editor";

export const Route = createFileRoute("/book/$id")({
  ssr: false, // books live in on-device storage
  head: () => ({
    meta: [
      { title: "Book — Tome" },
      { name: "description", content: "Read and edit a multimedia book in Tome." },
      { property: "og:title", content: "Book — Tome" },
      { property: "og:description", content: "A personal multimedia book, stored locally in Tome." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookPage,
});

export function BookPage() {
  const { id } = Route.useParams();
  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<"read" | "edit">("read");

  useEffect(() => {
    (async () => {
      const b = await getBook(id);
      if (!b) return setBook(null);
      const opened = { ...b, openedAt: Date.now() };
      await putBook(opened);
      setItems(await listItems(id));
      setBook(opened);
    })();
  }, [id]);

  if (book === undefined) return <div className="tome-loading fixed inset-0 m-auto" />;
  if (book === null)
    return (
      <div className="tome-empty m-auto mt-32 max-w-md">
        <p className="tome-reading text-xl">This book isn't in your library.</p>
        <Link to="/" className="tome-btn tome-btn-primary mt-5">Back to library</Link>
      </div>
    );

  return mode === "read" ? (
    <Reader book={book} items={items} onEdit={() => setMode("edit")} />
  ) : (
    <Editor book={book} items={items} onBook={setBook} setItems={setItems}
      onRead={async () => { setItems(await listItems(id)); setMode("read"); }} />
  );
}
