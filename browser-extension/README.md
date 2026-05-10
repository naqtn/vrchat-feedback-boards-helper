# Canny extension for End-users

[日本語版](README-ja.md)

A browser extension that adds power-user features to feedback sites
that run on [Canny](https://canny.io/), a feedback collection
service.

## What it does

The extension activates only on Canny-powered feedback sites. It
improves the post-listing experience by surfacing information that
Canny does not show by default, by marking posts that match criteria
you choose, and by letting you hide posts that fall outside a filter.

You can try it on the Canny project's own feedback board:
<https://feedback.canny.io/>

![Screenshot of the extension on a Canny board page, with author and date information added to posts and the settings popup overlay (Firefox)](doc-img/whole-firefox.png)

## Features

- **Show author name and creation date of each post** in the board
  listing. Canny normally shows neither; with this extension you can
  scan author and recency at a glance.
- **Mark your own posts** with a distinct background color, so you
  can spot them in long lists.
- **Mark posts by specific authors** you configure by name — same
  idea, applied to other contributors.
- **Visibility filter**: hide all posts except your own, or hide all
  posts except those by specific authors. Canny does not provide
  author-based filtering; this fills that gap.
- **Each feature can be enabled or disabled independently** through
  the extension's options page or the toolbar popup. Settings are
  stored on your device and persist across sessions.
- **Dark mode aware**: when Canny is in dark mode, marking colors
  switch to dark-mode-friendly variants automatically.

## Where it works

- Any `*.canny.io` site (e.g. `feedback.canny.io`)
- `feedback.vrchat.com` (a known alias for VRChat's Canny instance)

## Installation

### Chrome / Chromium-based browsers

Install from the Chrome Web Store:
<https://chromewebstore.google.com/detail/canny-extension-for-end-u/kegipopmleihfiidkcjngbcjoanmceak>

### Firefox

Install from Mozilla Add-ons (AMO): _link to be added once the 1.1.0
listed-mode submission is approved._

In the meantime, you can install from source — see
[MAINTAINING.md](MAINTAINING.md) for the build and sideload steps.

### From source (for developers / forkers)

See [MAINTAINING.md](MAINTAINING.md).

## Using the extension

After installation, visit a Canny feedback site (e.g.
<https://feedback.canny.io/feature-requests>). The extension's icon
(<img src="images/icon1_48.png" width="20" height="20" alt="extension icon">)
is initially listed inside your browser's extensions menu (opened
from the puzzle-piece icon on the toolbar). Click the extension's
icon there to open the popup. For quicker access, your browser lets
you pin the icon directly to the toolbar.

### Settings

The extension exposes the same settings in two places:

- The **popup** (toolbar icon) edits settings for the **current tab
  session only**. Changes apply immediately to the active tab.
- The **options page** (opened from the popup's "Help and Options"
  button) edits **default settings** that apply to every new tab.

![Screenshot of the settings popup showing all available options (Firefox)](doc-img/settings-popup-firefox.png)

The settings themselves are:

- **Allow network usage to get post details** — controls whether the
  extension fetches each post's individual page to read author and
  date information. Disable to suppress this extra network activity.
- **Show author name of each post** — adds the author name to each
  row in the post listing.
- **Show the date each post is created** — adds the creation date to
  each row.
- **Mark my posts** — applies a background color to posts you
  authored. Requires you to be logged in to the Canny site so the
  extension can identify which posts are yours.
- **Mark posts by specified authors** — applies a different
  background color to posts authored by names you list.
- **Visibility filters** — two filters that operate independently
  and combine. A post is shown only when both filters allow it.
  - **Filter by author** — choose between "Show all posts", "Only
    posts that I wrote", or "Only posts by specified authors".
  - **Hide posts from other boards** — when on, hides posts whose
    board does not match the current page's board. Useful when
    Canny's cross-board search returns posts from other boards.
    Default: off.
- **Author Names** — the list of names used by the marking and
  filtering features above. Add and remove entries with the `+` and
  `-` buttons.

### Session settings vs. default settings

- **Store as Defaults** (popup button) — saves the current session
  settings as the new defaults.
- **Reload from Defaults** (popup button) — restores the session
  settings from the stored defaults.

Both kinds of settings live in your browser's local storage; nothing
is sent to any server.

## Also see: cookbook of useful patterns

[COOKBOOK.md](../COOKBOOK.md) (at the repository root) collects
recipes that combine this extension with the companion VRChat search
web page for common situations on the VRChat Canny site.

## Privacy

This extension does not collect, transmit, or share any personal
data. It does not include analytics or telemetry.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Source, issues, and license

- Source code: <https://github.com/naqtn/vrchat-feedback-boards-helper>
- Issue tracker: <https://github.com/naqtn/vrchat-feedback-boards-helper/issues>
- For maintainers and forkers: [MAINTAINING.md](MAINTAINING.md)

Distributed under the MIT License.

## Notes and limitations

- The extension reads a Canny page's structure to extract the
  additional information; if Canny significantly changes its page
  structure, the extension may temporarily stop working until it is
  updated.
- The extension's per-post detail enrichment makes one extra network
  request per post; on very large boards this is noticeable. Disable
  "Allow network usage to get post details" to suppress this.
- Canny themselves publish a separate official
  ["Canny" Chrome extension](https://chromewebstore.google.com/detail/canny/ppljpoflocngelbkbmebgkpdbbjaejhi)
  for a different purpose (admin/team use); do not confuse the two.

## Not affiliated with Canny Inc.

This is an independent third-party extension. It is not made by,
endorsed by, or affiliated with [Canny Inc.](https://canny.io/), the
company that runs the Canny service.
