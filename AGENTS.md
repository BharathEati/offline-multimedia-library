<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Tome rules
- All persistence goes through `src/lib/tome-db.ts` (IndexedDB, versioned upgrades) — keeps storage swappable for a desktop adapter.
- No runtime network: no remote fonts, CDNs, or APIs — the product is offline/local-first.
- Architecture and milestones live in `docs/ARCHITECTURE.md`.
