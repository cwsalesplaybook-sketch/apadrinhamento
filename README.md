# Radar dos Reps

Visão completa da jornada dos representantes.

Clone local de https://sweet-sponsor-hub.lovable.app, reconstruído a partir do código publicado
(o projeto Lovable original está em outra conta). Telas: login, Painel, Duplas, Weeklies (lista e
detalhe) e Base geral — conferidas pixel a pixel contra o original.

Identidade visual segue o manual oficial da Cardápio Web (2023): paleta Purple Heart, Eminence,
Carnation, Selective Yellow e Magnolia; fonte Museo Sans Rounded (`src/assets/fonts`); logo, pattern e
mascotes "cardapinho" em `public/brand`.

Stack: Vite + React + TypeScript, Tailwind v4, TanStack Router e Query, Supabase.

## Rodar no computador

```bash
npm install
npm run dev
```

## Banco de dados

O arquivo `.env` aponta para o **mesmo banco do app original** (Supabase gerenciado pelo Lovable
Cloud). Ou seja: mesmo login, mesmos dados. Funciona enquanto o projeto no Lovable existir.

Para sair 100% do Lovable: crie um projeto Supabase próprio, rode `supabase/schema.sql` no SQL
Editor, troque as duas variáveis do `.env` e migre os dados.

## Publicar na Vercel

Framework: Vite (detectado automaticamente). Cadastre as variáveis do `.env.example`
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) nas configurações do projeto na Vercel.
O `vercel.json` já redireciona todas as rotas para o `index.html`.
