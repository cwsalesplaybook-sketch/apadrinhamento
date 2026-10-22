import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, ChartNoAxesCombined, Eye, EyeOff, Lock, Mail, Rocket, Star, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Estrela } from "@/components/AppLayout";

/** Itens do painel da marca (mesmas abas do menu, com os ícones do mockup). */
const ITENS = [
  { label: "Capacitações e materiais", icon: Star },
  { label: "Sobre o time", icon: Users },
  { label: "Forms da vaga", icon: ChartNoAxesCombined },
  { label: "Onboarding", icon: Rocket },
];

function Campo({
  icon: I,
  fim,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail; fim?: ReactNode }) {
  return (
    <label className="campo-login flex items-center gap-4 px-6">
      <I className="h-6 w-6 shrink-0 text-ink" strokeWidth={1.8} />
      <input
        {...props}
        className="h-16 min-w-0 flex-1 bg-transparent text-lg text-ink outline-none placeholder:text-[#8b7aa3]"
      />
      {fim}
    </label>
  );
}

/** Seta desenhada à mão que sai do "Juntos por mais estrelas!" em direção ao cardapinho. */
function SetaMao({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 70" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <path d="M4 62 C 30 66, 40 50, 34 38 C 28 26, 44 14, 72 8" />
      <path d="M60 4 L 73 8 L 64 18" />
    </svg>
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
      navigate({ to: "/capacitacoes" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: window.location.origin + "/capacitacoes" },
      });
      setCarregando(false);
      if (error) return toast.error(error.message);
      toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
      setModo("entrar");
    }
  }

  return (
    <div className="stars-pagina min-h-screen lg:grid lg:grid-cols-[59%_41%]">
      {/* Painel da marca */}
      <section className="stars-marca relative overflow-hidden px-6 pb-8 pt-8 text-white lg:min-h-screen lg:px-[7%] lg:pb-0 lg:pt-[4.2vh]">
        <img src="/brand/logo-cw-eminence.webp" alt="Cardápio Web" className="relative z-10 h-14 lg:h-[clamp(52px,7vh,64px)]" />

        <div className="relative z-10 mt-6 lg:mt-[3.5vh]">
          <span className="rotulo inline-flex items-center gap-3 rounded-full border-[1.5px] border-[#ffb600]/80 px-5 py-2 text-[12px] text-[#ffcf5c] lg:px-6 lg:py-2.5 lg:text-[14px]">
            <Estrela className="h-5 w-5 text-[#ffb600]" /> Portal dos representantes
          </span>
          <h1 className="titulo-h1 mt-4 whitespace-nowrap text-[58px] leading-[0.95] lg:text-[clamp(64px,6vw,112px)]">
            CW{" "}
            <span className="stars-dourado">
              ST
              <span className="relative inline-block">
                A
                <Estrela className="absolute left-1/2 top-[52%] h-[0.2em] w-[0.2em] -translate-x-1/2 text-[#3b0f7a]" />
              </span>
              RS
            </span>
          </h1>
          <p className="mt-5 max-w-[520px] text-lg leading-snug text-white/90 lg:text-[clamp(18px,1.45vw,24px)]">
            Tudo o que um <strong className="font-black text-white">representante estrela</strong> precisa para montar e
            fazer crescer o próprio time.
          </p>
          <ul className="mt-7 grid max-w-[360px] gap-2.5 lg:mt-[4.5vh] lg:gap-[1.4vh]">
            {ITENS.map((item) => (
              <li
                key={item.label}
                className="stars-pilula flex items-center gap-4 rounded-[22px] px-6 py-3 text-[17px] lg:py-[1.45vh] lg:text-[clamp(16px,1.2vw,20px)]"
              >
                <item.icon className="h-6 w-6 shrink-0 text-[#ffb600]" strokeWidth={1.8} />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Cardapinho com o balão */}
        <figure className="relative z-10 mx-auto mt-8 flex max-w-[360px] items-start lg:absolute lg:bottom-[3%] lg:right-[4%] lg:mt-0 lg:block lg:w-[clamp(260px,19.5vw,380px)] lg:max-w-none">
          <blockquote className="stars-balao relative z-10 w-[190px] shrink-0 px-6 py-5 text-[15px] font-bold leading-snug text-[#3b0f7a] lg:absolute lg:-left-[24%] lg:-top-[9%] lg:w-[clamp(190px,11.6vw,230px)] lg:px-7 lg:text-[clamp(13px,0.9vw,16px)]">
            Seu próximo nível começa aqui.
          </blockquote>
          <img
            src="/brand/cardapinho-stars.webp"
            alt="Cardapinho abraçando uma estrela dourada"
            className="-ml-6 mt-10 w-40 select-none drop-shadow-[0_28px_34px_rgba(10,0,30,0.6)] lg:ml-0 lg:mt-0 lg:w-full"
          />
        </figure>

        {/* Assinatura à mão */}
        <div className="pointer-events-none absolute bottom-[6%] left-[31%] z-10 hidden items-end gap-1 text-[#a46bff] lg:flex">
          <span className="stars-mao -rotate-[9deg] text-[clamp(26px,2.3vw,38px)] leading-[0.9]">
            Juntos por
            <br />
            mais estrelas!
          </span>
          <SetaMao className="mb-3 w-[clamp(60px,5vw,90px)]" />
        </div>
      </section>

      {/* Formulário */}
      <section className="stars-lado-form relative flex items-center justify-center overflow-hidden px-5 py-10 lg:min-h-screen lg:px-[7%]">
        <form onSubmit={enviar} className="login-cartao relative z-10 w-full max-w-[560px] px-7 py-10 sm:px-[52px] sm:py-[52px]">
          <div className="flex items-center gap-3">
            <Estrela className="h-6 w-6 text-[#ffb600]" />
            <span className="rotulo text-[15px] text-primary">CW Stars</span>
          </div>
          <h2 className="titulo-h1 mt-4 text-[38px] leading-none text-[#2e0b6a] sm:text-[46px] lg:text-[clamp(34px,2.45vw,46px)]">
            {modo === "entrar" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p className="mt-4 text-lg text-[#7d6b98] sm:text-xl">
            {modo === "entrar" ? "Entre para acessar o portal das estrelas." : "Cadastre seu e-mail para acessar o portal."}
          </p>
          <div className="mt-10 space-y-4">
            <Campo
              icon={Mail}
              type="email"
              required
              placeholder="seuemail@cardapioweb.com"
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
              placeholder="Sua senha"
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
                  {verSenha ? <Eye className="h-6 w-6" strokeWidth={1.8} /> : <EyeOff className="h-6 w-6" strokeWidth={1.8} />}
                </button>
              }
            />
          </div>
          <button
            type="submit"
            disabled={carregando}
            className="stars-botao mt-7 flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-[22px] font-black text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
            {!carregando && <ArrowRight className="h-6 w-6" strokeWidth={2.4} />}
          </button>
          <div className="mt-8 flex items-center gap-4 text-sm text-[#8b7aa3]">
            <span className="h-px flex-1 bg-[#e6dcf2]" />
            ou
            <span className="h-px flex-1 bg-[#e6dcf2]" />
          </div>
          <button
            type="button"
            className="mt-4 block w-full text-center text-lg font-bold text-[#7a2be0] hover:underline"
            onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
          >
            {modo === "entrar" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
          </button>
        </form>
      </section>
    </div>
  );
}
