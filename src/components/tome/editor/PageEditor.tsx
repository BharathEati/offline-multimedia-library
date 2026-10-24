import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Image, Music, Trash2, Type, Video, Columns2, Square } from "lucide-react";
import { putItem, releaseAssets, uid, type Block, type BlockType, type Item } from "@/lib/tome-db";
import { friendlyError, knownAssets, storeFile } from "@/lib/import";
import { BlockImage } from "../views/DocViews";
import { MediaPlayer } from "../views/shared";

const ACCEPTS: Record<Exclude<BlockType, "text">, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  audio: ".mp3,.wav,.m4a,.aac,.ogg,.flac",
  video: ".mp4,.webm,.m4v,.mov",
};

export function PageEditor({ item, allItems, onItem }: { item: Item; allItems: Item[]; onItem: (i: Item) => void }) {
  const [blocks, setBlocks] = useState<Block[]>(item.blocks ?? []);
  const [error, setError] = useState<string | null>(null);
  const fileIn = useRef<HTMLInputElement>(null);
  const pending = useRef<BlockType | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(item);
  latest.current = item;

  useEffect(() => setBlocks(item.blocks ?? []), [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (next: Block[], removed: string[] = []) => {
    setBlocks(next);
    const it = { ...latest.current, blocks: next };
    await putItem(it);
    onItem(it);
    if (removed.length) await releaseAssets(item.bookId, removed);
  };
  // Text typing is saved after a short pause; pending text is flushed on unmount.
  const saveSoon = (next: Block[]) => {
    setBlocks(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(next), 400);
  };
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  useEffect(() => () => {
    if (timer.current) { clearTimeout(timer.current); putItem({ ...latest.current, blocks: blocksRef.current }); }
  }, []);

  const add = (type: BlockType) => {
    if (type === "text") return save([...blocks, { id: uid(), type, text: "", width: "full" }]);
    pending.current = type;
    if (fileIn.current) { fileIn.current.accept = ACCEPTS[type]; fileIn.current.click(); }
  };
  const onFile = async (f: File) => {
    const type = pending.current;
    if (!type) return;
    try {
      const { assetId, hash } = await storeFile(f, knownAssets(allItems));
      save([...blocks, { id: uid(), type, assetId, hash, width: type === "audio" ? "full" : "half" }]);
    } catch (e) {
      setError(friendlyError(e));
    }
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j]!, next[i]!];
    save(next);
  };

  return (
    <div className="tome-scroll">
      <div className="tome-paper tome-custom-page tome-page-editing">
        {blocks.length === 0 && <p className="tome-block-full text-muted-foreground">Add a block below to start this page.</p>}
        {blocks.map((b, i) => (
          <div key={b.id} className={`tome-edit-block ${b.width === "half" ? "tome-block-half" : "tome-block-full"}`}>
            <div className="tome-block-tools">
              <button onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => move(i, 1)} aria-label="Move down" disabled={i === blocks.length - 1}><ArrowDown className="h-3.5 w-3.5" /></button>
              {b.type !== "audio" && (
                <button onClick={() => save(blocks.map((x) => x.id === b.id ? { ...x, width: x.width === "half" ? "full" : "half" } : x))}
                  aria-label={b.width === "half" ? "Full width" : "Half width"}>
                  {b.width === "half" ? <Square className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
                </button>
              )}
              <button onClick={() => save(blocks.filter((x) => x.id !== b.id), b.assetId ? [b.assetId] : [])} aria-label="Remove block"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            {b.type === "text" ? (
              <textarea className="tome-block-text tome-prose" value={b.text ?? ""} placeholder="Write something…" rows={Math.max(3, (b.text ?? "").split("\n").length + 1)}
                onChange={(e) => saveSoon(blocks.map((x) => x.id === b.id ? { ...x, text: e.target.value } : x))} />
            ) : b.assetId && b.type === "image" ? (
              <BlockImage assetId={b.assetId} />
            ) : b.assetId ? (
              <MediaPlayer assetId={b.assetId} kind={b.type as "audio" | "video"} />
            ) : null}
          </div>
        ))}
      </div>
      <div className="tome-add-blocks">
        <span className="text-xs text-muted-foreground">Add</span>
        <button className="tome-btn" onClick={() => add("text")}><Type className="h-4 w-4" /> Text</button>
        <button className="tome-btn" onClick={() => add("image")}><Image className="h-4 w-4" /> Image</button>
        <button className="tome-btn" onClick={() => add("audio")}><Music className="h-4 w-4" /> Audio</button>
        <button className="tome-btn" onClick={() => add("video")}><Video className="h-4 w-4" /> Video</button>
        <input ref={fileIn} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }} />
      </div>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
