import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { useSettings } from "@/lib/use-settings";
import { SectionTitle } from "@/components/shell";
import { DEFAULT_SETTINGS, getSettings, setSettings, uid, type SiteSettings } from "@/lib/spiderhex";

export const Route = createFileRoute("/admin/content")({
  component: () => (
    <AdminShell>
      <ContentAdmin />
    </AdminShell>
  ),
  head: () => ({
    meta: [
      { title: "Site Content — SPIDER HEX Admin" },
      {
        name: "description",
        content: "Edit SPIDER HEX headings, logo, WhatsApp number, order messages and homepage videos.",
      },
      { property: "og:title", content: "Site Content — SPIDER HEX Admin" },
      { property: "og:description", content: "Full control over every text, logo and video on the site." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const field =
  "w-full rounded border border-border bg-background/60 px-3 py-2 text-xs text-foreground outline-none focus:border-primary";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.2em] text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel space-y-4 p-5">
      <p className="text-[11px] tracking-[0.2em] text-gold">{title}</p>
      {children}
    </div>
  );
}

function ContentAdmin() {
  const [s, setS] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setS(getSettings());
  }, []);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));



// In the component:
const { settings, updateSettings } = useSettings();

const save = async () => {
  if (!settings) return;
  const success = await updateSettings(s);
  if (success) {
    toast.success("SITE CONTENT SAVED TO DATABASE");
  } else {
    toast.error("FAILED TO SAVE");
  }
};

  const reset = () => {
    if (!window.confirm("Reset all texts back to the defaults?")) return;
    setSettings(DEFAULT_SETTINGS);
    setS(DEFAULT_SETTINGS);
    toast.success("CONTENT RESET");
  };

  return (
    <>
      <SectionTitle sub="// EDIT EVERY TEXT ON THE SITE">SITE CONTENT</SectionTitle>

      <div className="grid gap-5 lg:grid-cols-2">
        <Block title="BRAND & LOGO">
          <Row label="BRAND NAME">
            <input className={field} value={s.brandName} onChange={(e) => set("brandName", e.target.value)} />
          </Row>
          <Row label="LOGO EMOJI">
            <input className={field} value={s.logoEmoji} onChange={(e) => set("logoEmoji", e.target.value)} />
          </Row>
          <Row label="LOGO IMAGE URL (OPTIONAL — REPLACES EMOJI)">
            <input className={field} value={s.logoImageUrl} onChange={(e) => set("logoImageUrl", e.target.value)} />
          </Row>
        </Block>

        <Block title="CONTACT & ORDER MESSAGES">
          <Row label="WHATSAPP NUMBER (WITH COUNTRY CODE)">
            <input
              className={field}
              placeholder="923001234567"
              value={s.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
            />
          </Row>
          <Row label="DISCORD LINK">
            <input className={field} value={s.discordUrl} onChange={(e) => set("discordUrl", e.target.value)} />
          </Row>
          <Row label="BUY MESSAGE — USE {name} {product} {price} {brand}">
            <textarea
              rows={3}
              className={field}
              value={s.buyTemplate}
              onChange={(e) => set("buyTemplate", e.target.value)}
            />
          </Row>
          <Row label="TOP-UP MESSAGE — USE {name} {email} {amount} {brand}">
            <textarea
              rows={3}
              className={field}
              value={s.topUpTemplate}
              onChange={(e) => set("topUpTemplate", e.target.value)}
            />
          </Row>
        </Block>

        <Block title="HOMEPAGE HERO">
          <Row label="TOP BADGE">
            <input className={field} value={s.heroBadge} onChange={(e) => set("heroBadge", e.target.value)} />
          </Row>
          <Row label="BIG TITLE">
            <input className={field} value={s.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
          </Row>
          <Row label="SUBTITLE">
            <textarea
              rows={2}
              className={field}
              value={s.heroSubtitle}
              onChange={(e) => set("heroSubtitle", e.target.value)}
            />
          </Row>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="MAIN BUTTON">
              <input
                className={field}
                value={s.heroPrimaryCta}
                onChange={(e) => set("heroPrimaryCta", e.target.value)}
              />
            </Row>
            <Row label="SECOND BUTTON">
              <input
                className={field}
                value={s.heroSecondaryCta}
                onChange={(e) => set("heroSecondaryCta", e.target.value)}
              />
            </Row>
          </div>
        </Block>

        <Block title="HOMEPAGE BACKGROUND SLIDESHOW">
          <p className="text-[10px] text-muted-foreground">
            Paste image links — they slide across the top section one by one every 5 seconds.
          </p>
          {s.heroImages.map((img, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={field}
                placeholder="https://example.com/photo.jpg"
                aria-label={`Background image ${i + 1} link`}
                value={img}
                onChange={(e) =>
                  set(
                    "heroImages",
                    s.heroImages.map((x, j) => (i === j ? e.target.value : x)),
                  )
                }
              />
              <button
                onClick={() => set("heroImages", s.heroImages.filter((_, j) => j !== i))}
                aria-label={`Remove background image ${i + 1}`}
                className="rounded border border-danger/50 p-2 text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => set("heroImages", [...s.heroImages, ""])}
            className="rounded border border-border px-3 py-2 text-[11px] text-muted-foreground hover:text-primary"
          >
            <Plus className="mr-1 inline h-4 w-4" />
            ADD IMAGE
          </button>
        </Block>

        <Block title="STAT BOXES">
          {s.stats.map((st, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-2">
              <input
                className={field}
                aria-label={`Stat ${i + 1} value`}
                value={st.value}
                onChange={(e) =>
                  set(
                    "stats",
                    s.stats.map((x, j) => (i === j ? { ...x, value: e.target.value } : x)),
                  )
                }
              />
              <input
                className={field}
                aria-label={`Stat ${i + 1} label`}
                value={st.label}
                onChange={(e) =>
                  set(
                    "stats",
                    s.stats.map((x, j) => (i === j ? { ...x, label: e.target.value } : x)),
                  )
                }
              />
            </div>
          ))}
        </Block>

        <Block title="FEATURE CARDS">
          <Row label="SECTION HEADING">
            <input
              className={field}
              value={s.featuresHeading}
              onChange={(e) => set("featuresHeading", e.target.value)}
            />
          </Row>
          {s.features.map((f, i) => (
            <div key={i} className="space-y-2 rounded border border-border/60 p-3">
              <input
                className={field}
                aria-label={`Feature ${i + 1} title`}
                value={f.title}
                onChange={(e) =>
                  set(
                    "features",
                    s.features.map((x, j) => (i === j ? { ...x, title: e.target.value } : x)),
                  )
                }
              />
              <textarea
                rows={2}
                className={field}
                aria-label={`Feature ${i + 1} text`}
                value={f.text}
                onChange={(e) =>
                  set(
                    "features",
                    s.features.map((x, j) => (i === j ? { ...x, text: e.target.value } : x)),
                  )
                }
              />
            </div>
          ))}
        </Block>

        <Block title="SECURE ACCESS + STORE + FOOTER">
          <Row label="SECURE ACCESS HEADING">
            <input className={field} value={s.secureHeading} onChange={(e) => set("secureHeading", e.target.value)} />
          </Row>
          <Row label="SECURE ACCESS TEXT">
            <textarea
              rows={2}
              className={field}
              value={s.secureText}
              onChange={(e) => set("secureText", e.target.value)}
            />
          </Row>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="STORE HEADING">
              <input className={field} value={s.storeHeading} onChange={(e) => set("storeHeading", e.target.value)} />
            </Row>
            <Row label="STORE SUBTITLE">
              <input className={field} value={s.storeSub} onChange={(e) => set("storeSub", e.target.value)} />
            </Row>
          </div>
          <Row label="FOOTER TEXT">
            <input className={field} value={s.footerText} onChange={(e) => set("footerText", e.target.value)} />
          </Row>
          <Row label="FOOTER STATUS LINE">
            <input className={field} value={s.footerStatus} onChange={(e) => set("footerStatus", e.target.value)} />
          </Row>
        </Block>

        <Block title="HOMEPAGE VIDEOS (YOUTUBE)">
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="SECTION HEADING">
              <input className={field} value={s.videosHeading} onChange={(e) => set("videosHeading", e.target.value)} />
            </Row>
            <Row label="SECTION SUBTITLE">
              <input className={field} value={s.videosSub} onChange={(e) => set("videosSub", e.target.value)} />
            </Row>
          </div>
          {s.videos.map((v, i) => (
            <div key={v.id} className="space-y-2 rounded border border-border/60 p-3">
              <input
                className={field}
                placeholder="VIDEO TITLE"
                aria-label={`Video ${i + 1} title`}
                value={v.title}
                onChange={(e) =>
                  set(
                    "videos",
                    s.videos.map((x) => (x.id === v.id ? { ...x, title: e.target.value } : x)),
                  )
                }
              />
              <div className="flex gap-2">
                <input
                  className={field}
                  placeholder="https://youtu.be/... or video ID"
                  aria-label={`Video ${i + 1} link`}
                  value={v.url}
                  onChange={(e) =>
                    set(
                      "videos",
                      s.videos.map((x) => (x.id === v.id ? { ...x, url: e.target.value } : x)),
                    )
                  }
                />
                <button
                  onClick={() => set("videos", s.videos.filter((x) => x.id !== v.id))}
                  aria-label={`Remove video ${i + 1}`}
                  className="rounded border border-danger/50 p-2 text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => set("videos", [...s.videos, { id: uid(), title: "", url: "" }])}
            className="rounded border border-border px-3 py-2 text-[11px] text-muted-foreground hover:text-primary"
          >
            <Plus className="mr-1 inline h-4 w-4" />
            ADD VIDEO
          </button>
        </Block>
      </div>

      <div className="sticky bottom-4 mt-6 flex gap-2">
        <button
          onClick={save}
          className="pulse-glow rounded bg-primary px-6 py-3 text-[11px] font-bold text-primary-foreground hover:opacity-90"
        >
          SAVE ALL CHANGES
        </button>
        <button
          onClick={reset}
          className="rounded border border-danger/50 px-4 py-3 text-[11px] text-danger hover:bg-danger/10"
        >
          RESET TO DEFAULT
        </button>
      </div>
    </>
  );
}
