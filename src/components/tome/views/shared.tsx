import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { getAsset, getMeta, setMeta } from "@/lib/tome-db";

export type Nav = { next: () => boolean; prev: () => boolean };
export type NavRef = MutableRefObject<Nav | null>;

export function useAssetBlob(assetId: string | null | undefined) {
  const [state, setState] = useState<{ blob: Blob | null; missing: boolean }>({ blob: null, missing: false });
  useEffect(() => {
    let live = true;
    setState({ blob: null, missing: false });
    if (!assetId) return;
    getAsset(assetId).then((b) => live && setState({ blob: b ?? null, missing: !b }));
    return () => {
      live = false;
    };
  }, [assetId]);
  return state;
}

export function useAssetUrl(assetId: string | null | undefined) {
  const { blob, missing } = useAssetBlob(assetId);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return setUrl(null);
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return { url, missing };
}

export function Problem({ children }: { children: ReactNode }) {
  return (
    <div className="tome-problem" role="alert">
      {children}
    </div>
  );
}

export const MISSING = "This file is missing from your Tome library. Remove it in Edit mode and import it again.";

/** Media player with remembered position. Never autoplays. */
export function MediaPlayer({ assetId, kind, title }: { assetId: string; kind: "audio" | "video"; title?: string | undefined }) {
  const { url, missing } = useAssetUrl(assetId);
  const [err, setErr] = useState(false);
  const last = useRef(0);
  const key = `media:${assetId}`;
  if (missing) return <Problem>{MISSING}</Problem>;
  if (err)
    return (
      <Problem>
        This {kind} can't be played — its format or codec isn't supported here. Try converting it to{" "}
        {kind === "audio" ? "MP3 or M4A" : "MP4 (H.264) or WebM"} and importing again.
      </Problem>
    );
  if (!url) return <div className="tome-loading" />;
  const common = {
    src: url,
    controls: true,
    preload: "metadata" as const,
    onError: () => setErr(true),
    onLoadedMetadata: async (e: React.SyntheticEvent<HTMLMediaElement>) => {
      const el = e.currentTarget;
      const t = await getMeta<number>(key);
      if (t && t < el.duration - 1) el.currentTime = t;
    },
    onTimeUpdate: (e: React.SyntheticEvent<HTMLMediaElement>) => {
      const t = e.currentTarget.currentTime;
      if (Math.abs(t - last.current) > 2) {
        last.current = t;
        setMeta(key, t);
      }
    },
    onPause: (e: React.SyntheticEvent<HTMLMediaElement>) => setMeta(key, e.currentTarget.currentTime),
  };
  return kind === "audio" ? (
    <div className="tome-audio">
      {title && <div className="tome-audio-title">{title}</div>}
      <audio {...common} className="w-full" />
    </div>
  ) : (
    <video {...common} className="tome-video" playsInline />
  );
}

/** Scroll container that remembers where the reader was. */
export function ScrollMemory({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    getMeta<number>(`scroll:${id}`).then((y) => {
      if (y && ref.current) setTimeout(() => ref.current && (ref.current.scrollTop = y), 50);
    });
  }, [id]);
  return (
    <div
      ref={ref}
      className={className}
      onScroll={(e) => {
        const y = e.currentTarget.scrollTop;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setMeta(`scroll:${id}`, y), 400);
      }}
    >
      {children}
    </div>
  );
}
