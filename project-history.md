# Project History: API Studio
Note: Project history timestamps use the current system time (EST) with AM/PM formatting exactly as shown (e.g., 4:10 PM EST).

## 2025-11-25 2:00 PM EST
- Added HTTP request UI (method, URL, headers, params, body, response)
- Implemented request logs and error handling
- Enhanced UI with Apple-inspired design and CSS modules
- Refactored code into components and utils folders
- Added test cases for components and utility functions
7:20 PM - Added debounced auto-save feature for loaded requests (1.5s inactivity) with timestamp indicator and logs.
7:45 PM - Introduced settings toggle to enable/disable auto-save (persisted in localStorage); heading shows 'Auto-save off' when disabled; added test coverage for toggle behavior.
- Set up project-history.md for daily revision tracking

## 2025-11-25 3:45 PM EST
- Implemented request collections feature:
	- Added localStorage backend helpers (`saveRequest`, `loadRequests`, `deleteRequest`)
	- Created `RequestCollection` component for saving, loading, and deleting requests
	- Integrated collections UI into main app
	- Updated project history

## 2025-11-25 4:20 PM EST
- UI consistency refinement:
  - Replaced CSS modules with inline styles due to runtime resolution issues
  - Standardized Response panel styling to match Request Logs panel (white background, dark text)
  - Prepared groundwork for future theming (styles centralized in `App.tsx`)

## 2025-11-25 5:05 PM EST
- Structured layout refactor:
	- Added reusable `Panel` component for consistent section framing
	- Introduced `SectionTitle` component for future subsection standardization
	- Implemented two-column grid: left (Create Request, Request builder) / right (Response, Logs)
	- Nested panels for Query Parameters, Headers, and Body within Request
	- Unified spacing and sizing, improving scanability and extensibility
- Established foundation for upcoming features (auth helpers, environments, theming) by modularizing sections.

## 2025-11-25 5:35 PM EST
- Panel responsiveness & visibility improvements:
	- Added scrollable `Panel` sections (query params, headers, body) with max heights to prevent hidden content.
	- Wrapped long response/log lines for better readability in constrained widths.
- Resizable layout enhancement:
	- Implemented draggable vertical handle to resize left request column (min 260px, adaptive max).
	- Automatic fallback to single-column layout under 1000px width disables drag for mobile friendliness.
	- Ensured panels maintain full visibility when loading large saved requests.

	## 2025-11-25 5:50 PM EST
	- Collapsible panels:
		- Added collapse/expand toggle (Params, Headers, Body) for cleaner workspace.
		- Panel component extended with `collapsed` and `onToggleCollapse` props.
	- Response formatting:
		- Added Pretty/Raw toggle; automatically pretty-prints valid JSON with 2-space indentation.
		- Falls back to raw text if parsing fails (non-JSON responses unaffected).
	- Updated UX:
		- Actions area in Panel header now supports utility buttons (e.g., format toggle).
		- Improves focus by letting user hide less-used sections and inspect responses comfortably.

		## 2025-11-25 6:05 PM EST
		- Saved request update capability:
			- Added dirty-state detection comparing loaded request to current form values.
			- Introduced Update button (enabled only when changes detected) to overwrite existing saved request while keeping original id/name.
			- Prevents accidental duplication and streamlines iterative tweaking of saved calls.
		- Internal changes: `RequestCollection` now accepts `loadedMeta` and renders dynamic Update control; `App` tracks `loadedRequestMeta`.
		## 2025-11-25 6:20 PM EST
		- Saved request update UX refinements:
			- Moved Update button into the corresponding saved request list item for clearer context.
			- Added robust dirty detection (trims keys/values) ensuring header edits activate Update reliably.
			- Normalized comparison logic to prevent false negatives from whitespace differences.
			- Improved responsive layout of list items (wrap on narrow widths).

## 2025-11-25 6:40 PM EST
- Theming system introduced:
	- Added light/dark mode toggle with smooth dimming slider (0–1) blending palettes.
	- Centralized color handling via CSS custom properties (`--bg`, `--panel-bg`, `--text-color`, etc.).
	- Refactored root container, inputs, buttons, panels, and response/log areas to consume theme variables.
	- Implemented gear Settings panel (⚙️) with Dark Mode checkbox, Dim Level slider, and close action.
	- Color interpolation uses hex blending to ensure smooth transition and minimal flicker.
	- Established foundation for future user preferences persistence (localStorage can be added later).

