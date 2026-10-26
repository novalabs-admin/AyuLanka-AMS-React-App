# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Create React App (react-scripts 5), npm, no custom webpack config.

```bash
npm start              # dev server on :3000, uses .env.development
npm run start:uat      # env-cmd -f .env.uat
npm run start:prod     # env-cmd -f .env.production
npm run build:dev      # build with .env.development (same as `npm run build`)
npm run build:uat      # build with .env.uat
npm run build:prod     # build with .env.production
npm test -- --watchAll=false                      # run Jest once
npm test -- --watchAll=false -t "test name"       # single test by name
```

Lint is CRA's built-in `react-app` ESLint config, surfaced by `npm start` / `npm run build`; there is no separate lint script. `src/App.test.js` is the unmodified CRA stub ("learn react") and fails; there is no real test suite.

## Architecture

AyuLanka AMS: a single-page React 18 admin UI (appointments, staff rosters/leaves/attendance, tokens, reports, doctor channeling) for a multi-company clinic group. It talks to a separate .NET-style REST backend; this repo is frontend only.

### Entry and routing
- `src/index.js` -> `src/App.js` (wraps `QueryClientProvider`, `BrowserRouter`, `SessionHandler`, global `ToastMessage`) -> `src/Routers.js`.
- `Routers.js` holds **all routes in one flat list**, plus a `Layout` that renders `Sidebar` + `Breadcrumb` on every route except `/` (login). Adding a page means: create the component, add a `<Route>` here, and add a link in `components/sideBar/sideBar.jsx`.
- Sidebar menu groups auto-expand based on `MENU_PATHS` in `sideBar.jsx`; a new path under a group must be added there too.
- Route paths contain historical typos (`/appoinment-schedular-elitecare`, `...-doctorechanneling`). Keep them as-is unless changing the sidebar and all links together.
- Note `/home` renders `Home` imported from `@mui/icons-material` (an icon), not `components/home/home.jsx`.

### Auth and session (no Redux, no auth header)
- Login (`components/login/login.js`) calls `login_api`, decodes the JWT with `jwt-decode`, and writes `exp`, `userId`, `fullName`, `designationCode`, `companyId`, `companyCode` to **`sessionStorage`**, then does a hard `window.location.href` redirect (deliberate, so no stale in-memory state leaks between companies). SAD users land on `/dashboard`, others on `/home`.
- The token itself is **not stored and no `Authorization` header is sent**; the app relies on the decoded claims in sessionStorage only. `SessionHandler` redirects to `/` when `exp` is missing/expired.
- Authorization is purely client-side menu gating by `designationCode` in `sideBar.jsx` (`SAD`, `AD`, `ADT`, `RP`, ...). Components read `sessionStorage` directly (`companyCode`, `companyId`, `designationCode`).
- Multi-tenancy: service functions append `companyCode` / `companyId` from sessionStorage to requests. When adding an API call that returns company data, follow that pattern (see `searchPatients`, `fetchEmployees` in `services/appointmentSchedulerApi.js`).
- `@reduxjs/toolkit`, `react-redux`, and `@tanstack/react-query` are installed but effectively unused; state is local `useState` / class state plus sessionStorage.

### API layer
- `src/services/*.js` are plain axios modules, one per domain (appointments, doctor sessions, roster, leave, user, geography). **Each file builds its own axios instance** from `REACT_APP_API_BASEURL` + `REACT_APP_API_SUBLINK` (the same 5-line block is copy-pasted). Components never call axios directly.
- `appointmentSchedulerApi.js` (~500 lines) is the largest; most appointment screens share it.

### Components
- One folder per feature under `src/components/<feature>/` with a `.jsx` and a sibling `.css` (plain CSS, Bootstrap 5 + react-bootstrap; some MUI icons, FullCalendar for schedulers, recharts for the dashboard).
- Mixed styles: newer components are function components with hooks; `login` and `user` are older class components split into `x.js` (logic) + `x.jsx` (template function called via `template.call(this)`), with an `index.js` re-export. Follow the style of the file you're editing.
- Three near-duplicate scheduler components (`appointmentScheduler` = EliteCare, `appointmentSchedulerPrimeCare`, `appointmentSchedulerDoctorChanneling`) correspond to different clinic brands/modes; changes to shared behavior (e.g. customer creation via `modalComponent/createCustomerModal.jsx`) usually need applying to all of them.
- `TokenGenerateOld.jsx` is a retired version kept beside `TokenGenerate.jsx`; edit the non-"Old" file.

### Environment config
`.env.development`, `.env.uat`, `.env.production` are committed and selected via the npm scripts above. Variables used: `REACT_APP_API_BASEURL`, `REACT_APP_API_SUBLINK` (all environments), and `REACT_APP_TOTAL_ROWS`, `REACT_APP_TOKENS_PER_ROW`, `REACT_APP_APPOINTMENT_START_HOUR` (token grid / scheduler layout; defined in `.env.development`, missing from `.env.production`, so check for fallbacks when using them). Env values are baked in at build time.
