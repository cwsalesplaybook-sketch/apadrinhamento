import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { supabase } from "@/lib/supabase";
import { AuthPage } from "@/routes/auth";
import { PainelPage } from "@/routes/painel";
import { DuplasPage } from "@/routes/duplas";
import { DuplaPage } from "@/routes/dupla";
import { WeekliesPage } from "@/routes/weeklies";
import { WeeklyPage } from "@/routes/weekly";
import { HistoricoPage } from "@/routes/historico";
import { TemplatesPage } from "@/routes/templates";
import { PlaybookPage } from "@/routes/playbook";
import { DailyPage } from "@/routes/daily";
import { AnexosPage } from "@/routes/anexos";
import "./styles.css";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <img src="/brand/cardapinho-acenando.webp" alt="" aria-hidden className="mx-auto mb-4 h-40 select-none" />
        <h1 className="titulo-h1 text-7xl text-ink">404</h1>
        <h2 className="titulo-h2 mt-2 text-xl text-primary">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">A página que você procura não existe ou foi movida.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
  notFoundComponent: NotFound,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
});

const authRoute = createRoute({ getParentRoute: () => rootRoute, path: "/auth", component: AuthPage });

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_authenticated",
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Outlet,
});

const painelRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/painel", component: PainelPage });
const duplasRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/duplas", component: DuplasPage });
const duplaRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/duplas/$id", component: DuplaPage });
const historicoRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/historico",
  component: HistoricoPage,
});
const templatesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/templates",
  component: TemplatesPage,
});
const playbookRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/playbook",
  component: PlaybookPage,
});
const dailyRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/daily", component: DailyPage });
const anexosRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/anexo", component: AnexosPage });
const weekliesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/weeklies",
  component: WeekliesPage,
});
const weeklyRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/weeklies/$id",
  component: WeeklyPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute,
  authenticatedRoute.addChildren([painelRoute, duplasRoute, duplaRoute, historicoRoute, templatesRoute, playbookRoute, dailyRoute, anexosRoute, weekliesRoute, weeklyRoute]),
]);

const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
