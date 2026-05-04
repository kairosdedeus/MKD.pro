import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

// Rotas que não mostram breadcrumb (têm UI própria)
const NO_BREADCRUMB = ["/louvor", "/gerencial/musicas"];

export function DashboardLayout() {
  const { pathname } = useLocation();
  const showBreadcrumb = !NO_BREADCRUMB.some((r) => pathname.startsWith(r));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        {showBreadcrumb && <Breadcrumbs />}
        <main className="flex-1 overflow-y-auto bg-background main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
