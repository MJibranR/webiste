import { useEffect, useState } from "react";
import { getSettings, saveSettings, type SiteSettings } from "./settings";

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getSettings();
      setSettings(data);
      setLoading(false);
    }
    load();
  }, []);

  const updateSettings = async (newSettings: SiteSettings) => {
    const success = await saveSettings(newSettings);
    if (success) {
      setSettings(newSettings);
    }
    return success;
  };

  return { settings, loading, updateSettings };
}