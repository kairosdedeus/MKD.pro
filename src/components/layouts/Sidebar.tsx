import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UsersRound,
  UserPlus,
  Music2,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useTeams } from "@/hooks/useTeams";
import {
  TEAM_TYPE_ICONS,
  TEAM_TYPE_LABELS,
  TEAM_TYPE_ROUTES,
} from "@/lib/team-flow";

const managementItems = [
  { name: "Dashboard", href: "/gerencial", icon: LayoutDashboard },
  { name: "Usuarios", href: "/gerencial/usuarios", icon: UserPlus },
  { name: "Equipes", href: "/gerencial/equipes", icon: UsersRound },
  { name: "Musicas", href: "/gerencial/musicas", icon: Music2 },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, profiles } = useAuthStore();
  const { teams } = useTeams();

  const isManagement = profiles.some(
    (profile) => profile.codigo === "gerencial",
  );
  const isAnyLeader = profiles.some((profile) =>
    [
      "gerencial",
      "lider_louvor",
      "lider_danca",
      "lider_obreiros",
      "lider_midia",
      "lider_celula",
    ].includes(profile.codigo),
  );
  const isWorshipProfile = profiles.some((profile) =>
    ["lider_louvor", "membro_louvor"].includes(profile.codigo),
  );
  const hasWorshipMembership = (teams as any[]).some(
    (team: any) =>
      team.team_type?.codigo === "louvor" &&
      (team.members || []).some((member: any) => member.user_id === user?.id),
  );
  const canAccessSongs =
    isManagement || (isWorshipProfile && hasWorshipMembership);

  const ministryItems = useMemo(() => {
    const visibleTeams = (teams as any[]).filter((team: any) => {
      if (!team.team_type?.codigo) return false;
      if (isManagement) return true;
      return (team.members || []).some(
        (member: any) => member.user_id === user?.id,
      );
    });

    const byType = new Map<string, any[]>();
    visibleTeams.forEach((team: any) => {
      const code = team.team_type.codigo;
      byType.set(code, [...(byType.get(code) || []), team]);
    });

    return Array.from(byType.entries()).map(([code, groupedTeams]) => {
      const Icon = TEAM_TYPE_ICONS[code] || UsersRound;
      return {
        code,
        name:
          TEAM_TYPE_LABELS[code] || groupedTeams[0]?.team_type?.nome || code,
        href: TEAM_TYPE_ROUTES[code] || `/${code}`,
        icon: Icon,
        teams: groupedTeams,
      };
    });
  }, [teams, user?.id, isManagement]);

  return (
    <div className="flex flex-col h-full sidebar-bg border-r">
      <div className="flex items-center justify-between px-4 pt-5 pb-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-foreground">Escalas</h1>
          <p
            className="text-xs font-medium"
            style={{ color: `hsl(var(--primary))` }}
          >
            Ministeriais
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 px-3 pb-4 space-y-4 overflow-y-auto">
        {isManagement && (
          <div>
            <h3
              className="px-2 text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: "hsl(var(--sidebar-text))" }}
            >
              Gerencial
            </h3>
            <div className="space-y-0.5">
              {managementItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === "/gerencial"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                      isActive
                        ? "bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-text))] font-semibold"
                        : "text-[hsl(var(--sidebar-text))] hover:bg-accent hover:text-foreground",
                    )
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {ministryItems.length > 0 && (
          <div>
            <h3
              className="px-2 text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: "hsl(var(--sidebar-text))" }}
            >
              Ministerios
            </h3>
            <div className="space-y-0.5">
              {ministryItems.map((item) => (
                <NavLink
                  key={item.code}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                      isActive
                        ? "bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-text))] font-semibold"
                        : "text-[hsl(var(--sidebar-text))] hover:bg-accent hover:text-foreground",
                    )
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.name}</span>
                    <span className="block truncate text-[10px] font-normal opacity-70">
                      {item.teams.map((team: any) => team.nome).join(", ")}
                    </span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {item.teams.length}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {!isManagement && canAccessSongs && (
          <div>
            <h3
              className="px-2 text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: "hsl(var(--sidebar-text))" }}
            >
              Louvor
            </h3>
            <div className="space-y-0.5">
              <NavLink
                to="/gerencial/musicas"
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                    isActive
                      ? "bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-text))] font-semibold"
                      : "text-[hsl(var(--sidebar-text))] hover:bg-accent hover:text-foreground",
                  )
                }
              >
                <Music2 className="h-4 w-4 flex-shrink-0" />
                Musicas
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      <div className="px-4 py-3 border-t border-[hsl(var(--sidebar-border))] flex-shrink-0">
        <p
          className="text-[11px]"
          style={{ color: "hsl(var(--sidebar-text))" }}
        >
          MKD.pro © 2026
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="hidden md:flex md:w-56 md:flex-col md:flex-shrink-0">
        <SidebarContent />
      </div>

      <div className="md:hidden fixed top-3 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="bg-background shadow-sm border border-border"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
