import { useEffect, useState } from "react";
import { fallbackHue, getAsset, type Book } from "@/lib/tome-db";

export function BookCover({ book, className = "" }: { book: Book; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    if (book.coverId)
      getAsset(book.coverId).then((blob) => {
        if (blob) setUrl((u = URL.createObjectURL(blob)));
      });
    else setUrl(null);
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [book.coverId]);

  const hue = fallbackHue(book.title);
  return (
    <div className={`tome-cover ${className}`} style={{ "--cover-hue": hue } as React.CSSProperties}>
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="tome-cover-fallback">
          <span className="tome-cover-title">{book.title}</span>
          <span className="tome-cover-rule" />
        </div>
      )}
      <span className="tome-cover-spine" aria-hidden />
    </div>
  );
}
