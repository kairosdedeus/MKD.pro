import { Link } from "react-router-dom";
import {
  ArrowRight,
  Church,
  Heart,
  LayoutDashboard,
  Music2,
  UserCircle,
  UsersRound,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { UserProfile } from "@/types";

const assetBase = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const heroImage = `${assetBase}images/church-home-hero.png`;

const pillars = [
  {
    title: "Adoração viva",
    description:
      "Um ambiente para encontrar Deus com simplicidade, entrega e alegria.",
    icon: Music2,
  },
  {
    title: "Comunidade",
    description:
      "Pessoas caminhando juntas, cuidando umas das outras e servindo com amor.",
    icon: UsersRound,
  },
  {
    title: "Propósito",
    description:
      "Ministérios, escalas e cuidado pastoral preparados para crescer com ordem.",
    icon: Church,
  },
];

interface HomePageProps {
  user?: UserProfile | null;
}

export function HomePage({ user = null }: HomePageProps) {
  const firstName = user?.nome?.trim().split(/\s+/)[0];
  const accessPath = user ? "/app" : "/login";

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="relative min-h-[92svh] overflow-hidden">
        <img
          src={heroImage}
          alt="Jovens adorando em uma igreja com luz baixa e maos levantadas"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.36)_44%,rgba(5,5,5,0.96)_100%)] sm:bg-[linear-gradient(90deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.58)_42%,rgba(0,0,0,0.2)_100%)]" />
        <div className="relative z-10 flex min-h-[92svh] flex-col px-5 pb-8 pt-4 sm:px-8 lg:px-12">
          <header className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-black/70 ring-1 ring-white/10">
                <Logo size="sm" variant="default" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-white/90">
                MKD
              </span>
            </Link>

            <Link
              to={accessPath}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-[#29ABD4] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#29ABD4] focus:ring-offset-2 focus:ring-offset-black"
            >
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
                  Entrar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Link>
          </header>

          <div className="flex flex-1 items-end pb-8 pt-20 sm:items-center sm:pb-0">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#f8c56b] backdrop-blur">
                <Heart className="h-3.5 w-3.5" />
                Em construcao
              </div>
              <h1 className="max-w-2xl text-4xl font-bold leading-[0.98] tracking-normal text-white sm:text-6xl lg:text-7xl">
                Uma casa para adorar, servir e caminhar juntos.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/78 sm:text-lg">
                Estamos preparando uma nova entrada digital para a igreja, com
                carinho, excelencia e espaco para tudo que Deus ainda vai fazer
                em nossa comunidade.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={accessPath}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#29ABD4] px-5 text-sm font-bold text-white shadow-[0_16px_44px_rgba(41,171,212,0.24)] transition hover:bg-[#238fb2] focus:outline-none focus:ring-2 focus:ring-[#29ABD4] focus:ring-offset-2 focus:ring-offset-black"
                >
                  {user ? (
                    <>
                      Meu dashboard
                      <LayoutDashboard className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Acessar sistema
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Link>
                <a
                  href="#construcao"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/18 bg-white/8 px-5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-black"
                >
                  Ver mensagem
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="construcao"
        className="border-y border-white/10 bg-[#0b0b0b] px-5 py-12 sm:px-8 lg:px-12"
      >
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#29ABD4]">
              Nova home
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-white sm:text-5xl">
              Estamos construindo algo bonito para receber voce.
            </h2>
          </div>
          <p className="text-base leading-7 text-white/68">
            Por enquanto, esta pagina marca o inicio da expansao do sistema: uma
            landing page publica para acolher visitantes, apresentar a igreja e
            manter o acesso rapido para quem ja serve nos ministerios.
          </p>
        </div>
      </section>

      <section className="bg-[#050505] px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-lg border border-white/10 bg-white/[0.045] p-5"
            >
              <pillar.icon className="h-6 w-6 text-[#f8c56b]" />
              <h3 className="mt-5 text-lg font-semibold text-white">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/62">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