## 2025-11-25 6:55 PM EST
- Theme preference persistence:
	- Added automatic load of `apiStudio.theme.dark` and `apiStudio.theme.dim` on App mount.
	- Persist updates to localStorage whenever dark mode or dim level changes.
	- Created tests (`ThemePersistence.test.tsx`) ensuring values are written and restored across re-renders.
	- Solidifies user experience continuity between sessions.

## 2025-11-25 7:20 PM EST
- Auto-save for loaded requests:
	- Implemented debounced (1.5s) auto-save when editing a previously loaded request.
	- Dirty detection mirrors manual Update logic; after auto-save baseline snapshot refreshes to clear dirty state.
	- Added heading indicator showing last auto-save time.
	- Created `AutoSave.test.tsx` using Jest fake timers to validate auto-save behavior (URL change persists, Update button disables, indicator appears).
	- Enhances workflow by removing need for manual Update clicks during iterative edits.
## 2025-11-26 10:15 AM EST
- Auto-save toggle:
	- Added settings checkbox to enable/disable automatic saving of loaded requests.
	- Heading now displays 'Auto-save off' when disabled.
	- Preference persisted to `localStorage` (`apiStudio.autoSave.enabled`).
	- Added `AutoSaveToggle.test.tsx` to validate no persistence occurs when disabled.
## 2025-11-26 10:22 AM EST
- Transient saving indicator:
	- Introduced `autoSavePending` state; heading shows 'Saving…' while debounce timer active.
	- Upon completion transitions to 'Auto-saved <time>'.
	- Added `AutoSavePendingIndicator.test.tsx` verifying indicator lifecycle.
## 2025-11-26 10:29 AM EST
- Button styling overhaul:
	- Added unified `Button` component with variants (`primary`, `danger`, `subtle`) and sizes (`sm`, `md`).
	- Replaced all inline button styles (Save, Load, Delete, Update, Send, Pretty/Raw toggle, Settings actions) for consistent aesthetic.
	- Implemented hover (brightness + focus ring) and active (subtle press) feedback while keeping modest, classy presentation.
	- Disabled state now standardized (reduced opacity, no shadow, not-allowed cursor).
	- Tests unchanged and all passing (19) confirming functional parity.
## 2025-11-26 10:46 AM EST
- Desktop layout redesign:
	- Replaced centered/mobile-style container with full-height desktop workspace (`100vh`).
	- Introduced nested `SplitPane` components for dynamic resizing: Left sidebar (Create Request) / Right side (Request editor over Response & Logs split).
	- Added secondary vertical split between Response and Logs to allow independent width adjustment.
- Accessibility & interaction improvements:
	- Added global keyboard focus outline (using `:focus-visible`) injected once for all buttons.
	- Updated `Button` to support optional `icon` + text (e.g., Settings, Send, format toggle) maintaining accessible label semantics.
- Refactors:
	- Removed legacy manual column drag code in favor of reusable `SplitPane` abstraction.
	- Adjusted heading bar to fixed top toolbar; ensured theme CSS variables applied for existing tests by inlining them on the bar.
- Tests:
	- Updated `Button` markup so `getByText('Update')` resolves to actual `button` element (fixing disabled assertion after icon support).
	- All suites green (19/19) post-redesign confirming non-regression.
- Style consistency: Adopted multi-pane spatial hierarchy similar to professional API clients (e.g., Postman) with clear separation of request construction vs. output & diagnostics.
## 2025-11-26 10:57 AM EST
- UI refinements & feature additions:
	- Thinned top app bar (reduced padding & height) for less visual weight.
	- Converted emoji icons to `react-icons` (FiSettings, FiSend, FiShuffle) for scalable, consistent glyphs.
	- Installed `react-icons` dependency and updated `App.tsx` accordingly.
- Request panel usability:
	- Wrapped Query Params / Headers / Body panels in a scrollable container preventing vertical blocking when large content is loaded.
- SplitPane enhancements:
	- Added double-click maximize/restore behavior on divider (toggles primary pane size, preserving previous size).
- Narrow layout improvement:
	- Replaced separate Response & Logs panels with a unified tabbed `Output` panel using new `Tabs` component for space efficiency.
- Accessibility:
	- Focus ring remains consistent on new tab buttons via `data-focusable`.
