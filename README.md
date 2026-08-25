# CAP — Courses à pied

App de suivi de plans d'entraînement : tu enregistres la date d'une course, elle génère automatiquement la grille des semaines jusqu'à la course, et tu remplis chaque case (jour) avec ta séance.

Stack : Next.js 16 (App Router) + Supabase (Postgres, utilisé uniquement comme base de données) + Tailwind v4. Auth par simple mot de passe (pas Supabase Auth) via un cookie de session signé. Pensé pour être auto-hébergé.

## 1. Base de données Supabase

1. Crée un projet sur [supabase.com](https://supabase.com) (ou un Supabase self-hosted).
2. Dans le SQL editor, exécute [`supabase/schema.sql`](supabase/schema.sql) — ça crée les tables `CAP_races` et `CAP_workouts`.
3. Récupère `Project URL` et la **service_role key** (Settings → API). La service role key ne doit **jamais** être exposée au navigateur — elle n'est utilisée que côté serveur ici.

## 2. Configuration

```bash
cp .env.example .env.local
```

Remplis `.env.local` :

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — depuis Supabase.
- `APP_PASSWORD` — le mot de passe pour se connecter à l'app.
- `SESSION_SECRET` — chaîne aléatoire longue, ex. `openssl rand -base64 32`.

## 3. Lancer en local

```bash
npm install
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

## 4. Déploiement sur ton infra

L'app est en mode `output: "standalone"`, prête pour Docker :

```bash
docker build -t cap-app .
docker run -d -p 3000:3000 --env-file .env.local --name cap-app cap-app
```

Ou sans Docker, sur un serveur Node ≥ 20 :

```bash
npm ci
npm run build
npm start
```

Mets un reverse proxy (nginx, Caddy, Traefik...) devant pour le TLS. L'app pose déjà un `robots.txt` en `disallow: /` et un header `noindex` — pas besoin d'action supplémentaire côté SEO.

## Notes techniques

- Auth : cookie httpOnly signé (JWT HS256 via `jose`), vérifié dans `src/proxy.ts` (le fichier `middleware.ts` a été renommé `proxy.ts` en Next.js 16).
- Tables préfixées `CAP_` dans Postgres, RLS désactivée volontairement (l'app parle à Supabase uniquement depuis le serveur avec la service role key).
- Une case de la grille = une ligne dans `CAP_workouts` (contrainte unique `race_id + workout_date`). Une case vidée est supprimée plutôt que stockée vide.
