import { useEffect, useState } from "react";
import { Check } from "lucide-react";

/** Small, quiet indicator that appears briefly after any change is stored. */
export function SavedBadge() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const h = () => { setOn(true); clearTimeout(t); t = setTimeout(() => setOn(false), 1200); };
    window.addEventListener("tome-saved", h);
    return () => { window.removeEventListener("tome-saved", h); clearTimeout(t); };
  }, []);
  return (
    <span className={`tome-saved ${on ? "opacity-100" : "opacity-0"}`} aria-live="polite">
      <Check className="h-3 w-3" /> Saved
    </span>
  );
}
