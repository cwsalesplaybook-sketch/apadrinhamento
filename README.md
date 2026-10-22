# CW Stars

O portal dos representantes estrela da Cardápio Web (antigo Radar dos Reps).

Abas: Capacitações e materiais, Sobre o time, Forms da vaga e Onboarding. Login por e-mail e senha
(Supabase Auth).

Identidade visual segue o manual oficial da Cardápio Web (2023): paleta Purple Heart, Eminence,
Carnation, Selective Yellow e Magnolia; fonte Museo Sans Rounded (`src/assets/fonts`); logo, pattern e
mascotes "cardapinho" em `public/brand`.

Stack: Vite + React + TypeScript, Tailwind v4, TanStack Router e Query, Supabase.

## Rodar no computador

```bash
npm install
npm run dev
```

Precisa de um `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (ver `.env.example`).

## Publicar

Deploy automático na Vercel (projeto `radardosreps`) a cada push no `main`.