- Tests:
	- All existing 19 tests pass unchanged, confirming non-regression after icon swap, scroll adjustments, and tab introduction.

## 2025-11-26 11:30 AM EST
- Storage utils refactor: `utils/storage.ts` now consumes adapter storage (`platformAdapter.storage()`) removing direct `localStorage` coupling.
- Documentation: Added `README.md` detailing TARGET env usage, build commands for desktop vs web, architecture overview, and future enhancement roadmap.
- State: Dual-target groundwork complete; ready to pursue higher-level enhancements (environments, scripting, auth helpers).

## 2025-11-26 11:45 AM EST
- Request form UX improvement: Replaced stacked collapsible Panels (Query Params, Headers, Body) with a tabbed interface for faster navigation and reduced vertical scrolling.
- Dynamic body tab: Body tab appears only for methods supporting a request body (POST, PUT, PATCH); auto-redirects to Params if method changes to one without body.
- Improved ergonomics: Single scrollable area per tab simplifies large request editing; preserves existing field functionality and body type selector.

## 2025-11-26 12:05 PM EST
- Tab persistence & shortcuts: Active request tab now remembered across sessions (`apiStudio.request.activeTab`). Added keyboard shortcuts (Ctrl+Enter send, Alt+1/2/3 switch tabs, Ctrl+Shift+S toggle settings) to accelerate workflow.
- Auto-save refinement: Skips saving when request is entirely empty (no URL, params, headers, body). Filters out blank key/value rows before persistence to keep storage clean.
- Stability fix: Tab buttons explicitly `type="button"` preventing accidental form submits (previously could trigger unintended request sends on tab click).

## 2025-11-26 12:30 PM EST
- Workspaces & Collections: Introduced multi-workspace support with named collections grouping saved requests. Added storage layer (`workspaceStorage.ts`) persisting `workspaces` array and active workspace id.
- UI: New sidebar `Workspace` panel to switch workspaces, create new workspace, and add collections. Create Request panel is collection-aware (operates inside selected collection).
- Persistence: Requests saved/updated/deleted route through active collection when present; legacy standalone request storage retained for backward compatibility.
- Data model: `Workspace { id, name, collections[], activeCollectionId }`; `Collection { id, name, requests[] }`.

## 2025-11-26 12:50 PM EST
- Favorites: Added `favorite` flag to `SavedRequest` with star toggle; favorites sorted to top and count badge (★) in collection list; new request form includes Favorite checkbox.
- Workspace management: Rename/delete workspace actions; collection reordering (↑/↓); counts with favorite indicator per collection.
- Import/Export: Prompt-based JSON export (copies to clipboard when possible) and import with ID regeneration and automatic activation.
- Storage updates: Extended `workspaceStorage` with favorite toggle, rename/delete workspace, reorder collections, export/import utilities; legacy storage gains `toggleFavorite`.
- Prepared groundwork for future web release by decoupling platform concerns early.

## 2025-11-26 10:55 PM EST
- Collections-only UX and storage cleanup:
	- Collapsed all workspaces into a single workspace via `collapseWorkspacesToSingle()`; merged collections by name (case-insensitive) and de-duplicated requests by id.
	- Removed workspace selector and Target Collection dropdown from UI; Create Request operates on the selected collection from the list.
	- Added periodic auto-refresh (2s) to keep collections list and active selection in sync.
	- Introduced collection sort selector (Alphabetical / Recently Updated / Favorites First) and tracked `lastUpdated` on collection changes.
- Tests updated:
	- Added unit tests for single-workspace migration and collection merge behavior.
	- Verified app compiles after UI refactor; retained 19 existing tests with non-regression.

## 2025-11-26 11:10 PM EST
- Collections-only polish:
	- Removed lingering workspace selector from the wide layout Collections panel to fully align with single-workspace, collections-only UX.
	- Confirmed tests pass (`npm test`) after cleanup.

## 2025-11-27 1:15 AM EST
- Collection deletion stability:
	- Unified wide layout delete handler with narrow logic to immediately reload workspace via `ensureDefaultWorkspace()` after deletion.
	- Eliminated timeout-based refresh sequence that caused transient disabled inputs until window refocus.
	- Auto-creates default 'Main' collection when last collection removed; shows toast feedback for deletion and fallback creation.
- Next planned step: add regression test ensuring inputs remain enabled immediately post-deletion.

