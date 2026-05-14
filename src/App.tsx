import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { Toaster } from "./components/ui/toaster";
import { LoadingSpinner } from "./components/shared/LoadingSpinner";
import { isGerencial, isMember } from "./lib/permissions";
import { TeamTypeCode } from "./types";
import { useTeams } from "./hooks/useTeams";
import { TEAM_TYPE_ROUTES } from "./lib/team-flow";
import { YoutubeMiniplayer } from "./components/shared/YoutubeMiniplayer";
import { useYoutubeMiniplayerStore } from "./stores/youtubeMiniplayerStore";

function GlobalYoutubeMiniplayer() {
  const { url, title, close } = useYoutubeMiniplayerStore();
  if (!url) return null;
  return <YoutubeMiniplayer url={url} title={title} onClose={close} />;
}

// ── Lazy loading de todas as páginas ─────────────────────────
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const TestConnectionPage = lazy(() =>
  import("./pages/TestConnectionPage").then((m) => ({
    default: m.TestConnectionPage,
  })),
);
const GerencialDashboard = lazy(() =>
  import("./pages/gerencial/GerencialDashboard").then((m) => ({
    default: m.GerencialDashboard,
  })),
);
const TeamsPage = lazy(() =>
  import("./pages/gerencial/TeamsPage").then((m) => ({ default: m.TeamsPage })),
);
const UsersPage = lazy(() =>
  import("./pages/gerencial/UsersPage").then((m) => ({ default: m.UsersPage })),
);
const SongsPage = lazy(() =>
  import("./pages/songs/SongsPage").then((m) => ({ default: m.SongsPage })),
);
const WorshipDashboard = lazy(() =>
  import("./pages/worship/WorshipDashboard").then((m) => ({
    default: m.WorshipDashboard,
  })),
);
const DanceDashboard = lazy(() =>
  import("./pages/dance/DanceDashboard").then((m) => ({
    default: m.DanceDashboard,
  })),
);
const MediaDashboard = lazy(() =>
  import("./pages/media/MediaDashboard").then((m) => ({
    default: m.MediaDashboard,
  })),
);
const UshersDashboard = lazy(() =>
  import("./pages/ushers/UshersDashboard").then((m) => ({
    default: m.UshersDashboard,
  })),
);
const CellsDashboard = lazy(() =>
  import("./pages/cells/CellsDashboard").then((m) => ({
    default: m.CellsDashboard,
  })),
);
const AccessDeniedPage = lazy(() =>
  import("./pages/AccessDeniedPage").then((m) => ({
    default: m.AccessDeniedPage,
  })),
);

// ── Fallback de carregamento ──────────────────────────────────
function PageLoader() {
  return (
    <div className="flex h-full min-h-[300px] items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

function RouteLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <LoadingSpinner />
    </div>
  );
}

function ProtectedGerencialRoute({ children }: { children: React.ReactNode }) {
  const { profiles } = useAuthStore();

  if (!isGerencial(profiles)) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AccessDeniedPage />
      </Suspense>
    );
  }

  return <>{children}</>;
}

function ProtectedUsersRoute({ children }: { children: React.ReactNode }) {
  const { profiles } = useAuthStore();
  const { isLeader: checkLeader } = {
    isLeader: (p: typeof profiles) =>
      p.some((x) =>
        [
          "gerencial",
          "lider_louvor",
          "lider_danca",
          "lider_obreiros",
          "lider_midia",
          "lider_celula",
        ].includes(x.codigo),
      ),
  };

  if (!checkLeader(profiles)) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AccessDeniedPage />
      </Suspense>
    );
  }

  return <>{children}</>;
}

function ProtectedSongsRoute({ children }: { children: React.ReactNode }) {
  const { user, profiles } = useAuthStore();
  const { teams, loading } = useTeams();

  if (loading) return <PageLoader />;

  const hasWorshipMembership = teams.some(
    (team) =>
      team.team_type?.codigo === "louvor" &&
      team.members?.some((member) => member.user_id === user?.id),
  );

  const allowed =
    isGerencial(profiles) ||
    (isMember(profiles, "louvor") && hasWorshipMembership);

  if (!allowed) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AccessDeniedPage />
      </Suspense>
    );
  }

  return <>{children}</>;
}

