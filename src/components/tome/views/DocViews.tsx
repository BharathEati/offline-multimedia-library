import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMeta, setMeta, type Item } from "@/lib/tome-db";
import { MediaPlayer, MISSING, Problem, ScrollMemory, useAssetBlob, useAssetUrl, type NavRef } from "./shared";

export function TextView({ item }: { item: Item }) {
  const { blob, missing } = useAssetBlob(item.assetId);
  const [html, setHtml] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    blob.text().then(async (t) => {
      if (item.kind === "markdown") {
        const [{ marked }, DOMPurify] = await Promise.all([import("marked"), import("dompurify")]);
        setHtml(DOMPurify.default.sanitize(await marked.parse(t)));
      } else setText(t);
    });
  }, [blob, item.kind]);
  if (missing) return <Problem>{MISSING}</Problem>;
  return (
    <ScrollMemory id={item.id} className="tome-scroll">
      <article className="tome-paper tome-prose">
        {html != null ? <div dangerouslySetInnerHTML={{ __html: html }} /> : <div className="whitespace-pre-wrap">{text}</div>}
      </article>
    </ScrollMemory>
  );
}

export function ImageView({ item, zoom }: { item: Item; zoom: number }) {
  const { url, missing } = useAssetUrl(item.assetId);
  const [bad, setBad] = useState(false);
  if (missing) return <Problem>{MISSING}</Problem>;
  if (bad) return <Problem>This image couldn't be displayed. It may be damaged.</Problem>;
  return (
    <div className="tome-image-box">
      {url && (
        <img src={url} alt={item.title} onError={() => setBad(true)} className="tome-image"
          style={zoom > 1 ? { maxWidth: "none", maxHeight: "none", width: `${zoom * 100}%` } : undefined} />
      )}
    </div>
  );
}

export function MediaView({ item }: { item: Item }) {
  if (!item.assetId) return <Problem>{MISSING}</Problem>;
  return (
    <div className="tome-media-box">
      <MediaPlayer assetId={item.assetId} kind={item.kind === "audio" ? "audio" : "video"} title={item.kind === "audio" ? item.title : undefined} />
    </div>
  );
}

export function DocxView({ item }: { item: Item }) {
  const { blob, missing } = useAssetBlob(item.assetId);
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (!blob || !ref.current) return;
    const el = ref.current;
    el.innerHTML = "";
    import("docx-preview")
      .then(({ renderAsync }) =>
        renderAsync(blob, el, undefined, { className: "docx", inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: false, useBase64URL: true }),
      )
      .catch(() => setErr(true));
  }, [blob]);
  if (missing) return <Problem>{MISSING}</Problem>;
  if (err) return <Problem>This Word document couldn't be read. It may be damaged or use an older .doc format.</Problem>;
  return (
    <ScrollMemory id={item.id} className="tome-scroll tome-docx">
      <div ref={ref} />
    </ScrollMemory>
  );
}

type TocEntry = { label: string; href: string; subitems?: TocEntry[] };

export function EpubView({ item, nav }: { item: Item; nav: NavRef }) {
  const { blob, missing } = useAssetBlob(item.assetId);
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rend = useRef<any>(null);
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!blob || !ref.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let book: any;
    let live = true;
    (async () => {
      const ePub = (await import("epubjs")).default;
      book = ePub(await blob.arrayBuffer() as unknown as string);
      const r = book.renderTo(ref.current, { width: "100%", height: "100%", flow: "paginated", spread: "auto", allowScriptedContent: false });
      rend.current = r;
      r.themes.default({ body: { "font-family": "'Iowan Old Style', 'Palatino Linotype', Georgia, serif", "line-height": "1.6" } });
      const cfi = await getMeta<string>(`epub:${item.id}`);
      await r.display(cfi || undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.on("relocated", (loc: any) => setMeta(`epub:${item.id}`, loc.start.cfi));
      const navi = await book.loaded.navigation;
      if (live) setToc(navi.toc ?? []);
    })().catch(() => live && setErr(true));
    nav.current = {
      next: () => {
        const r = rend.current;
        if (!r || r.location?.atEnd) return false;
        r.next();
        return true;
      },
      prev: () => {
        const r = rend.current;
        if (!r || r.location?.atStart) return false;
        r.prev();
        return true;
      },
    };
    return () => {
      live = false;
      nav.current = null;
      rend.current = null;
      book?.destroy();
    };
  }, [blob, item.id, nav]);

  if (missing) return <Problem>{MISSING}</Problem>;
  if (err) return <Problem>This EPUB couldn't be opened. It may be damaged or protected with DRM.</Problem>;
  const flat = (list: TocEntry[], depth = 0): { label: string; href: string; depth: number }[] =>
    list.flatMap((t) => [{ label: t.label.trim(), href: t.href, depth }, ...flat(t.subitems ?? [], depth + 1)]);
  return (
    <div className="tome-epub">
      {toc.length > 0 && (
        <select className="tome-select tome-epub-toc" aria-label="Chapters" defaultValue="" onChange={(e) => rend.current?.display(e.target.value)}>
          <option value="" disabled>Chapters</option>
          {flat(toc).map((t, i) => (
            <option key={i} value={t.href}>{"\u00a0".repeat(t.depth * 3) + t.label}</option>
          ))}
        </select>
      )}
      <div className="tome-paper tome-epub-page">
        <div ref={ref} className="h-full w-full" />
      </div>
      <div className="tome-epub-nav">
        <button className="tome-btn" onClick={() => rend.current?.prev()} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
        <button className="tome-btn" onClick={() => rend.current?.next()} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function PageView({ item }: { item: Item }) {
  const blocks = item.blocks ?? [];
  return (
    <ScrollMemory id={item.id} className="tome-scroll">
      <article className="tome-paper tome-custom-page">
        {blocks.length === 0 && <p className="text-muted-foreground">This page is empty.</p>}
        {blocks.map((b) => (
          <div key={b.id} className={b.width === "half" ? "tome-block-half" : "tome-block-full"}>
            {b.type === "text" ? (
              <div className="tome-prose whitespace-pre-wrap">{b.text}</div>
            ) : !b.assetId ? null : b.type === "image" ? (
              <BlockImage assetId={b.assetId} />
            ) : (
              <MediaPlayer assetId={b.assetId} kind={b.type} />
            )}
          </div>
        ))}
      </article>
    </ScrollMemory>
  );
}

export function BlockImage({ assetId }: { assetId: string }) {
  const { url, missing } = useAssetUrl(assetId);
  if (missing) return <Problem>{MISSING}</Problem>;
  return url ? <img src={url} alt="" className="tome-block-image" /> : <div className="tome-loading" />;
}
