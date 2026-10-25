import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { getMeta, setMeta } from "@/lib/tome-db";
import { Button } from "@/components/ui/button";

const AppearanceContext = createContext({ dark: false, toggle: () => {} });

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    getMeta<string>("theme").then((theme) => setDark(theme === "dark")).catch(() => {});
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  const toggle = async () => {
    const next = !dark;
    try { await setMeta("theme", next ? "dark" : "light"); setDark(next); setError(""); }
    catch { setError("Appearance could not be saved. Please try again."); }
  };
  return <AppearanceContext.Provider value={{ dark, toggle }}>
    {children}
    {error && <p role="alert" className="fixed bottom-4 left-4 bg-popover p-3 text-destructive">{error}</p>}
  </AppearanceContext.Provider>;
}

export function AppearanceToggle() {
  const { dark, toggle } = useContext(AppearanceContext);
  return <Button size="icon" variant="ghost" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}>
    {dark ? <Sun /> : <Moon />}
  </Button>;
}