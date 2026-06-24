# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies (also runs scripts/fix-leaflet-fullscreen.js)
ng serve             # Dev server at http://localhost:4200
ng build --configuration production  # Production build → dist/
ng test              # Unit tests via Karma/Jasmine (runs in browser)
npm run compodoc     # Generate API docs → src/assets/documentation
```

> This app requires a running backend. Without it, no business features work.

## Environment & Backend Configuration

The backend URL is configured in `src/environments/`:
- `environment.ts` — development (points to `192.168.1.50:8887` by default)
- `environment.prod.ts` — production (`si-10.cen-champagne-ardenne.org:8889`)

The `windows` boolean flag in these files switches between `apiUrl` (network) and `apiLocalUrl` (localhost) and also changes the path separator (`/` vs `\\`). Toggle it when developing locally on Windows.

All HTTP calls use `environment.apiUrl` via `LoginService` and shared services — `src/app/backendAdress.ts` is a legacy file and is no longer used.

## Architecture

**Angular 18 with standalone components throughout.** No NgModules.

### Routing (lazy-loaded)

| URL prefix | Route file | Purpose |
|---|---|---|
| `/` | `app.routes.ts` | Home (guarded by `isLoggedInGuard`) |
| `/sites` | `sites/sites.routes.ts` | Site list + detail |
| `/foncier` | `sites/foncier/foncier.routes.ts` | Land management (extractions, PMFU) |
| `/travaux` | `sites/travaux/travaux.routes.ts` | Works/projects |
| `/parametres` | `admin/admin.routes.ts` | Admin (users, groups) |
| `/aide` | inline | Help (public, no auth) |

The `/sites` and `/travaux` routes use a named router outlet (`liste`) for filter-driven list display.

### Auth

- `LoginService` (`src/app/login/login.service.ts`) manages auth state with an Angular **signal** (`user = signal<User>()`).
- JWT token stored in `localStorage` under key `'token'`.
- `authTokenInterceptor` (`src/app/interceptor/auth-token.interceptor.ts`) attaches `Authorization: Bearer <token>` to every HTTP request.
- `isLoggedInGuard` protects routes that require login.

### Key Components

**`MapComponent`** (`src/app/map/map.component.ts`) — the most complex component. Uses Leaflet + `leaflet.fullscreen` + Turf.js to display multiple cartographic layers. Supports dynamic loading of CENCA site layers and cadastral parcels, parcel selection mode, and edit mode. Communicates with parents via `@Input`/`@Output`. Uses `SiteCencaService` to fetch WFS data from the backend's Lizmap integration.

**`SiteDetailComponent`** (`src/app/sites/site-detail/site-detail.component.ts`) — tabbed detail view for a site with 6 child components (infos, description, MFU, gestion, habitats, projets). Data is loaded via `ngOnChanges` when the `site` input changes.

**`shared/`** — Reusable components:
- `file-explorator/` — multi-format file browser (PDF, DOCX, images)
- `image-view/` — image gallery
- `confirmation/` — confirmation dialog
- `form-buttons/`, `form/select-field/` — shared form controls
- `services/` — `GeoService`, `SiteCencaService`, `GeofilesService`, `ShapefileService`, `DocfileService`, `SnackbarService`, `ConfirmationService`

### Data Flow Pattern

Components fetch data by calling services that wrap `HttpClient`. Services use Observables with RxJS operators (`tap`, `map`, `switchMap`, `catchError`). The `ApiResponse` interface (`src/app/shared/interfaces/api.ts`) is the standard backend response shape: `{ success, message, code, data[] }`.

## CI/CD

Jenkins webhook triggers automatically:
- Push to `main` → production build
- Push to `dev` → pre-production build

Contributions should target the `dev` branch via pull request; `main` is the production branch.
