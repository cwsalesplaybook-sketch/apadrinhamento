import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

/** Em `npm run dev`, atende /api/jornada com o mesmo código da função da Vercel. */
function apiLocal(): Plugin {
  return {
    name: "api-local",
    configureServer(server) {
      server.middlewares.use("/api/jornada", async (req, res) => {
        const { tratar } = await server.ssrLoadModule("/api/_jornada-core.js");
        let corpo: string | undefined;
        if (req.method === "POST") {
          corpo = "";
          for await (const pedaco of req) corpo += pedaco;
        }
        const resposta: Response = await tratar(
          new Request(`http://localhost${req.url ?? ""}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: corpo,
          }),
        );
        res.statusCode = resposta.status;
        resposta.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(await resposta.text());
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiLocal()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
