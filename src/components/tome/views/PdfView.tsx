import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdfjs } from "@/lib/pdf-ops";
import type { Ann } from "@/lib/tome-db";
import { AnnotationLayer, type Tool } from "./AnnotationLayer";
import { Problem } from "./shared";

export function usePdfDoc(blob: Blob | null) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    let live = true;
    let loaded: PDFDocumentProxy | null = null;
    setErr(null);
    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        loaded = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        if (live) setDoc(loaded);
        else void loaded.cleanup();
      } catch {
        if (live) setErr("This PDF couldn't be opened. It may be damaged or password-protected.");
      }
    })();
    return () => {
      live = false;
      void loaded?.cleanup();
    };
  }, [blob]);
  return { doc, err };
}

export function PdfView({
  blob, page, zoom = 1, onCount, annotations, onAnnotations, tool,
}: {
  blob: Blob;
  page: number;
  zoom?: number | undefined;
  onCount?: ((n: number) => void) | undefined;
  annotations?: Record<string, Ann[]> | undefined;
  onAnnotations?: ((page: number, a: Ann[]) => void) | undefined;
  tool?: Tool | null | undefined;
}) {
  const { doc, err } = usePdfDoc(blob);
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const lastPage = useRef(page);
  const dir = page >= lastPage.current ? "next" : "prev";
  useEffect(() => {
    lastPage.current = page;
  }, [page]);

  useEffect(() => {
    if (doc) onCount?.(doc.numPages);
  }, [doc]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxSize({ w: el.clientWidth - 48, h: el.clientHeight - 48 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!doc || boxSize.w <= 0 || page >= doc.numPages) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    (async () => {
      const p = await doc.getPage(page + 1);
      if (cancelled) return;
      const v1 = p.getViewport({ scale: 1 });
      const fit = Math.min(boxSize.w / v1.width, boxSize.h / v1.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vp = p.getViewport({ scale: fit * zoom * dpr });
      const c = canvas.current;
      if (!c) return;
      c.width = Math.floor(vp.width);
      c.height = Math.floor(vp.height);
      setSize({ w: vp.width / dpr, h: vp.height / dpr });
      task = p.render({ canvas: c, canvasContext: c.getContext("2d")!, viewport: vp });
      await task.promise.catch(() => {});
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, page, zoom, boxSize]);

  if (err) return <Problem>{err}</Problem>;
  return (
    <div ref={box} className="tome-pdf-box">
      <div key={page} className={`tome-pdf-page tome-turn-${dir}`} style={{ width: size.w || undefined, height: size.h || undefined }}>
        <canvas ref={canvas} className="block h-full w-full" />
        {size.w > 0 && (
          <AnnotationLayer
            anns={annotations?.[String(page)] ?? []}
            tool={tool}
            onChange={onAnnotations ? (a) => onAnnotations(page, a) : undefined}
          />
        )}
      </div>
      {!doc && <div className="tome-loading absolute" />}
    </div>
  );
}

export function PdfThumb({ doc, index }: { doc: PDFDocumentProxy; index: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setVisible(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || index >= doc.numPages) return;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    let cancelled = false;
    doc.getPage(index + 1).then((p) => {
      const c = ref.current;
      if (!c || cancelled) return;
      const v1 = p.getViewport({ scale: 1 });
      const vp = p.getViewport({ scale: 260 / v1.width });
      c.width = vp.width;
      c.height = vp.height;
      task = p.render({ canvas: c, canvasContext: c.getContext("2d")!, viewport: vp });
      task.promise.catch(() => {});
    });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [visible, doc, index]);
  return <canvas ref={ref} className="tome-thumb-canvas" />;
}
