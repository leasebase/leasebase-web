# Leasebase Web (Standalone Repo)

This repository hosts the **web frontend** for the Leasebase platform.

It is intentionally **frontend‑only**:
- No backend API code lives here.
- No mobile code lives here.

The web client talks to the backend API running from the separate backend repo:
- Backend: `leasebase` (a.k.a. `leasebase-backend`), `services/api` (NestJS + Prisma + PostgreSQL)

Until this repository gains its own application code, treat it as the home for all web‑specific assets (UI, components, routing, styling) and as a thin wrapper around the backend API.

---

## Working with Leasebase locally

For a complete local development environment (API + web + DB), you will work with **two repos** side by side:

- Backend: `../leasebase` (backend API + DB)
- Web: this repo (`leasebase-web`)

Example workflow (once web code exists):

```bash path=null start=null
# 1) In ../leasebase (backend)
cd ../leasebase
npm install
Docker-compose up -d db
npm run migrate
npm run seed
npm run dev:api    # API on http://localhost:4000

# 2) In ../leasebase-web (web frontend)
cd ../leasebase-web
npm install
npm run dev        # web frontend dev server
```

The web UI code will live entirely in this repo and will be served by whatever frontend framework is chosen (e.g., Next.js or another React-based stack).

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

## Deploying the web frontend

This repository only contains the web client. Typical deployment targets include:
- Static hosting + CDN (for SPAs/SSGs)
- An application runtime such as Vercel/Netlify (for Next.js or similar frameworks)

Exact deployment steps will depend on the framework and hosting provider you choose. At a high level you will:

1. Build the web app:

   ```bash path=null start=null
   npm install
   npm run build
   ```

2. Deploy the build artifacts (for example, `.next/`, `dist/`, or a static export directory) to your hosting provider.
3. Configure the app's API base URL to point at the appropriate backend environment (dev, QA, production), e.g.:
   - `https://api.dev.yourdomain.com`
   - `https://api.qa.yourdomain.com`
   - `https://api.yourdomain.com`

### Backend deployment

The backend API is implemented and deployed from the `../leasebase` repo. To work on or deploy the backend, refer to:

- `../leasebase/README.md` – "Backend deployment to AWS" section
- `../leasebase/docs/architecture.md` – overall system and AWS architecture

---

## Relevant information for contributors

- **What belongs here?**  All web/frontend concerns: pages, components, styling, web routing, web-only utilities.
- **What does *not* belong here?**  Backend services, database schema/migrations, mobile code.
- **Where is the backend?**  In `../leasebase/services/api` (NestJS + Prisma).
- **Where is the mobile app?**  In the separate `../leasebase-mobile` repo.

As soon as this repo is bootstrapped with a concrete framework and build tooling, this README should be updated with precise dev, build, and deployment instructions specific to this web client.
