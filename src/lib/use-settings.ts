import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, getSettings, type SiteSettings } from "./spiderhex";

/** Live site content, kept in sync with admin edits. */
export function useSettings(): SiteSettings {
  const [settings, setState] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const sync = useCallback(() => setState(getSettings()), []);

  useEffect(() => {
    sync();
    const handler = () => sync();
    window.addEventListener("sh:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("sh:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, [sync]);

  return settings;
}
