import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Outlet, RouterProvider, createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { Layout } from "@/components/Layout";
import { InicioPage } from "@/routes/inicio";
import { JornadaPage } from "@/routes/jornada";
import { NiveisPage } from "@/routes/niveis";
import { EstrelasPage } from "@/routes/estrelas";
import { CronogramaPage } from "@/routes/cronograma";
import { PlanejamentoPage } from "@/routes/planejamento";
import { TrilhaPage } from "@/routes/trilha";
import "./styles.css";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="py-16 text-center">
      <img src="/brand/cardapinho-viking.webp" alt="" aria-hidden className="mx-auto mb-4 h-40 select-none" />
      <h1 className="titulo-ouro text-7xl">404</h1>
      <h2 className="mt-2 text-xl">Página não encontrada</h2>
      <p className="mt-2 text-sm text-suave">A página que você procura não existe ou foi movida.</p>
      <Link to="/" className="botao botao-primario mt-6">
        Voltar ao início
      </Link>
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
});

const layoutRoute = createRoute({ getParentRoute: () => rootRoute, id: "_layout", component: Layout, notFoundComponent: NotFound });

const pagina = <P extends string>(path: P, component: () => React.ReactNode) => createRoute({ getParentRoute: () => layoutRoute, path, component });

// Endereços antigos (login e abas do Valhalla) caem no início.
const antigos = ["/auth", "/capacitacoes", "/time", "/vaga", "/onboarding"].map((path) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path,
    beforeLoad: () => {
      throw redirect({ to: "/" });
    },
  }),
);

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    pagina("/", InicioPage),
    pagina("/jornada", JornadaPage),
    pagina("/niveis", NiveisPage),
    pagina("/estrelas", EstrelasPage),
    pagina("/cronograma", CronogramaPage),
    pagina("/planejamento", PlanejamentoPage),
    pagina("/trilha", TrilhaPage),
  ]),
  ...antigos,
]);

const router = createRouter({ routeTree, defaultPreload: "intent", defaultNotFoundComponent: NotFound, scrollRestoration: true });

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
