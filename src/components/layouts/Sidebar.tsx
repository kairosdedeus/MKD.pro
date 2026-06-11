import { useState } from "react";
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
  const visibleManagementItems =
    !isManagement && canAccessSongs
      ? managementItems.filter((item) => item.href !== "/gerencial/musicas")
      : managementItems;

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
        {isAnyLeader && (
          <div>
            <h3
              className="px-2 text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: "hsl(var(--sidebar-text))" }}
            >
              Gerencial
            </h3>
            <div className="space-y-0.5">
              {visibleManagementItems.map((item) => (
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
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {!isManagement && (
          <div>
            <h3
              className="px-2 text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: "hsl(var(--sidebar-text))" }}
            >
              Louvor
            </h3>
            <div className="space-y-0.5">
              <NavLink
                to="/musicas"
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

      <div className="fixed left-3 top-2.5 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="h-10 w-10 rounded-2xl border border-border bg-background/95 shadow-sm backdrop-blur-sm"
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
