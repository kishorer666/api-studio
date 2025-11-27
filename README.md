# API Studio

A desktop-first (Electron) React + TypeScript HTTP client inspired by professional API tooling. Future-ready for web deployment via platform adapter and TARGET-based builds.

## Features
## Overview
API Studio is a lightweight desktop app to compose, send, and save HTTP requests.

### Collections-only model
- Storage is collapsed to a single workspace; all previously separate workspaces are merged at startup.
- Saved requests are organized under Collections. Select a collection from the list to operate on it; there is no target collection dropdown.
- Collections auto-refresh every few seconds to reflect changes.
- Collections can be sorted (Alphabetical / Recently Updated / Favorites First). `lastUpdated` is tracked when requests change.
- Create Request panel: compose, save, update, and auto-save (debounced)
## Scripts
- Theming: light/dark with dim slider
- Unified `Button` component & accessibility focus rings
- Resizable multi-pane layout (`SplitPane` + double-click maximize/restore)
- Tabbed output (Response / Logs) in narrow mode
- Pretty/Raw JSON toggle
- Platform abstraction (`PlatformAdapter`, `PlatformContext`) for storage and future environment-specific APIs

## Installation
```powershell
npm install
```

## Development
```powershell
$env:TARGET='desktop'; $env:NODE_ENV='development'; npm run build
```
Serve or integrate with Electron main process as needed.

## Build (Desktop)
```powershell
$env:TARGET='desktop'; npm run build
```

## Build (Web Preview)
```powershell
$env:TARGET='web'; npm run build
```
Enables performance hints. Adjust hosting to serve `dist/`.

## Architecture
- `src/renderer/platform/PlatformAdapter.ts`: Selects adapter based on `process.env.TARGET`
- `PlatformContext`: React context + hooks (`usePlatform`, `useStorage`)
- Storage utilities (`utils/storage.ts`) route through adapter, enabling future secure Electron store or IndexedDB.
- Webpack optimization splits vendor chunks (`react-vendor`, `icons-vendor`) for better caching.

## Testing
Jest + React Testing Library (19 passing tests). Run:
```powershell
npm test
```

## Future Enhancements
- Persistent environments & variable substitution
- Request scripting / pre-request hooks
- Response history & diff view
- Import/export collections (JSON)
- Pluggable auth helpers (Bearer, Basic, OAuth)
- Desktop-specific native dialogs, file import via adapter

## Contributing
Keep changes minimal, maintain accessibility, update `project-history.md` for each milestone.