function ProtectedMinistryRoute({
  teamType,
  children,
}: {
  teamType: TeamTypeCode;
  children: React.ReactNode;
}) {
  const { user, profiles } = useAuthStore();
  const { teams, loading } = useTeams();

  if (loading) return <PageLoader />;

  const hasTeamMembership = teams.some(
    (team) =>
      team.team_type?.codigo === teamType &&
      team.members?.some((member) => member.user_id === user?.id),
  );

  const allowed =
    isGerencial(profiles) ||
    (isMember(profiles, teamType) && hasTeamMembership);

  if (!allowed) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AccessDeniedPage />
      </Suspense>
    );
  }

  return <>{children}</>;
}

function DefaultRedirect() {
  const { user, profiles } = useAuthStore();
  const { teams, loading } = useTeams();

  if (isGerencial(profiles)) return <Navigate to="/gerencial" replace />;
  if (loading) return <PageLoader />;

  const firstAllowedTeam = teams.find(
    (team) =>
      team.team_type?.codigo &&
      isMember(profiles, team.team_type.codigo) &&
      team.members?.some((member) => member.user_id === user?.id),
  );

  const route = firstAllowedTeam?.team_type?.codigo
    ? TEAM_TYPE_ROUTES[firstAllowedTeam.team_type.codigo]
    : null;

  return <Navigate to={route || "/acesso-negado"} replace />;
}

function App() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <RouteLoader />;
  }

  if (!user) {
    return (
      <>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage user={user} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/test-connection" element={<TestConnectionPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
        <GlobalYoutubeMiniplayer />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<PageLoader />}>
              <HomePage user={user} />
            </Suspense>
          }
        />
        <Route path="/login" element={<Navigate to="/app" replace />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route path="app" element={<DefaultRedirect />} />
          <Route
            path="gerencial"
            element={
              <ProtectedGerencialRoute>
                <Suspense fallback={<PageLoader />}>
                  <GerencialDashboard />
                </Suspense>
              </ProtectedGerencialRoute>
            }
          />
          <Route
            path="gerencial/equipes"
            element={
              <ProtectedGerencialRoute>
                <Suspense fallback={<PageLoader />}>
                  <TeamsPage />
                </Suspense>
              </ProtectedGerencialRoute>
            }
          />
          <Route
            path="gerencial/usuarios"
            element={
              <ProtectedUsersRoute>
                <Suspense fallback={<PageLoader />}>
                  <UsersPage />
                </Suspense>
              </ProtectedUsersRoute>
            }
          />
          <Route
            path="gerencial/musicas"
            element={
              <ProtectedSongsRoute>
                <Suspense fallback={<PageLoader />}>
                  <SongsPage />
                </Suspense>
              </ProtectedSongsRoute>
            }
          />
          <Route
            path="louvor"
            element={
              <ProtectedMinistryRoute teamType="louvor">
                <Suspense fallback={<PageLoader />}>
                  <WorshipDashboard />
                </Suspense>
              </ProtectedMinistryRoute>
            }
          />
          <Route
            path="danca"
            element={
              <ProtectedMinistryRoute teamType="danca">
                <Suspense fallback={<PageLoader />}>
                  <DanceDashboard />
                </Suspense>
              </ProtectedMinistryRoute>
            }
          />
          <Route
            path="midia"
            element={
              <ProtectedMinistryRoute teamType="midia">
                <Suspense fallback={<PageLoader />}>
                  <MediaDashboard />
                </Suspense>
              </ProtectedMinistryRoute>
            }
          />
          <Route
            path="obreiros"
            element={
              <ProtectedMinistryRoute teamType="obreiros">
                <Suspense fallback={<PageLoader />}>
                  <UshersDashboard />
                </Suspense>
              </ProtectedMinistryRoute>
            }
          />
          <Route
            path="celulas"
            element={
              <ProtectedMinistryRoute teamType="celula">
                <Suspense fallback={<PageLoader />}>
                  <CellsDashboard />
                </Suspense>
              </ProtectedMinistryRoute>
            }
          />
          <Route
            path="acesso-negado"
            element={
              <Suspense fallback={<PageLoader />}>
                <AccessDeniedPage />
              </Suspense>
            }
          />
          <Route
            path="test-connection"
            element={
              <Suspense fallback={<PageLoader />}>
                <TestConnectionPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalYoutubeMiniplayer />
      <Toaster />
    </>
  );
}

export default App;
