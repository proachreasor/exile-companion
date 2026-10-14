# Exile Companion

A full-stack TypeScript application foundation for Path of Exile 1 and Path of Exile 2.

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm 10 or later

## Install

From the repository root, install dependencies for all workspace packages:

```sh
npm install
```

## Run locally

Start the Vite frontend and Express API together:

```sh
npm run dev
```

Open the frontend at <http://localhost:5173>. Vite proxies `/api` requests to the API at <http://localhost:3001>. The health endpoint is available at <http://localhost:3001/api/health> or through the Vite proxy at <http://localhost:5173/api/health>.

## Validate

```sh
npm run typecheck
npm test
npm run build
```

The repository is an npm workspaces monorepo. The applications are in `apps/web` and `apps/api`; shared TypeScript API contracts are in `packages/contracts`.
