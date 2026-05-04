# Maintaining notes

This file is for **maintainers and forkers** of this tool. End users
should read [README.md](README.md) instead.

## What this tool depends on

This tool builds compound query URLs for [Canny](https://canny.io/)
feedback sites. It is shipped pre-configured for
[feedback.vrchat.com](https://feedback.vrchat.com/), VRChat's Canny
instance, but the underlying mechanism is generic to Canny.

### Canny-specific (works on any Canny site)

The query URL syntax is the same on any Canny site:

- `?search=<text>` — text search
- `?status=<urlName>` or `?status=A_B_C` — status filter (multiple values
  joined by `_`)
- `?sort=<trending|top|new|old|relevance>` — result ordering
- `?filter=my` — viewer's own posts and voted posts (login required)
- `?category=<urlName>` — board-internal category filter (only works on
  boards that have categories configured)

### Specific to VRChat (`cannySiteData[0]` in `source.js`)

The list of boards in `cannySiteData[0].boards` matches what VRChat
publishes on Canny. The list of status checkboxes in `index.html`
matches the statuses that VRChat has configured at the company level
on Canny.

> **Both of these are managed by the company that runs the Canny site
> (VRChat in our case), not by Canny itself.** The set of boards and the
> set of statuses can be added to, renamed, or removed at any time. When
> that happens, this tool's data needs to be updated to match.

The branding (page title, links to README, references to "VRChat" in
text) is also VRChat-specific.

## Forking for a different Canny site

If you want to use this as a starting point for a different
Canny-powered feedback site, the changes you need are:

1. **`source.js`**:
   - Update `cannySiteData[0].name`, `baseURL`, and `boards` to match
     the target site
2. **`index.html`**:
   - Update the status checkboxes inside `<fieldset id="statusSelect">`
     to match the target company's statuses
   - Update the page title, headings, and references to VRChat
   - **Update the README links** in two places: the inline help links
     next to the search field (`help(En)` / `ヘルプ(Ja)`) and the
     README list near the bottom of the page. These are absolute URLs
     pointing to the canonical
     `https://github.com/naqtn/vrchat-feedback-boards-helper` repo
     because GitHub Pages serves `.md` files as raw markdown rather
     than rendered HTML, so a same-origin relative link from this page
     to `README.md` does not produce a useful view. Forks should
     repoint these URLs to their own repository.
3. **`README.md` / `README-ja.md`**: update the prose and links

### Finding the boards and statuses for a Canny site

Both pieces of data are embedded in the page itself; you do not need
API access.

1. Open the target Canny site in a browser (e.g. `https://feedback.example.com/`)
2. Open DevTools (F12) → Console
3. Inspect:
   - `window.__data.boards.items` — keys are board urlNames, values
     contain `name`, `urlName`, etc.
   - `window.__data.company.statuses` — array of status objects with
     `name`, `urlName`, `order`, `type` (`Initial`/`Active`/`Complete`/`Closed`)

Use the `urlName` values for the form data and URL parameters. Use the
`name` values for the human-readable labels in the UI.

Note: some boards may be visible only to logged-in users or to a subset
of users. To get the public-only view, do this in a fresh browser
session without logging in.

## Notes on Canny's behavior changes

Canny is a third-party service that evolves independently of this
tool. A few notable changes that have shaped the current code:

### `company.enableGlobalPostSearch`

Canny added a feature where, if the company-level setting
`enableGlobalPostSearch` is `true`, a `?search=...` query on any
specific board page returns results from **all boards**, not just the
specified one. The board path becomes effectively decorative for text
searches, though status-only filters still respect the board path.

VRChat has this setting enabled. Cross-board search results from this
tool include posts from any board, with the board name shown next to
each post.

**If a Canny site you fork this for has `enableGlobalPostSearch`
disabled** (or VRChat disables it later), `?search=...` will be scoped
to the single board in the URL path. Cross-board search will require
opening multiple URLs, one per board. The git history of this
repository contains a previous implementation of that workaround:

- The "Search (from all Boards)" button (removed in commit `0dbee5c`)
  opened one tab per board in a loop
- A popup-blocker warning UI guided users through allowing the popups
  (also removed in `0dbee5c`)
- Inspect the parent of that commit to see the prior implementation

### `/search?search=...` URL on the Canny home page

VRChat Canny's home page has a global search input. Typing into it
navigates the SPA to `/search?search=<text>` and shows cross-board
results. However, opening this URL directly in a fresh browser tab
does not load results — the loading spinner stays indefinitely. This
appears to be a Canny-side issue with how that route is hydrated.
Last verified on 2026-05-04; Canny may have fixed it since, so confirm
the current behavior before relying on workarounds in this section.

**This tool always builds board-page URLs (`/{board}?search=...`), not
`/search?...` URLs**, both because the latter is unreliable for direct
opening and because the former covers the all-board case anyway when
`enableGlobalPostSearch` is on.

### Status names are configurable per company

Originally Canny had a fixed enum of statuses (`open`, `under-review`,
`planned`, `in-progress`, `complete`, `closed`). Around 2021–2022,
Canny added a feature letting each company define its own statuses.
VRChat has been adjusting their status list since then.

If a status used in this tool's UI ever gets renamed or removed by
VRChat, requests using that status urlName will be silently ignored by
Canny — the response is the same as a baseline (no status filter)
query, not an error. This means stale status options can produce
**misleading results** rather than an obvious failure.

When reviewing this tool periodically, verify the status list against
`window.__data.company.statuses` (see "Finding the boards and statuses"
above). If anything has drifted, update both `index.html` and any
related documentation.

## Browser tooling caveats

### Popups and multi-window operations

If a future change reintroduces opening multiple windows from a single
user gesture (as the historical "Search (from all Boards)" feature did),
expect to deal with browser popup blockers. The previous design opened
~21 tabs per click and required users to enable popups for the site;
the tradeoffs were significant enough that the feature was retired
when it became unnecessary.

If you bring back something similar, consider also reintroducing the
guidance UI for popup-blocker configuration (also visible in commit
`0dbee5c`'s parent).

## Project structure

```
github/                       # contents of the GitHub Pages site
├── index.html                # the form UI
├── source.js                 # query composition, history, list management
├── style.css                 # styling
├── libs/
│   └── list.js-2.3.1/        # third-party list rendering library
├── img/                      # icons and screenshots
├── browser-extension/        # the companion browser extension (separate
│                             # tool, generic to any Canny site)
├── README.md / README-ja.md  # end-user documentation
├── MAINTAINING.md            # this file
├── LICENSE                   # MIT
├── .gitignore
└── .gitattributes            # enforces LF line endings
```

The web page (`index.html`, `source.js`, `style.css`, `libs/`) and the
browser extension (`browser-extension/`) are independent. The web page
is VRChat-specific by design; the browser extension is generic to any
Canny site (its content scripts run on `*.canny.io` and on
`feedback.vrchat.com` as an alias).
