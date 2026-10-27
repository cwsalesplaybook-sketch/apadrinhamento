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
import { CapacitacoesPage } from "@/routes/capacitacoes";
import { TimePage } from "@/routes/time";
import { VagaPage } from "@/routes/vaga";
import { OnboardingPage } from "@/routes/onboarding";
import "./styles.css";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <img src="/brand/cardapinho-viking.webp" alt="" aria-hidden className="mx-auto mb-4 h-40 select-none" />
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
    throw redirect({ to: "/capacitacoes" });
  },
});

// Sem login: links antigos para /auth caem direto no portal.
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  beforeLoad: () => {
    throw redirect({ to: "/capacitacoes" });
  },
});

const capacitacoesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/capacitacoes",
  component: CapacitacoesPage,
});
const timeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/time", component: TimePage });
const vagaRoute = createRoute({ getParentRoute: () => rootRoute, path: "/vaga", component: VagaPage });
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: OnboardingPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute,
  capacitacoesRoute,
  timeRoute,
  vagaRoute,
  onboardingRoute,
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
