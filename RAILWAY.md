# Railway Deployment

This monorepo deploys to Railway as **three services**:

| Service     | Source                          | Type            |
|-------------|---------------------------------|-----------------|
| `backend`   | `apps/backend/`                 | Dockerfile      |
| `web`       | `apps/web/`                     | Dockerfile      |
| `postgres`  | (managed)                       | Railway plugin  |

Each deployable service owns its own `railway.toml` placed in the service's source directory. This lets you `cd` into a service and run `railway up` to deploy only that service, instead of triggering a monorepo-wide build.

## Layout

```
.
├── railway.toml                     # root: legacy, deploys backend (kept for `railway up` at root)
├── Dockerfile.backend               # backend image (build context = repo root)
├── Dockerfile.web                   # web image     (build context = repo root)
├── apps/
│   ├── backend/
│   │   └── railway.toml             # NEW — backend service config
│   └── web/
│       └── railway.toml             # NEW — web service config
```

## Deploying a service

### Option A — Railway dashboard (recommended for first setup)

1. Click **Deploy from GitHub repo** once and point it at this repo. Set the **Root Directory** to `apps/backend`, which auto-detects `apps/backend/railway.toml`.
2. Repeat for the web service in the same project, with **Root Directory** set to `apps/web`.
3. Add the `postgres` plugin from the Railway dashboard for the database.

Future pushes to the configured branch will rebuild the correct service automatically.

### Option B — Railway CLI

```bash
# Authenticate once
railway login
railway link                       # pick the target project

# Deploy the backend
cd apps/backend && railway up

# Deploy the web (in a separate session, or after the backend is up)
cd apps/web && railway up
```

Each `railway up` uses the `railway.toml` in the current directory, so the build context and start command match the intended service.

## Per-service `railway.toml` conventions

- `dockerfilePath` is **relative to the `railway.toml`'s location**. The Dockerfiles live at the repo root, so the paths use `../../Dockerfile.backend` and `../../Dockerfile.web` to climb out of `apps/<service>/`.
- `healthcheckPath` matches what the service exposes: backend uses `/health`, web uses `/` (Next.js does not ship a dedicated health route by default).
- `restartPolicyType = "ON_FAILURE"` with 10 retries is fine for both; switch to `ALWAYS` for the backend if you want crash loops to keep recovering.

## Root `railway.toml`

The original `railway.toml` at the repo root is kept for backwards compatibility. Running `railway up` from the root still deploys the backend. Prefer the per-service files (`apps/backend/railway.toml`, `apps/web/railway.toml`) for new work so the deploy target is unambiguous.

## See also

- [DEPLOY.md](./DEPLOY.md) — full deployment guide (env vars, scaling, health checks).
- [Railway config-as-code reference](https://docs.railway.app/reference/config-as-code) — all supported `railway.toml` fields.
