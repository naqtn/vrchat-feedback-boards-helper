# Maintaining notes (browser extension)

This file is for **maintainers and forkers** of this browser extension.
End users should read [README.md](README.md) instead.

## How it works

The extension operates on three pieces of data:

1. **Stored settings** — user preferences that drive what to show and
   how (which fields to add, which posts to mark, which visibility
   filter to apply). Persisted via `chrome.storage.local` and edited
   through the popup and options pages.

2. **The board-page DOM** — the live, in-page list of posts on a
   Canny board, observed in the user's browser. Each list item
   contains a link to that post's individual page. The list mutates
   continuously as the user scrolls, sorts, filters, or navigates
   between boards, so the extension uses a `MutationObserver` to
   react to changes.

3. **Per-post detail data** — fields such as author name, creation
   date, and viewer-relative attributes (e.g. "is this my post?")
   that are not exposed on the board listing. Obtained by fetching
   each post's individual HTML page and extracting an embedded
   `window.__data` JSON blob from the page source.

The basic operating loop is: **for each post link discovered in (2),
fetch its detail (3) once, then decorate the corresponding list item
in (2) according to (1).** Decoration covers both visible additions
(author name, date, marker background color) and visibility
filtering (hiding posts that do not match the user's filter).
Fetched details are cached in memory for the lifetime of the page
so that re-decoration after DOM mutation is cheap.

The rest of this document drills into the moving parts of this loop
and the cross-browser plumbing it depends on.

## What this extension depends on

This extension is a content-script-driven decorator for any
[Canny](https://canny.io/) feedback site. It is **generic to Canny**,
not tied to a specific company; the matching rules in `manifest.json`
target `*.canny.io` plus `feedback.vrchat.com` as a known alias.

The content script reads the page DOM and (for additional details)
fetches the per-post HTML to extract embedded data. Two specific
Canny-side surfaces are load-bearing:

1. The embedded JSON in `<script>window.__data = {...};</script>` on
   each post page (parsed by `fetchPostInfo` in
   `content_script_canny.js`)
2. The post list wrapper element on board pages, used as the anchor
   for decoration (`closest('.postListItem, .postListItemV2')`)

Both have changed historically; see "Notes on Canny's behavior
changes" below.

## Cross-browser MV3 trade-off (important)

The extension uses a **single Manifest V3 manifest targeting both
Chrome and Firefox**. Because Chrome and Firefox have diverged on how
the background script is declared in MV3, the manifest declares
**both** keys under `background`:

```json
"background": {
    "service_worker": "background.js",
    "scripts": ["background.js"]
}
```

This is **intentional** and produces an expected warning on each
browser:

| Browser | Behavior | Warning produced |
|---|---|---|
| Chrome MV3 | Uses `service_worker`, ignores `scripts` | `'background.scripts' requires manifest version of 2 or lower.` (visible on the extension card in `chrome://extensions`) |
| Firefox MV3 | Ignores `service_worker`, uses `scripts` (event page) | `BACKGROUND_SERVICE_WORKER_IGNORED` (`web-ext lint`) |

Removing either key makes the extension unusable on the corresponding
browser:

- Without `scripts`: Firefox cannot run the background script
  (`web-ext lint` reports this as `BACKGROUND_SERVICE_WORKER_NOFALLBACK`,
  an error).
- Without `service_worker`: Chrome MV3 cannot accept the manifest at
  all.

Both warnings are accepted as the cost of supporting both browsers
from one source tree. Future options (out of current scope):

- Generate per-browser manifests at build time (e.g. via a small Node
  script wrapping `web-ext build`)
- Move when Mozilla and Google converge on a shared MV3 background
  spec

## Other manifest knobs worth knowing

- **`browser_specific_settings.gecko.strict_min_version: "140.0"`** —
  Required because `browser_specific_settings.gecko.data_collection_permissions`
  was added in Firefox 140. We could lower the floor (since `scripts`
  works on Firefox 109+), but we deliberately match the ceiling of
  features we declare. This still includes Firefox 140 ESR users.
- **`browser_specific_settings.gecko.data_collection_permissions`** —
  Set to `{"required": ["none"]}`. The extension stores settings only
  in `chrome.storage.local` and fetches Canny pages from the user's
  own browser session, so no data is sent to third parties.
- **`host_permissions`** — Same patterns as `content_scripts.matches`.
  This both grants the content script its host access and surfaces a
  user-controllable "Site access" UI in `chrome://extensions`.
- **`action.default_popup`** — Always shown (no `show_matches`
  equivalent in MV3). The popup itself displays a "Not working on
  this tab now" message when the active tab is not a Canny page.

## Notes on Canny's behavior changes

Canny is a third-party service that evolves independently of this
extension. Past changes that have shaped the current code:

### `<script charSet="UTF-8">` → `<script nonce="...">`

Around 2024–2025, Canny added a Content Security Policy and switched
the embedded data script tag attribute from `charSet="UTF-8"` to a
generated `nonce`. The original regex in `fetchPostInfo` matched the
literal `charSet="UTF-8"` and stopped finding the script tag,
producing a `null.length` exception.

The current regex is attribute-agnostic:

```javascript
const scriptRex = /<script[^>]*>\s*window\.__data\s*=\s*(\{[\s\S]*?\});\s*<\/script>/;
```

If Canny changes the script wrapper again (e.g. moves the data into a
different element entirely), update `scriptRex` and add a `null`
guard if removing the existing one.

### `.postListItem` → `.postListItemV2`

Canny renamed the post list item wrapper class. The decoration code
in `decorateBoardPageWithPostInfo` calls `closest()` with both class
names so the extension keeps working on Canny instances that may
still use the old name:

```javascript
postLink.closest('.postListItem, .postListItemV2')
```

If a future class name change happens (`postListItemV3`?), extend the
selector list. The `a.postLink` and `.postTitle` classes have so far
remained stable.

### Lesson on DOM fragility

CSS-class-based DOM access is fragile against unannounced Canny
changes. The current approach is "match by literal class names, with
multi-name fallback for renames we have observed." A more durable
approach would be structural (e.g. `a.postLink` is reliable; walk up
to the first parent that contains both the link and a sibling
detail node). This has not been needed often enough to justify the
complexity, but if breakage becomes regular, reconsider.

## Build and test

### Tooling

- [`web-ext`](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) —
  installed globally via `npm install -g web-ext`. Recent versions
  (10.x) handle MV3 well.
- Node.js ≥ 18 for `web-ext`.

### Lint

From `github/browser-extension/`:

```
web-ext lint
```

Expected current state: **0 errors, 2 warnings**:

- `BACKGROUND_SERVICE_WORKER_IGNORED` — see "Cross-browser MV3
  trade-off" above
- `KEY_FIREFOX_ANDROID_UNSUPPORTED_BY_MIN_VERSION` —
  `data_collection_permissions` requires Firefox Android 142, but
  `strict_min_version` is 140.0 to keep ESR 140 users supported

If new errors or unfamiliar warnings appear after a Canny / browser /
spec change, investigate before publishing.

### Local test on Chrome

1. Open `chrome://extensions`
2. Toggle **Developer mode** on (top right)
3. Click **Load unpacked**
4. Select `github/browser-extension/`
5. The extension card should show 1 warning (the `background.scripts`
   one above) and no errors. The "Service worker" link opens the
   background console.

### Local test on Firefox

1. From `github/browser-extension/`, run `web-ext build --overwrite-dest`
2. In Firefox, open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select either `manifest.json` directly (recommended for development;
   reloads pick up file changes more easily) or the generated
   `web-ext-artifacts/canny_extension_for_end-users-<version>.zip`

The extension is removed when Firefox restarts; for persistent
installation, sign via `web-ext sign` and install the resulting xpi.

## Forking for a different Canny instance

The extension already runs on any `*.canny.io` site without
modification. To add another aliased domain (the way
`feedback.vrchat.com` is included), edit two places in
`manifest.json`:

1. `content_scripts[0].matches` — add the new pattern
2. `host_permissions` — add the same pattern

To customize behavior (decoration style, marking colors, filter
options), edit `content_script_canny.js` and `content_script_canny.css`.
The extension intentionally has no Canny-instance-specific data
hardcoded; if you find any, report it as a bug.

## Project structure

```
github/browser-extension/
├── manifest.json              # MV3 manifest (dual service_worker + scripts)
├── background.js              # service worker (Chrome) / event page (Firefox)
├── content_script_canny.js    # DOM intervention, fetchPostInfo, decoration
├── content_script_canny.css   # decoration styles (.ext_* classes)
├── popup.html / popup.js      # toolbar popup UI; also used inside the
│                              # options page via iframe
├── options.html / options.js  # full options page
├── styles.css                 # shared styling
├── images/                    # icon assets (icon1_48.png, icon1_128.png)
├── README.md                  # end-user documentation
└── MAINTAINING.md             # this file
```
