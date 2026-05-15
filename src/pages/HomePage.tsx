import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartHandshake,
  Instagram,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Mic2,
  Music2,
  UserCircle,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { UserProfile } from "@/types";
import {
  defaultHomeContent,
  HomeContent,
  homeContentService,
} from "@/services/homeContentService";

interface HomePageProps {
  user?: UserProfile | null;
}

const ministryIcons = [Music2, UsersRound, Camera, Mic2, HeartHandshake];

function normalizeHref(href: string, fallback: string) {
  const value = href.trim();
  if (!value) return fallback;
  return value;
}

function externalHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function HomePage({ user = null }: HomePageProps) {
  const [content, setContent] = useState<HomeContent>(defaultHomeContent);
  const [loading, setLoading] = useState(true);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(
    null,
  );
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    homeContentService
      .getPublished()
      .then((record) => {
        if (mounted) setContent(record.content);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const firstName = user?.nome?.trim().split(/\s+/)[0];
  const accessPath = user ? "/app" : "/login";
  const heroCtaHref = user
    ? "/app"
    : normalizeHref(content.hero.cta_href, "#visite");
  const heroCtaLabel = user ? "Meu dashboard" : content.hero.cta_label;
  const secondaryCtaHref = user
    ? "/app"
    : normalizeHref(content.hero.secondary_cta_href, "/login");
  const visibleGalleries = content.galleries.filter(
    (gallery) => gallery.cover_url || gallery.items.some((item) => item.url),
  );
  const specialEvents = content.special_events.slice(0, 3);
  const whatsappHref = externalHref(content.contact.whatsapp);
  const instagramHref = externalHref(content.contact.instagram);
  const activeGallery =
    activeGalleryIndex !== null ? visibleGalleries[activeGalleryIndex] : null;
  const activeGalleryItems =
    activeGallery?.items && activeGallery.items.length > 0
      ? activeGallery.items
      : activeGallery?.cover_url
        ? [
            {
              title: activeGallery.title,
              url: activeGallery.cover_url,
              type: "image" as const,
            },
          ]
        : [];
  const activeItem = activeGalleryItems[activeItemIndex];

  const openGallery = (index: number) => {
    setActiveGalleryIndex(index);
    setActiveItemIndex(0);
  };

  const closeGallery = () => {
    setActiveGalleryIndex(null);
    setActiveItemIndex(0);
  };

  const showPreviousItem = () => {
    if (activeGalleryItems.length === 0) return;
    setActiveItemIndex((current) =>
      current === 0 ? activeGalleryItems.length - 1 : current - 1,
    );
  };

  const showNextItem = () => {
    if (activeGalleryItems.length === 0) return;
    setActiveItemIndex((current) =>
      current === activeGalleryItems.length - 1 ? 0 : current + 1,
    );
  };

  const cssVars = useMemo(
    () =>
      ({
        "--home-primary": content.primary_color,
        "--home-accent": content.accent_color,
        "--home-dark": "#08090b",
        "--home-panel": "#131416",
        "--home-soft": "#f5f3ef",
        "--home-ink": "#111827",
        "--home-muted": "#667085",
      }) as React.CSSProperties,
    [content.accent_color, content.primary_color],
  );

  return (
    <main
      style={cssVars}
      className="min-h-screen scroll-smooth bg-[var(--home-dark)] text-white selection:bg-[var(--home-accent)]/30"
    >
      {loading && (
        <div className="fixed right-4 top-4 z-50 rounded-full border border-white/10 bg-black/55 p-2 backdrop-blur">
          <LoadingSpinner size="sm" />
        </div>
      )}

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/70 ring-1 ring-white/10">
              <Logo size="sm" variant="default" />
            </div>
            <span className="truncate text-sm font-semibold uppercase tracking-[0.2em] text-white/92">
              {content.brand_name}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 md:flex">
            <a href="#cultos" className="transition hover:text-white">
              Cultos
            </a>
            <a href="#agenda" className="transition hover:text-white">
              Eventos
            </a>
            <a href="#quem-somos" className="transition hover:text-white">
              Quem somos
            </a>
            <a href="#galeria" className="transition hover:text-white">
              Galeria
            </a>
            <a href="#ministerios" className="transition hover:text-white">
              Celulas
            </a>
          </nav>

          <Button
            asChild
            size="sm"
            className="rounded-full bg-white/12 text-white ring-1 ring-white/24 backdrop-blur hover:bg-white/20"
          >
            <Link to={accessPath} className="gap-2">
              {user ? (
                <>
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {firstName ? `Ola, ${firstName}` : "Area do membro"}
                  </span>
                  <span className="sm:hidden">Membro</span>
                </>
              ) : (
                <>
                  Meu espaco
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Link>
          </Button>
        </div>
      </header>

      <section className="relative min-h-[92svh] overflow-hidden">
        <img
          src={content.hero.image_url || defaultHomeContent.hero.image_url}
          alt={content.brand_name}
          className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.58)_0%,rgba(0,0,0,0.34)_44%,rgba(8,9,11,0.96)_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-[92svh] max-w-7xl flex-col px-5 pb-8 pt-24 sm:px-8 lg:px-12">
          <div className="flex flex-1 items-center justify-center text-center">
            <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="text-6xl font-black leading-none text-white sm:text-8xl lg:text-9xl">
                {content.brand_name}
              </h1>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[var(--home-accent)]" />
              <p className="mt-5 text-base font-medium uppercase tracking-[0.35em] text-white/82 sm:text-lg">
                {content.hero.title}
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                {content.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl bg-white/16 px-6 text-sm font-bold text-white ring-1 ring-white/28 backdrop-blur hover:bg-white/24"
                >
                  <a href={heroCtaHref} className="gap-2">
                    {heroCtaLabel}
                    {user ? (
                      <LayoutDashboard className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-lg border-white/18 bg-white/8 px-5 text-sm font-semibold text-white backdrop-blur hover:bg-white/14 hover:text-white"
                >
                  <Link to={secondaryCtaHref}>
                    {content.hero.secondary_cta_label}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="pb-4 text-center">
            <a
              href="#cultos"
              className="inline-flex flex-col items-center gap-1 text-xs font-medium uppercase tracking-[0.16em] text-white/76 transition hover:text-white"
            >
              Explore
              <ChevronRight className="h-4 w-4 rotate-90" />
            </a>
          </div>
        </div>
      </section>

      <section id="cultos" className="bg-[var(--home-dark)] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.45em] text-[var(--home-accent)]">
              Programacao
            </p>
            <h2 className="mt-5 text-4xl font-black text-white sm:text-5xl">
              Horarios dos Cultos
            </h2>
            <div className="mx-auto mt-5 h-1 w-14 rounded-full bg-[var(--home-accent)]" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {content.fixed_events.map((event, index) => (
              <article
                key={`${event.title}-${index}`}
                className="rounded-2xl border border-white/10 bg-[var(--home-panel)] p-8 transition duration-300 hover:-translate-y-1 hover:border-[var(--home-accent)]/45 hover:bg-[#17181b]"
              >
                <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--home-accent)]/12 text-[var(--home-accent)]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-bold text-white">{event.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/58">
                  {event.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-white/82">
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[var(--home-accent)]" />
                    {event.times}
                  </span>
                  <span className="text-white/45">{event.weekday}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="agenda" className="bg-[var(--home-soft)] px-5 py-20 text-[var(--home-ink)] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.45em] text-[var(--home-accent)]">
              Agenda
            </p>
            <h2 className="mt-5 text-4xl font-black sm:text-5xl">
              Proximos Eventos
            </h2>
            <div className="mx-auto mt-5 h-1 w-14 rounded-full bg-[var(--home-accent)]" />
          </div>

          {specialEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-[var(--home-muted)]">
              Em breve novos encontros especiais serao divulgados aqui.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {specialEvents.map((event, index) => (
                <article
                  key={`${event.title}-${index}`}
                  className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {event.image_url && (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  )}
                  <div className="p-6">
                    {index === 0 && (
                      <span className="rounded-full bg-[var(--home-accent)]/12 px-3 py-1 text-xs font-bold uppercase text-[#9a6500]">
                        Destaque
                      </span>
                    )}
                    <h3 className="mt-4 text-xl font-bold">{event.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--home-muted)]">
                      {event.description}
                    </p>
                    <div className="mt-5 space-y-2 text-sm text-[var(--home-muted)]">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[var(--home-accent)]" />
                        {event.date}
                      </p>
                      {event.time && (
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[var(--home-accent)]" />
                          {event.time}
                        </p>
                      )}
                      {event.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[var(--home-accent)]" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="quem-somos" className="bg-white px-5 py-20 text-[var(--home-ink)] sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.86fr] lg:items-center">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            <p className="text-sm font-bold uppercase tracking-[0.45em] text-[var(--home-accent)]">
              {content.about.eyebrow}
            </p>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              {content.about.title}
            </h2>
            <div className="mt-5 h-1 w-14 rounded-full bg-[var(--home-accent)]" />
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--home-muted)]">
              {content.about.description}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <h3 className="text-lg font-bold">
                  {content.about.mission_title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--home-muted)]">
                  {content.about.mission_description}
                </p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <h3 className="text-lg font-bold">
                  {content.about.vision_title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--home-muted)]">
                  {content.about.vision_description}
                </p>
              </div>
            </div>
          </div>

          {content.about.image_url && (
            <img
              src={content.about.image_url}
              alt={content.about.title}
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-2xl"
            />
          )}
        </div>
      </section>

      <section id="ministerios" className="bg-[var(--home-dark)] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.45em] text-[var(--home-accent)]">
                Comunidade
              </p>
              <h2 className="mt-5 text-4xl font-black text-white sm:text-5xl">
                Nossas Celulas
              </h2>
              <div className="mt-5 h-1 w-14 rounded-full bg-[var(--home-accent)]" />
            </div>
            <p className="max-w-md text-sm leading-6 text-white/58">
              Cada ministerio existe para cuidar melhor da casa e abrir espaco
              para pessoas usarem seus dons.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {content.ministries.map((ministry, index) => {
              const Icon = ministryIcons[index % ministryIcons.length];
              return (
                <article
                  key={`${ministry.title}-${index}`}
                  className="group rounded-2xl border border-white/10 bg-[var(--home-panel)] p-6 transition duration-300 hover:-translate-y-1 hover:border-[var(--home-accent)]/50"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/8 text-[var(--home-accent)] transition group-hover:bg-[var(--home-accent)] group-hover:text-black">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">
                    {ministry.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    {ministry.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {visibleGalleries.length > 0 && (
        <section id="galeria" className="bg-[var(--home-dark)] px-5 py-20 text-white sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.45em] text-[var(--home-accent)]">
                Galeria
              </p>
              <h2 className="mt-5 text-4xl font-black sm:text-5xl">
                Vida da igreja
              </h2>
              <p className="mt-4 text-base text-white/62">
                Momentos especiais da nossa comunidade
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleGalleries.slice(0, 6).map((gallery, index) => {
                const cover =
                  gallery.cover_url ||
                  gallery.items.find((item) => item.url)?.url ||
                  "";
                return (
                  <button
                    type="button"
                    onClick={() => openGallery(index)}
                    key={`${gallery.title}-${index}`}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-[var(--home-panel)] text-left shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-[var(--home-accent)]/45 hover:shadow-[0_24px_60px_rgba(0,0,0,0.36)]"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      {cover && (
                        <img
                          src={cover}
                          alt={gallery.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.74)_100%)]" />
                      {gallery.featured && (
                        <span className="absolute left-3 top-3 rounded-full bg-[var(--home-accent)] px-3 py-1 text-xs font-bold text-black">
                          Destaque
                        </span>
                      )}
                      <span className="absolute right-3 top-3 rounded-md bg-black/62 px-3 py-1 text-xs text-white backdrop-blur">
                        {gallery.items.length} itens
                      </span>
                      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <h3 className="text-lg font-bold">{gallery.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-white/82">
                          {gallery.description}
                        </p>
                        {gallery.date && (
                          <p className="mt-2 text-xs text-white/70">
                            {gallery.date}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section id="visite" className="bg-[var(--home-dark)] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-2xl border border-white/10 bg-[var(--home-panel)] p-6 sm:p-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-[var(--home-accent)]">
              {content.visit.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-5xl">
              {content.visit.title}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
              {content.visit.description}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {whatsappHref && (
                <Button
                  asChild
                  className="h-12 rounded-lg bg-[var(--home-accent)] text-black hover:opacity-90"
                >
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {content.visit.first_time_label}
                  </a>
                </Button>
              )}
              {content.visit.map_url && (
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-lg border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <a href={content.visit.map_url} target="_blank" rel="noreferrer">
                    <MapPin className="mr-2 h-4 w-4" />
                    Como chegar
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.045] p-5">
            <p className="text-sm font-semibold text-white">Informacoes uteis</p>
            {content.contact.address && (
              <p className="flex gap-3 text-sm leading-6 text-white/68">
                <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--home-accent)]" />
                {content.contact.address}
              </p>
            )}
            {content.contact.service_times && (
              <p className="flex gap-3 text-sm leading-6 text-white/68">
                <Clock className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--home-accent)]" />
                {content.contact.service_times}
              </p>
            )}
            {instagramHref && (
              <a
                href={instagramHref}
                target="_blank"
                rel="noreferrer"
                className="flex gap-3 text-sm leading-6 text-white/68 transition hover:text-white"
              >
                <Instagram className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--home-accent)]" />
                Instagram
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-[var(--home-dark)] px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="default" />
            <div>
              <p className="font-semibold text-white">{content.brand_name}</p>
              <p className="text-sm text-white/55">
                {content.contact.service_times}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-white/60 sm:justify-end">
            <a href="#quem-somos" className="hover:text-white">
              Quem somos
            </a>
            <a href="#agenda" className="hover:text-white">
              Agenda
            </a>
            <a href="#visite" className="hover:text-white">
              Visite-nos
            </a>
          </div>
        </div>
      </footer>

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-4 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--home-accent)] text-black shadow-lg transition hover:scale-105 md:hidden"
          aria-label="Falar pelo WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      )}

      {activeGallery && activeItem && (
        <div className="fixed inset-0 z-50 bg-black/92 text-white backdrop-blur-sm">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold sm:text-base">
                  {activeGallery.title}
                </p>
                <p className="text-xs text-white/55">
                  {activeItemIndex + 1} de {activeGalleryItems.length}
                  {activeGallery.date && ` - ${activeGallery.date}`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeGallery}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/18"
                aria-label="Fechar galeria"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="relative flex min-h-0 items-center justify-center bg-black">
                {activeGalleryItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousItem}
                      className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/52 text-white backdrop-blur transition hover:bg-black/72"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextItem}
                      className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/52 text-white backdrop-blur transition hover:bg-black/72"
                      aria-label="Proxima imagem"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {activeItem.type === "video" ? (
                  <video
                    src={activeItem.url}
                    controls
                    autoPlay
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <img
                    src={activeItem.url}
                    alt={activeItem.title || activeGallery.title}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>

              <aside className="flex min-h-0 flex-col border-t border-white/10 bg-[var(--home-panel)] lg:border-l lg:border-t-0">
                <div className="space-y-3 border-b border-white/10 p-4">
                  <p className="text-lg font-semibold">{activeItem.title}</p>
                  {activeGallery.description && (
                    <p className="text-sm leading-6 text-white/62">
                      {activeGallery.description}
                    </p>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  <div className="grid grid-cols-4 gap-2 lg:grid-cols-3">
                    {activeGalleryItems.map((item, index) => (
                      <button
                        key={`${item.url}-${index}`}
                        type="button"
                        onClick={() => setActiveItemIndex(index)}
                        className={`relative aspect-square overflow-hidden rounded-lg border transition ${
                          index === activeItemIndex
                            ? "border-[var(--home-accent)]"
                            : "border-white/10 opacity-72 hover:opacity-100"
                        }`}
                      >
                        {item.type === "video" ? (
                          <video
                            src={item.url}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                        {item.type === "video" && (
                          <span className="absolute inset-x-2 bottom-2 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
                            Video
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
