# ADR-002: service-common Shared Library Policy

**Status:** Accepted  
**Date:** 2026-03-12  
**Decision makers:** Rachid (founder)

## Context

`leasebase-service-common` provides shared types, middleware (role guards, error handling), and utility functions consumed by all backend microservices and the BFF gateway.

Historically, some services (auth-service, bff-gateway) included checked-in `.tgz` bundles of service-common and used Dockerfile `sed` hacks to install from the local file. This created version drift and opaque dependency resolution.

## Decision

1. **Single source of truth:** `leasebase-service-common` is the canonical source repo.
2. **Published package:** All versions are published to GitHub Packages as `@leasebase/service-common`.
3. **No checked-in artifacts:** `.tgz` files, `file:` references, and Dockerfile copy/sed patterns for service-common are prohibited.
4. **Consumption pattern:** All consuming repos declare `@leasebase/service-common` in `package.json` with a semver range (e.g. `^1.2.0`) and install from GitHub Packages via `.npmrc`.
5. **CI/CD:** All service CI workflows already configure `registry-url: https://npm.pkg.github.com` — this is the approved install path.
6. **Version alignment:** All services should target the same major.minor version. Patch drift is acceptable.

## Consequences

- Existing `.tgz` files in auth-service and bff-gateway must be deleted after service-common 1.2.0 is published to GitHub Packages.
- Dockerfiles in those repos must be updated to remove the `sed` hack and rely on standard `npm install`.
- Version drift across services (currently ranging from `^1.0.0` to `^1.2.0`) must be aligned.
- Any future changes to service-common require a version bump and publish cycle.

## Migration Notes

As of this writing, service-common 1.2.0 has not yet been published to GitHub Packages (latest published is 1.1.2). The `.tgz` files in auth-service and bff-gateway are documented temporary debt and should be removed once 1.2.0 is published.
