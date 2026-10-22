import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Coroa, NAV } from "@/components/AppLayout";

function Campo({
  icon: I,
  fim,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail; fim?: ReactNode }) {
  return (
    <label className="campo-login flex items-center gap-4 px-5">
      <I className="h-5 w-5 shrink-0 text-ink" strokeWidth={1.8} />
      <input
        {...props}
        className="h-14 min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-[#8b7aa3]"
      />
      {fim}
    </label>
  );
}

/** Traço curvo desenhado à mão ao lado do "Mais representantes. Mais conquistas." */
function TracoMao({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 90" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M8 4 C 40 14, 52 40, 40 62 C 32 76, 18 84, 6 86" />
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
    <div className="valhalla-pagina min-h-screen lg:grid lg:grid-cols-[60.6%_39.4%]">
      {/* Painel da marca */}
      <section className="valhalla-marca relative overflow-hidden px-6 pb-8 pt-8 text-white lg:min-h-screen lg:px-[6.3%] lg:pb-0 lg:pt-[4vh]">
        <img src="/brand/logo-cw-eminence.webp" alt="Cardápio Web" className="relative z-10 h-12 lg:h-[clamp(44px,5.6vh,56px)]" />

        <div className="relative z-10 mt-6 lg:mt-[3.4vh]">
          <span className="valhalla-selo rotulo inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[11px] text-white lg:text-[12px]">
            <Coroa className="h-4 w-4 text-[#ffb600]" /> Portal dos representantes
          </span>
          <h1 className="mt-3 leading-none">
            <span className="flex items-end gap-4">
              <span className="valhalla-cw titulo-h1 text-[64px] leading-[0.85] lg:text-[clamp(64px,5.6vw,104px)]">CW</span>
              <Coroa className="mb-1 h-12 w-12 text-[#ffb600] drop-shadow-[0_4px_10px_rgba(255,170,0,0.45)] lg:h-[clamp(44px,3.8vw,72px)] lg:w-[clamp(44px,3.8vw,72px)]" />
            </span>
            <span className="valhalla-titulo block whitespace-nowrap text-[58px] leading-[0.95] lg:text-[clamp(64px,6.2vw,116px)]">
              VALHALLA
            </span>
          </h1>
          <p className="mt-4 max-w-[480px] text-lg leading-snug text-white/90 lg:text-[clamp(17px,1.15vw,20px)]">
            Tudo o que um <strong className="font-black text-white">representante valhalla</strong> precisa para{" "}
            <strong className="font-black text-[#ffc233]">liderar</strong>,{" "}
            <strong className="font-black text-[#ffc233]">expandir</strong> e{" "}
            <strong className="font-black text-[#ffc233]">conquistar mais</strong>.
          </p>
          <ul className="mt-6 grid max-w-[270px] gap-2.5 lg:mt-[3.3vh] lg:gap-[1.3vh]">
            {NAV.map((item) => (
              <li
                key={item.to}
                className="valhalla-pilula flex items-center gap-4 rounded-xl px-5 py-3 text-[15px] lg:py-[1.35vh] lg:text-[clamp(14px,0.95vw,16px)]"
              >
                <item.icon className="h-5 w-5 shrink-0 text-[#ffb600]" strokeWidth={1.9} />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Cardapinho viking em cima da pedra */}
        <img
          src="/brand/cardapinho-viking.webp"
          alt="Cardapinho viking com espada e escudo"
          className="relative z-10 mx-auto mt-6 w-64 select-none drop-shadow-[0_30px_36px_rgba(10,0,30,0.7)] lg:absolute lg:bottom-[8%] lg:right-[7%] lg:mt-0 lg:w-[clamp(300px,25.5vw,480px)]"
        />

        {/* Assinatura à mão */}
        <div className="pointer-events-none absolute bottom-[7%] left-[40%] z-10 hidden items-center gap-1 text-[#c9a6ff] lg:flex">
          <span className="valhalla-mao -rotate-[10deg] text-[clamp(22px,1.75vw,32px)] leading-[1.05]">
            Mais
            <br />
            representantes.
            <br />
            Mais conquistas.
          </span>
          <TracoMao className="w-[clamp(26px,2vw,38px)] -rotate-[10deg]" />
        </div>
      </section>

      {/* Formulário */}
      <section className="valhalla-lado-form relative flex items-center justify-center overflow-hidden px-5 py-10 lg:min-h-screen lg:px-[8%]">
        <form onSubmit={enviar} className="login-cartao relative z-10 w-full max-w-[420px] px-7 py-10 sm:px-10">
          <div className="flex items-center gap-2.5">
            <Coroa className="h-6 w-6 text-[#ffb600]" />
            <span className="rotulo text-[12px] text-primary">CW Valhalla</span>
          </div>
          <h2 className="titulo-h1 mt-3 text-[34px] leading-none text-[#2e0b6a]">
            {modo === "entrar" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p className="mt-3 text-[15px] text-[#7d6b98]">
            {modo === "entrar" ? "Entre para acessar o portal dos valhalla." : "Cadastre seu e-mail para acessar o portal."}
          </p>
          <div className="mt-7 space-y-3.5">
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
                  {verSenha ? <Eye className="h-5 w-5" strokeWidth={1.8} /> : <EyeOff className="h-5 w-5" strokeWidth={1.8} />}
                </button>
              }
            />
          </div>
          <button
            type="submit"
            disabled={carregando}
            className="valhalla-botao mt-5 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl text-lg font-black text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
            {!carregando && <ArrowRight className="h-5 w-5" strokeWidth={2.4} />}
          </button>
          <div className="mt-6 flex items-center gap-4 text-xs text-[#8b7aa3]">
            <span className="h-px flex-1 bg-[#e6dcf2]" />
            ou
            <span className="h-px flex-1 bg-[#e6dcf2]" />
          </div>
          <button
            type="button"
            className="mt-3 block w-full text-center text-[15px] font-bold text-[#7a2be0] hover:underline"
            onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
          >
            {modo === "entrar" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
          </button>
        </form>
      </section>
    </div>
  );
}
