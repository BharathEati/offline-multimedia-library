# Tome — Architecture Decision Record

## Decision
- **Shell:** Electron (via `@electron/packager`) wrapping a React + TypeScript + Vite UI. Tauri was preferred, but it needs a Rust toolchain and native per-OS builds that this environment can't produce; Electron cross-packages Windows/macOS zips from here. The UI is shell-agnostic, so moving to Tauri later only swaps the storage/file adapter.
- **Storage:** IndexedDB (embedded, on-device, transactional, versioned migrations in `src/lib/tome-db.ts`). Files are stored as copied Blobs — originals are never touched. A SQLite + app-data-folder adapter can replace it in the desktop shell.
- **Libraries (planned):** PDF.js (render), pdf-lib (page ops + standard annotations), epub.js (EPUB), docx-preview (DOCX → HTML, page breaks honored; exact Word pagination not guaranteed), native `<audio>/<video>` (codecs limited to Chromium: MP3/WAV/M4A(AAC), MP4(H.264)/WebM), react-pageflip (page curls for custom pages and PDF spreads only; EPUB/DOCX stay reflowable), Tiptap for text blocks, CSS 3D for the bookshelf.

## Milestones
1. ✅ Foundation: design system, local DB, library grid + CSS 3D shelf, create/rename/delete, covers (original kept), collections, tags, search, sort, welcome letter, auto-save.
2. ✅ Import pipeline (copy-on-import, dedupe by hash, progress, errors) + content list.
3. ✅ Reader: PDF, images, audio/video with position restore, TXT/MD, page-turn transitions.
4. ✅ EPUB + DOCX rendering.
5. ✅ Editors: scrapbook block pages, PDF thumbnail editor, page ops, annotations.
6. ⏳ Sample book (✅ seeded on first launch), storage footnote (✅), Electron packaging, release docs.

## Risks / trade-offs
- Unsigned builds show OS warnings (Windows SmartScreen, macOS Gatekeeper) until signing certificates + notarization are added.
- `.dmg`/`.exe` installers can't be built here — releases ship as `.zip`.
- Browser storage quotas apply; the desktop adapter removes this limit.
