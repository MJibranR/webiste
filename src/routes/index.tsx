import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, ShieldCheck, Gem, Rocket, Lock, Youtube } from "lucide-react";
import { Page, SectionTitle } from "@/components/shell";
import { useSettings } from "@/lib/use-settings";
import { youtubeEmbed } from "@/lib/spiderhex";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "SPIDER HEX — Premium Gaming Panel Store" },
      {
        name: "description",
        content:
          "Unlock premium gaming panels for PC, root, non-root and iOS. Instant download delivery, 99.9% uptime, 80K+ active players.",
      },
      { property: "og:title", content: "SPIDER HEX — Premium Gaming Panel Store" },
      {
        property: "og:description",
        content: "Premium gaming panels with instant download delivery and 99.9% uptime.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const ICONS = [Zap, ShieldCheck, Gem, Rocket];

function HeroSlideshow({ images }: { images: string[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % images.length), 5000);
    return () => clearInterval(t);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {images.map((src, idx) => (
        <img
          key={src + idx}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-out"
          style={{
            opacity: idx === i ? 1 : 0,
            transform: `translateX(${(idx - i) * 12}%)`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-background/75" />
    </div>
  );
}

function Landing() {
  const s = useSettings();

  return (
    <Page>
      <section className="hex-grid panel relative overflow-hidden px-6 py-16 text-center">
        <HeroSlideshow images={s.heroImages.filter(Boolean)} />
        <div className="relative">
        <p className="text-xs tracking-[0.4em] text-muted-foreground">
          {s.heroBadge} <span className="status-dot align-middle" />
        </p>
        <h1 className="glitch glow-text mt-4 text-4xl font-bold tracking-[0.2em] text-primary sm:text-6xl md:text-7xl">
          {s.heroTitle}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground">{s.heroSubtitle}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs">
          <Link
            to="/store"
            className="pulse-glow rounded bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90"
          >
            {s.heroPrimaryCta}
          </Link>
          <Link to="/signup" className="rounded border border-border px-6 py-3 text-primary transition hover:bg-accent">
            {s.heroSecondaryCta}
          </Link>
        </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {s.stats.map((st) => (
          <div key={st.label} className="panel p-6 text-center">
            <p className="glow-gold text-3xl font-bold">{st.value}</p>
            <p className="mt-2 text-[11px] tracking-[0.25em] text-muted-foreground">{st.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <SectionTitle>{s.featuresHeading}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {s.features.map((f, i) => {
            const Icon = ICONS[i % ICONS.length]!;
            return (
              <div key={f.title} className="panel group p-6 transition hover:-translate-y-1 hover:border-primary">
                <Icon className="h-6 w-6 text-primary transition group-hover:scale-110" />
                <h3 className="mt-4 text-sm font-bold tracking-[0.15em] text-primary">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <SectionTitle sub={s.videosSub}>
          <Youtube className="mr-2 inline h-5 w-5 text-danger" />
          {s.videosHeading}
        </SectionTitle>
        {s.videos.length === 0 ? (
          <p className="panel p-8 text-center text-xs text-muted-foreground">
            NO VIDEOS YET — ADD YOUTUBE LINKS IN ADMIN → SITE CONTENT → LATEST VIDEOS
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.videos.map((v) => (
              <div key={v.id} className="panel overflow-hidden">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={youtubeEmbed(v.url)}
                    title={v.title || "Channel video"}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
                {v.title ? <p className="p-3 text-xs text-primary">{v.title}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel mx-auto mt-10 max-w-md p-8 text-center">
        <Lock className="mx-auto h-7 w-7 text-gold" />
        <h2 className="glow-gold mt-4 text-lg font-bold tracking-[0.2em]">{s.secureHeading}</h2>
        <p className="mt-2 text-xs text-muted-foreground">{s.secureText}</p>
        <div className="mt-6 flex flex-col gap-3 text-xs sm:flex-row">
          <Link
            to="/login"
            className="flex-1 rounded border border-border px-4 py-3 text-primary transition hover:bg-accent"
          >
            LOGIN
          </Link>
          <Link
            to="/signup"
            className="flex-1 rounded bg-primary px-4 py-3 font-bold text-primary-foreground transition hover:opacity-90"
          >
            SIGNUP
          </Link>
        </div>
      </section>
    </Page>
  );
}
