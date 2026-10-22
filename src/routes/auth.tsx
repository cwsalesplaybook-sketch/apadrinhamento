import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Estrela, NAV } from "@/components/AppLayout";

/** Céu de estrelas pequenas espalhadas no painel da marca (posições fixas). */
const CEU = [
  [8, 12, 10], [22, 6, 6], [38, 18, 8], [56, 9, 5], [71, 15, 9], [88, 7, 6], [94, 26, 5],
  [14, 34, 5], [30, 44, 7], [62, 38, 5], [80, 48, 8], [6, 62, 7], [46, 70, 5], [92, 66, 6],
  [20, 86, 6], [68, 90, 5], [84, 82, 9], [36, 94, 5],
] as const;

function Campo({
  icon: I,
  fim,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail; fim?: ReactNode }) {
  return (
    <label className="campo-login flex items-center gap-4 px-5">
      <I className="h-6 w-6 shrink-0 text-ink" strokeWidth={1.9} />
      <input
        {...props}
        className="h-15 min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-muted-foreground"
      />
      {fim}
    </label>
  );
}

export function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      setCarregando(false);
      if (error) return toast.error("E-mail ou senha incorretos");
      navigate({ to: "/contratacao" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: window.location.origin + "/contratacao" },
      });
      setCarregando(false);
      if (error) return toast.error(error.message);
      toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
      setModo("entrar");
    }
  }

  return (
    <div className="login-fundo min-h-screen lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* Painel da marca */}
      <section className="stars-marca relative flex flex-col overflow-hidden px-6 pb-10 pt-8 text-white lg:min-h-screen lg:px-[7%] lg:pb-12 lg:pt-12">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {CEU.map(([x, y, t], i) => (
            <Estrela
              key={i}
              className="stars-cintila absolute text-white/40"
              style={{ left: `${x}%`, top: `${y}%`, width: t, height: t, animationDelay: `${(i % 6) * 0.7}s` }}
            />
          ))}
        </div>

        <img src="/brand/logo-cw-eminence.webp" alt="Cardápio Web" className="relative z-10 h-12 self-start lg:h-16" />

        <div className="relative z-10 mt-10 lg:mt-14">
          <span className="rotulo inline-flex items-center gap-2 rounded-full border border-[#ffb600]/40 bg-[#ffb600]/10 px-3.5 py-1.5 text-[11px] text-[#ffcf5c]">
            <Estrela className="h-3.5 w-3.5" /> Portal dos representantes
          </span>
          <h1 className="titulo-h1 mt-5 text-[52px] leading-[0.92] lg:text-[clamp(64px,6.4vw,104px)]">
            CW <span className="stars-dourado">STARS</span>
          </h1>
          <p className="mt-4 max-w-md text-lg leading-snug text-white/85 lg:text-xl">
            Tudo o que um representante estrela precisa para montar e fazer crescer o próprio time.
          </p>
        </div>

        <div className="relative z-10 mt-8 flex flex-1 flex-col items-start gap-6 lg:mt-6 lg:flex-row lg:items-end">
          <ul className="grid w-full max-w-sm grid-cols-2 gap-2.5 lg:mb-6 lg:w-auto lg:grid-cols-1">
            {NAV.map((item) => (
              <li key={item.to} className="stars-pilula flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold">
                <item.icon className="h-5 w-5 shrink-0 text-[#ffcf5c]" strokeWidth={1.9} />
                {item.label}
              </li>
            ))}
          </ul>
          <figure className="flex w-full items-center justify-center gap-3 lg:relative lg:ml-auto lg:block lg:w-auto">
            <blockquote className="stars-balao w-44 rounded-3xl rounded-br-md px-4 py-3 text-sm font-bold leading-snug text-[#3b0f7a] lg:absolute lg:-left-40 lg:top-2 lg:w-52 lg:px-5 lg:py-4 lg:text-[15px]">
              “Sou um representante estrela. <span className="text-primary">Meu lugar é aqui.</span>”
            </blockquote>
            <img
              src="/brand/cardapinho-stars.webp"
              alt="Cardapinho abraçando uma estrela dourada"
              className="w-32 select-none lg:w-[min(25vw,330px)] drop-shadow-[0_28px_34px_rgba(10,0,30,0.65)]"
            />
          </figure>
        </div>
      </section>

      {/* Formulário */}
      <section className="relative flex items-center justify-center px-5 py-10 lg:min-h-screen lg:px-[6%]">
        <form onSubmit={enviar} className="login-cartao relative z-10 w-full max-w-[520px] px-7 py-10 sm:px-12 sm:py-12">
          <div className="flex items-center gap-2 text-primary">
            <Estrela className="h-5 w-5 text-[#ffb600]" />
            <span className="rotulo text-xs">CW Stars</span>
          </div>
          <h2 className="titulo-h1 mt-3 text-[40px] leading-none text-[#3b0f7a] sm:text-[44px]">
            {modo === "entrar" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {modo === "entrar" ? "Entre para acessar o portal das estrelas." : "Cadastre seu e-mail para acessar o portal."}
          </p>
          <div className="mt-9 space-y-4">
            <Campo
              icon={Mail}
              type="email"
              required
              placeholder="E-mail"
              aria-label="E-mail"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Campo
              icon={Lock}
              type={verSenha ? "text" : "password"}
              required
              minLength={6}
              placeholder="Senha"
              aria-label="Senha"
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              fim={
                <button
                  type="button"
                  onClick={() => setVerSenha(!verSenha)}
                  aria-label={verSenha ? "Esconder senha" : "Mostrar senha"}
                  className="text-ink"
                >
                  {verSenha ? <EyeOff className="h-6 w-6" strokeWidth={1.9} /> : <Eye className="h-6 w-6" strokeWidth={1.9} />}
                </button>
              }
            />
          </div>
          <button
            type="submit"
            disabled={carregando}
            className="botao-3d mt-8 flex h-15 w-full items-center justify-center gap-3 rounded-2xl text-xl font-black text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
            {!carregando && <ArrowRight className="h-6 w-6" />}
          </button>
          <button
            type="button"
            className="mt-7 block w-full text-center font-black text-primary hover:underline"
            onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
          >
            {modo === "entrar" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
          </button>
        </form>
      </section>
    </div>
  );
}
