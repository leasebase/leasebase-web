# Leasebase Web (Standalone Repo)

This repository is intended to host the **standalone web client** for the Leasebase platform.

At the moment, the primary implementation work and runtime wiring live in the **monorepo sibling** `../leasebase`, which contains:
- The backend API (`services/api` – NestJS + Prisma + PostgreSQL)
- The monorepo-level web app workspace (`apps/web`)
- Infrastructure and architecture documentation

Until this repository gains its own application code, you should treat it primarily as an entry point and documentation hub that points you to the monorepo.

---

## Working with Leasebase locally

For a complete local development environment (API + web + DB), follow the instructions in:

- `../leasebase/README.md`

In short, from `../leasebase` you will:

```bash path=null start=null
cd ../leasebase
npm install
npm run dev         # starts Postgres + API + web (when web is implemented)
```

The web UI code will live under `../leasebase/apps/web` and will be served by whatever frontend framework is chosen (e.g., Next.js or another React-based stack).

---

## Local environment for this repo (future)

Once this repository is populated with the standalone web app code, the expected local setup will look roughly like this:

1. Install prerequisites
   - Node.js (LTS, e.g. 18 or 20)
   - npm
   - Docker (optional, if you want to run the backend locally via Docker)

2. Clone and install

   ```bash path=null start=null
   git clone <your-git-url>/leasebase-web.git
   cd leasebase-web
   npm install
   ```

3. Configure environment
   - Point the web client at a Leasebase API endpoint (local, dev, or prod), e.g.:
     - `http://localhost:4000` (local API from the monorepo)
     - `https://api.dev.yourdomain.com` (AWS dev environment)

   This will typically be done via an `.env.local` file or similar, depending on the chosen framework.

4. Run the dev server (placeholder example)

   ```bash path=null start=null
   npm run dev
   ```

The exact commands will depend on the actual web framework and scripts defined in `package.json` once the project is bootstrapped.

---

## Deploying the backend to AWS

**Important:** This repository does **not** contain the backend. The backend API is implemented and deployed from the monorepo in `../leasebase`.

If you need to:
- Stand up or modify backend environments, or
- Understand how the API is deployed to AWS,

refer to:

- `../leasebase/README.md` – "Backend deployment to AWS" section
- `../leasebase/docs/architecture.md` – overall system and AWS architecture

In practice, this web client will consume the backend API via HTTPS, using environment variables or configuration files to point to the appropriate API base URL.

---

## Relevant information for contributors

- **Where is the real code right now?**  In the monorepo `../leasebase` under `apps/web` (future) and `services/api`.
- **Should I add new web features here or in the monorepo?**  Until this repository has been bootstrapped with an actual web app, prefer adding features to the monorepo web workspace.
- **How do I run the full stack locally?**  Use the monorepo instructions (`../leasebase/README.md`), which describe running Postgres, the NestJS API, and the web app together.

As soon as this repo is bootstrapped with a concrete framework and build tooling, this README should be updated with precise commands and deployment details specific to this standalone web client.
