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
      <div className="hidden flex-col justify-between bg-ink p-12 text-ink-foreground md:flex">
        <div className="text-xs uppercase tracking-[0.25em] opacity-60">Cardápio Web · Programa de Representantes</div>
        <div>
          <h1 className="text-5xl font-semibold leading-tight">
            Do treino à <span className="text-primary">primeira venda</span>.
          </h1>
          <p className="mt-4 max-w-md opacity-70">
            Acompanhe as duplas, registre as weeklies e veja os indicadores do ciclo.
          </p>
        </div>
        <div className="flex gap-10 text-sm opacity-80">
          <div>
            <div className="num text-3xl text-primary">4/6</div>
            ativação até D30
          </div>
          <div>
            <div className="num text-3xl text-primary">3/6</div>
            autonomia até D60
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={enviar} className="w-full max-w-sm space-y-5">
          <h2 className="text-2xl font-semibold">{modo === "entrar" ? "Entrar" : "Criar conta"}</h2>
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
