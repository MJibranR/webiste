import { useEffect, useState } from "react";
import { getSettings, saveSettings, type SiteSettings } from "./settings";
import { DEFAULT_SETTINGS } from "./settings";

export function useSettings() {
  const [settings, setSettingsState] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSettings();
        setSettingsState(data || DEFAULT_SETTINGS);
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettingsState(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updateSettings = async (newSettings: SiteSettings) => {
    try {
      const success = await saveSettings(newSettings);
      if (success) {
        setSettingsState(newSettings);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  };

  return { settings, loading, updateSettings };
}