import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

/** Alvo 3D com dardo (ilustração do mockup), desenhado em SVG. */
function Alvo3D({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 330" className={className} aria-hidden>
      <defs>
        <linearGradient id="fita" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b2ff7" stopOpacity="0.9" />
          <stop offset="1" stopColor="#5b1bb5" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="lateral" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7a2be6" />
          <stop offset="1" stopColor="#3d0f86" />
        </linearGradient>
        <radialGradient id="face" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#b56bff" />
          <stop offset="0.6" stopColor="#8b2ff7" />
          <stop offset="1" stopColor="#6a1fd0" />
        </radialGradient>
        <radialGradient id="branco" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6dcf7" />
        </radialGradient>
        <linearGradient id="haste" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#f5a300" />
          <stop offset="1" stopColor="#ffd34d" />
        </linearGradient>
        <filter id="sombra" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#12002e" floodOpacity="0.55" />
        </filter>
      </defs>
      {/* fita roxa que contorna o alvo */}
      <path
        d="M74 186 C 50 300, 200 330, 334 262 C 190 352, 20 320, 48 190 Z"
        fill="url(#fita)"
      />
      {/* raios de destaque */}
      <g stroke="#ffb600" strokeWidth="12" strokeLinecap="round">
        <line x1="62" y1="38" x2="76" y2="66" />
        <line x1="20" y1="58" x2="46" y2="76" />
        <line x1="12" y1="104" x2="40" y2="104" />
      </g>
      <g filter="url(#sombra)" transform="rotate(-18 165 170)">
        {/* espessura do disco */}
        <ellipse cx="172" cy="182" rx="98" ry="104" fill="url(#lateral)" />
        {/* face do alvo */}
        <ellipse cx="160" cy="168" rx="98" ry="104" fill="url(#face)" />
        <ellipse cx="160" cy="168" rx="72" ry="77" fill="url(#branco)" />
        <ellipse cx="160" cy="168" rx="50" ry="53" fill="url(#face)" />
        <ellipse cx="160" cy="168" rx="30" ry="32" fill="url(#branco)" />
        <ellipse cx="160" cy="168" rx="14" ry="15" fill="#7b2be8" />
      </g>
      {/* dardo: haste amarela com penas na cauda */}
      <g>
        <line x1="150" y1="172" x2="258" y2="66" stroke="url(#haste)" strokeWidth="11" strokeLinecap="round" />
        <circle cx="150" cy="172" r="7" fill="#d9d2e6" />
        <path d="M236 88 L 260 64 L 250 26 L 226 62 Z" fill="#ffb600" />
        <path d="M236 88 L 260 64 L 298 74 L 262 98 Z" fill="#ffc933" />
        <path d="M236 88 L 260 64 L 250 26 Z" fill="#f29a00" opacity="0.55" />
      </g>
    </svg>
  );
}

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
        className="h-16 min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-muted-foreground"
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
    <div className="login-fundo relative min-h-screen overflow-hidden lg:grid lg:grid-cols-[55%_45%]">
      {/* Painel da marca */}
      <section className="login-marca relative overflow-hidden px-6 pb-10 pt-8 text-white lg:min-h-screen lg:px-[8%] lg:pt-14">
        <svg
          viewBox="0 0 1000 380"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[38%] w-full lg:block"
          aria-hidden
        >
          <defs>
            <linearGradient id="onda" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7a35e6" />
              <stop offset="1" stopColor="#5a1bbd" />
            </linearGradient>
          </defs>
          <path d="M0 40 C 220 20, 420 120, 600 210 S 900 360, 1000 380 L 0 380 Z" fill="url(#onda)" />
          <path d="M0 40 C 220 20, 420 120, 600 210 S 900 360, 1000 380" fill="none" stroke="#a46bff" strokeOpacity="0.5" strokeWidth="2" />
        </svg>
        <img src="/brand/logo-cw-eminence.webp" alt="Cardápio Web" className="relative z-10 h-16 lg:h-28" />
        <Alvo3D className="pointer-events-none absolute right-[4%] top-[14%] z-10 hidden w-[34%] max-w-[340px] lg:block" />
        <div className="relative z-10 mt-6 lg:mt-12">
          <h1 className="titulo-h1 text-[40px] leading-[0.95] lg:text-[clamp(56px,5.4vw,84px)]">
            RADAR DOS
            <br />
            <span className="text-[#a855f7]">REPS</span>
          </h1>
          <p className="mt-4 max-w-md text-lg leading-snug text-white/90 lg:text-[22px]">
            Visão completa da jornada dos representantes.
          </p>
          <div className="mt-7 flex items-center gap-10 lg:mt-9">
            <div>
              <div className="num text-3xl lg:text-4xl">4/6</div>
              <div className="mt-1 text-white/90">ativação até D30</div>
            </div>
            <div className="h-14 w-px bg-white/30" />
            <div>
              <div className="num text-3xl lg:text-4xl">3/6</div>
              <div className="mt-1 text-white/90">autonomia até D60</div>
            </div>
          </div>
        </div>
        <img
          src="/brand/cardapinho-mesa.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-[4%] z-10 hidden w-[32%] max-w-[380px] select-none drop-shadow-[0_24px_30px_rgba(10,0,30,0.6)] lg:block"
        />
      </section>

      {/* Formulário */}
      <section className="login-lado-form relative flex items-center justify-center px-5 py-10 lg:min-h-screen lg:px-[6%]">
        <svg viewBox="0 0 80 80" className="pointer-events-none absolute right-[5%] top-[9%] hidden w-20 lg:block" aria-hidden>
          <g stroke="#8b2ff7" strokeWidth="7" strokeLinecap="round">
            <line x1="14" y1="8" x2="10" y2="28" />
            <line x1="44" y1="22" x2="28" y2="38" />
            <line x1="70" y1="50" x2="48" y2="56" />
          </g>
        </svg>
        <svg
          viewBox="0 0 300 260"
          preserveAspectRatio="none"
          className="pointer-events-none absolute bottom-0 right-0 hidden h-[36%] w-[30%] lg:block"
          aria-hidden
        >
          <defs>
            <linearGradient id="gota" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b06bff" />
              <stop offset="1" stopColor="#7322e6" />
            </linearGradient>
          </defs>
          <path d="M300 0 C 250 40, 240 120, 170 170 S 40 220, 0 260 L 300 260 Z" fill="url(#gota)" />
        </svg>
        <form onSubmit={enviar} className="login-cartao relative z-10 w-full max-w-[580px] px-7 py-10 sm:px-14 sm:py-14">
          <h2 className="titulo-h1 text-[44px] leading-none text-[#3b0f7a] sm:text-5xl">
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {modo === "entrar" ? "Acesse sua conta para continuar" : "Cadastre seu e-mail para acessar"}
          </p>
          <div className="mt-10 space-y-5">
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
            className="botao-3d mt-8 flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-xl font-black text-white transition hover:brightness-110 disabled:opacity-60"
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
