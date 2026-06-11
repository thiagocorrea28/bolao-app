# BolaoApp

App Next.js + Tailwind + Supabase para bolao entre amigos nos jogos da Copa do Mundo.

## Setup local

1. Instale as dependencias:

```bash
npm install
```

2. Crie `.env.local` a partir de `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

3. Rode as migrations no SQL Editor do Supabase, nesta ordem:

```txt
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_premium_bolao.sql
```

4. Desative confirmacao de email no Supabase Auth para login direto apos cadastro.

5. Rode o projeto:

```bash
npm run dev
```

## Deploy GitHub + Vercel

Antes do deploy, configure estas variaveis no projeto da Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wlrtsjytqsbfnqfmirro.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
```

Nao configure `service_role`, `secret key` ou qualquer chave privada no frontend.

No Supabase, ajuste `Authentication > URL Configuration`:

```txt
Site URL:
https://seu-dominio.vercel.app

Redirect URLs:
http://localhost:3080/auth/callback
https://seu-dominio.vercel.app/auth/callback
```

Se usar dominio customizado, adicione tambem:

```txt
https://seu-dominio.com/auth/callback
```

O valor de `NEXT_PUBLIC_SITE_URL` precisa ser exatamente o dominio publico que os usuarios vao abrir, sem barra final.

## Super Admin

O primeiro Super Admin e definido pela migration para o email configurado no SQL. Ao criar conta com esse email, o perfil recebe `role = 'super_admin'`.

## CSV de jogos

Use uma linha por jogo:

```csv
home_team,away_team,starts_at,is_premium
Brasil,Argentina,2026-06-15T20:00:00+01:00,false
Portugal,Espanha,2026-06-15T23:00:00+01:00,true
```

Colunas:

- `home_team`: time da casa.
- `away_team`: visitante.
- `starts_at`: data/hora em ISO com timezone.
- `is_premium`: `true` ou `false`.

A app calcula automaticamente `bid_closes_at = starts_at - 10 minutos`.

## Pontuacao

- 3 pontos para placar exato.
- 1 ponto para acertar vencedor ou empate com placar diferente.
- Penalti nao entra no placar, entao jogos decididos nos penaltis devem ser cadastrados como empate no resultado final.
- Empate na leaderboard e ordenado por mais placares exatos; se persistir, permanece empatado.

## Premium

Jogos marcados como premium usam apostas separadas da aposta normal.

- O usuario aceita o Bolao Premium uma vez.
- Cada aposta premium custa 2,00€.
- Editar uma aposta premium nao cobra novamente.
- Remover uma aposta premium antes do fechamento remove a cobranca daquele jogo.
- Quem acerta o placar exato divide o pote.
- Se ninguem acertar, o pote e devolvido.
- O saldo pode ficar negativo.
- O Super Admin ve o saldo total e saldos por jogador.
