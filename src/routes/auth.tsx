import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      setCarregando(false);
      if (error) return toast.error("E-mail ou senha incorretos");
      navigate({ to: "/painel" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: window.location.origin + "/painel" },
      });
      setCarregando(false);
      if (error) return toast.error(error.message);
      toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
      setModo("entrar");
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="pattern-cw relative hidden overflow-hidden p-10 md:flex md:items-center md:justify-center">
        <div className="relative z-10 w-full max-w-md rounded-3xl bg-ink p-9 text-ink-foreground shadow-2xl">
          <img src="/brand/logo-cw-eminence.webp" alt="Cardápio Web" className="h-20" />
          <h1 className="titulo-h1 mt-6 text-5xl leading-none">RADAR DOS REPS</h1>
          <p className="titulo-h2 mt-3 text-lg text-warning">Visão completa da jornada dos representantes.</p>
          <div className="mt-8 flex gap-10 text-sm">
            <div>
              <div className="num text-3xl text-warning">4/6</div>
              ativação até D30
            </div>
            <div>
              <div className="num text-3xl text-warning">3/6</div>
              autonomia até D60
            </div>
          </div>
        </div>
        <img
          src="/brand/cardapinho-trofeu.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-6 z-20 h-64 select-none drop-shadow-2xl"
        />
      </div>
      <div className="flex items-start justify-center p-6 md:items-center">
        <form onSubmit={enviar} className="w-full max-w-sm space-y-5">
          <div className="-mx-6 -mt-6 mb-2 rounded-b-3xl bg-ink px-6 py-6 md:hidden">
            <img src="/brand/logo-cw-eminence.webp" alt="Cardápio Web" className="h-12" />
            <div className="titulo-h1 mt-3 text-2xl text-ink-foreground">RADAR DOS REPS</div>
            <p className="titulo-h2 text-sm text-warning">Visão completa da jornada dos representantes.</p>
          </div>
          <h2 className="titulo-h1 text-3xl text-ink">{modo === "entrar" ? "Entrar" : "Criar conta"}</h2>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
          >
            {modo === "entrar" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
          </button>
        </form>
      </div>
    </div>
  );
}
