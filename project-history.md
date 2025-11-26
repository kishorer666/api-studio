# Project History: API Studio

## 2025-11-25 2:00 PM
- Project scaffolded with Electron, React, and TypeScript
- Added HTTP request UI (method, URL, headers, params, body, response)
- Implemented request logs and error handling
- Enhanced UI with Apple-inspired design and CSS modules
- Refactored code into components and utils folders
- Added test cases for components and utility functions
- Set up project-history.md for daily revision tracking

## 2025-11-25 3:45 PM
- Implemented request collections feature:
	- Added localStorage backend helpers (`saveRequest`, `loadRequests`, `deleteRequest`)
	- Created `RequestCollection` component for saving, loading, and deleting requests
	- Integrated collections UI into main app
	- Updated project history

## 2025-11-25 4:20 PM
- UI consistency refinement:
  - Replaced CSS modules with inline styles due to runtime resolution issues
  - Standardized Response panel styling to match Request Logs panel (white background, dark text)
  - Prepared groundwork for future theming (styles centralized in `App.tsx`)

## 2025-11-25 5:05 PM
- Structured layout refactor:
	- Added reusable `Panel` component for consistent section framing
	- Introduced `SectionTitle` component for future subsection standardization
	- Implemented two-column grid: left (Saved Requests, Request builder) / right (Response, Logs)
	- Nested panels for Query Parameters, Headers, and Body within Request
	- Unified spacing and sizing, improving scanability and extensibility
- Established foundation for upcoming features (auth helpers, environments, theming) by modularizing sections.

## 2025-11-25 5:35 PM
- Panel responsiveness & visibility improvements:
	- Added scrollable `Panel` sections (query params, headers, body) with max heights to prevent hidden content.
	- Wrapped long response/log lines for better readability in constrained widths.
- Resizable layout enhancement:
	- Implemented draggable vertical handle to resize left request column (min 260px, adaptive max).
	- Automatic fallback to single-column layout under 1000px width disables drag for mobile friendliness.
	- Ensured panels maintain full visibility when loading large saved requests.

	## 2025-11-25 5:50 PM
	- Collapsible panels:
		- Added collapse/expand toggle (Params, Headers, Body) for cleaner workspace.
		- Panel component extended with `collapsed` and `onToggleCollapse` props.
	- Response formatting:
		- Added Pretty/Raw toggle; automatically pretty-prints valid JSON with 2-space indentation.
		- Falls back to raw text if parsing fails (non-JSON responses unaffected).
	- Updated UX:
		- Actions area in Panel header now supports utility buttons (e.g., format toggle).
		- Improves focus by letting user hide less-used sections and inspect responses comfortably.

		## 2025-11-25 6:05 PM
		- Saved request update capability:
			- Added dirty-state detection comparing loaded request to current form values.
			- Introduced Update button (enabled only when changes detected) to overwrite existing saved request while keeping original id/name.
			- Prevents accidental duplication and streamlines iterative tweaking of saved calls.
		- Internal changes: `RequestCollection` now accepts `loadedMeta` and renders dynamic Update control; `App` tracks `loadedRequestMeta`.
		## 2025-11-25 6:20 PM
		- Saved request update UX refinements:
			- Moved Update button into the corresponding saved request list item for clearer context.
			- Added robust dirty detection (trims keys/values) ensuring header edits activate Update reliably.
			- Normalized comparison logic to prevent false negatives from whitespace differences.
			- Improved responsive layout of list items (wrap on narrow widths).

## 2025-11-25 6:40 PM
- Theming system introduced:
	- Added light/dark mode toggle with smooth dimming slider (0–1) blending palettes.
	- Centralized color handling via CSS custom properties (`--bg`, `--panel-bg`, `--text-color`, etc.).
	- Refactored root container, inputs, buttons, panels, and response/log areas to consume theme variables.
	- Implemented gear Settings panel (⚙️) with Dark Mode checkbox, Dim Level slider, and close action.
	- Color interpolation uses hex blending to ensure smooth transition and minimal flicker.
	- Established foundation for future user preferences persistence (localStorage can be added later).

## 2025-11-25 6:55 PM
- Theme preference persistence:
	- Added automatic load of `apiStudio.theme.dark` and `apiStudio.theme.dim` on App mount.
	- Persist updates to localStorage whenever dark mode or dim level changes.
	- Created tests (`ThemePersistence.test.tsx`) ensuring values are written and restored across re-renders.
	- Solidifies user experience continuity between sessions.

## 2025-11-25 7:20 PM
- Auto-save for loaded requests:
	- Implemented debounced (1.5s) auto-save when editing a previously loaded request.
	- Dirty detection mirrors manual Update logic; after auto-save baseline snapshot refreshes to clear dirty state.
	- Added heading indicator showing last auto-save time.
	- Created `AutoSave.test.tsx` using Jest fake timers to validate auto-save behavior (URL change persists, Update button disables, indicator appears).
	- Enhances workflow by removing need for manual Update clicks during iterative edits.
