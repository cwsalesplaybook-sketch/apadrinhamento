import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Dupla } from "@/lib/apadrinhamento";
import { cn } from "@/lib/utils";

export const PADRINHO_PADRAO = "Gabrielly Oliveira";
const ADICIONAR = "__adicionar__";

/** Padrinhos já usados nas duplas (cache do Supabase), com a Gabrielly sempre primeiro. */
function usePadrinhos(atual?: string) {
  const qc = useQueryClient();
  const duplas = qc.getQueryData<Dupla[]>(["duplas"]) ?? [];
  const nomes = new Set([PADRINHO_PADRAO, ...duplas.map((d) => d.padrinho?.trim()).filter(Boolean)]);
  if (atual?.trim()) nomes.add(atual.trim());
  return [PADRINHO_PADRAO, ...[...nomes].filter((n) => n !== PADRINHO_PADRAO).sort((a, b) => a.localeCompare(b, "pt-BR"))];
}

/** Lista de padrinhos + "Adicionar pessoa", que troca para um campo de texto. */
export function SeletorPadrinho({
  valor,
  aoMudar,
  className,
  autoFocus,
  aoSair,
}: {
  valor: string;
  aoMudar: (nome: string) => void;
  className?: string;
  autoFocus?: boolean;
  /** Chamado ao terminar (blur/Enter) — usado na edição inline. */
  aoSair?: (nome: string) => void;
}) {
  const opcoes = usePadrinhos(valor);
  const [novo, setNovo] = useState(false);
  const classe = cn("w-full rounded-md border bg-background px-3 py-2 text-sm", className);

  if (novo)
    return (
      <input
        autoFocus
        className={classe}
        placeholder="Nome do padrinho"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        onBlur={() => aoSair?.(valor)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            aoSair?.(valor);
          }
          if (e.key === "Escape") setNovo(false);
        }}
      />
    );

  return (
    <select
      autoFocus={autoFocus}
      className={classe}
      value={valor}
      onChange={(e) => {
        if (e.target.value === ADICIONAR) {
          aoMudar("");
          setNovo(true);
          return;
        }
        aoMudar(e.target.value);
        aoSair?.(e.target.value);
      }}
      onBlur={() => aoSair?.(valor)}
    >
      {opcoes.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
      <option value={ADICIONAR}>+ Adicionar pessoa…</option>
    </select>
  );
}
