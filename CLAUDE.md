# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build (output: dist/site_cenca/)
npm run watch      # Dev build with watch mode
npm test           # Unit tests (Karma + Jasmine)
npm run compodoc   # Generate API docs in src/assets/documentation/
```

To run a single test file:

```bash
ng test --include='**/my-component.spec.ts'
```

## Architecture Overview

**Angular 18** app using **standalone components** (no NgModules). Functional routing (`provideRouter`), functional HTTP interceptors, and Angular Signals for modern state management.

The project works with a NODEJS / Express library backend server.

### Key Configuration Files

- **`src/app/backendAdress.ts`** — hardcoded production backend URL (`http://si-10.cen-champagne-ardenne.org:8887/`). Dev URL lives in `src/environments/environment.ts`.
- **`src/app/app.config.ts`** — root providers: router, HTTP client with auth interceptor, animations.
- **`src/app/app.routes.ts`** — root routing with lazy-loaded feature routes.

### Feature Modules (lazy-loaded)

| Route | Feature |
| --- | --- |
| `/sites` | Main site management (CENCA sites) |
| `/foncier` | Land/property management |
| `/parametres` | Admin settings (users, groups) |

### Authentication

- JWT stored in `localStorage`; `src/app/interceptor/auth-token.interceptor.ts` injects it on all requests.
- `LoginService` exposes `user = signal<User | undefined | null>()` as the auth state source of truth.
- `isLoggedInGuard` protects all routes except `login`, `reset-password`, and `aide`.
- On app init/navigation, the guard calls `/auth/me` to rehydrate user state from the token.

### State Management Patterns

- **Angular Signals** — used in `LoginService` for user state and in components for local reactive state.
- **RxJS BehaviorSubject** — used in `MenuService` (menu items) and `FormService` (form validity).

### Shared Infrastructure

- **`src/app/shared/interfaces/`** — TypeScript interfaces for all API DTOs (`site-geojson.ts`, `geo.ts`, `localisation.ts`, `selector.ts`, etc.).
- **`src/app/shared/services/`** — `GeoService`, `DocfileService`, `ConfirmationService` (modal dialogs).
- **`src/app/shared/file-explorator/`** — multi-format file browser (PDF, DOCX via `docx-preview`, images).
- **`src/app/map/`** — complex Leaflet (`@asymmetrik/ngx-leaflet`) + Turf.js component; handles dynamic tile layers, parcel selection, and GeoJSON rendering for sites, projects, and operations.

### Styling

- Global styles in `src/styles.scss`.
- Angular Material with a custom indigo-pink theme (`src/app/styles/indigo-pink-custom.css`).
- All components use SCSS (`.component.scss`).

### Deployment

- Docker support via `Dockerfile` in root.
- Jenkins webhook: `main` branch → production, `dev` branch → staging.
- A postinstall script (`scripts/fix-leaflet-fullscreen.js`) patches the Leaflet fullscreen plugin after `npm install`.
