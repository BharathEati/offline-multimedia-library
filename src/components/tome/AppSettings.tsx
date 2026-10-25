import { useState } from "react";
import { Settings, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAppData } from "@/lib/tome-db";
import { AppearanceToggle } from "./Appearance";

export function AppSettings() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reset = async () => {
    if (confirm !== "DELETE" || busy) return;
    setBusy(true);
    try { await clearAppData(); window.location.reload(); }
    catch { setError("Your library could not be cleared. Close other Tome windows and try again."); setBusy(false); }
  };
  return <>
    <AppearanceToggle />
    <Button size="icon" variant="ghost" aria-label="Settings" title="Settings" onClick={() => setOpen(true)}><Settings /></Button>
    {open && <div className="tome-overlay">
      <section className="tome-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="flex items-center justify-between"><h2 id="settings-title" className="text-lg font-semibold">Settings</h2><Button variant="ghost" size="icon" aria-label="Close settings" disabled={busy} onClick={() => { setOpen(false); setConfirm(""); }}><X /></Button></div>
        <div className="flex items-center justify-between border-b py-5"><span>Appearance</span><AppearanceToggle /></div>
        <h3 className="mt-5 font-medium">Delete app data</h3>
        <p className="mt-2 text-sm text-muted-foreground">Permanently remove all books, copied files, covers, annotations, reading positions, and preferences on this device. Your original files stay untouched. This cannot be undone.</p>
        <label className="mt-4 block text-sm">Type DELETE to confirm<input className="tome-input mt-2" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={busy} autoComplete="off" /></label>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <Button variant="destructive" className="mt-4" disabled={confirm !== "DELETE" || busy} onClick={reset}><Trash2 />{busy ? "Deleting…" : "Delete all app data"}</Button>
      </section>
    </div>}
  </>;
}