# vrchat-feedback-boards-helper

[日本語版](README-ja.md)

A helper tool for VRChat feedback boards on Canny.

Live on [https://naqtn.github.io/vrchat-feedback-boards-helper/](https://naqtn.github.io/vrchat-feedback-boards-helper/)

![screenshot of VRChat feedback boards helper](img/search-form.png)


## What's this?

[VRChat](https://hello.vrchat.com) runs the Feedback boards on [feedback.vrchat.com](https://feedback.vrchat.com/) to receive bug reports and feature requests and inform progresses of that. They uses the service of [Canny](https://canny.io/ "Canny: Customer Feedback Management Tool"). Sadly, searching UI of Canny is limited for end users. It's inconvenient. So, I made this little tool to improve it.

## What you can do

This tool provides query form and it opens Canny page for query result on other browser window (that is another tab).

What you can do with this tool are (I mean what you can't do on Canny's UI): 

- Specify search text and other conditions together. (Text and status filter etc. simultaneously) 
- "OR" condition of status for filtering. (Lists posts that have one of the specified statuses.)
- Limit result list to specific statuses, e.g. "Open" (newly posted, initial state) or "Closed" (VRChat won't work on this).
- Use sort ordering "old". (most oldest post on the first)
- Reuse search condition clearly. (You can modify condition and try it again. You can get results on each separated window and compare these.)
- Store search conditions and reuse later.

## Also see: companion browser extension

A companion browser extension, [Canny extension for End-users](browser-extension/README.md), augments Canny's post-listing pages directly: showing author names and creation dates of each post, marking your own posts, and filtering posts by author. It complements this web tool. This page composes Canny search URLs for you to open, while the extension improves how the resulting pages look once you are there. The extension requires installation in your browser; this web page does not.

## Search behavior

When you use this tool's text-search field, Canny searches across **all boards** on the site, regardless of which Board you selected in the form. The selected Board only matters for filters that don't include text search (e.g. status-only filtering). Each result is labeled with its source Board.

This cross-board behavior is a Canny-side feature. See [MAINTAINING.md](MAINTAINING.md) for technical details.

Note: Canny's home page has a search input that navigates to `/search?search=...`. This tool does **not** use that URL — opening it directly in a fresh tab does not load results reliably. This tool always uses URLs of the form `/{board}?search=...`, which work consistently and (with the cross-board behavior described above) cover all boards anyway.


## Limitation

- Canny's "My Own" filter (the `myCheckbox` in this tool) returns posts you wrote *and* posts you voted on, mixed together. There is no way to filter to only your authored posts. https://feedback.canny.io/feature-requests/p/show-my-posts https://feedback.canny.io/feature-requests/p/allow-users-to-pull-up-a-list-of-all-the-posts-theyve-made
- Canny seems to do some kind of fuzzy string searching. There's no way to exact matching. https://feedback.canny.io/feature-requests/p/offer-exact-search


## Appendix: Canny terminology

### Meaning of Sort options

Cite from [Canny help "Board Filters"](https://help.canny.io/en/articles/3827588-board-filters)

> - **Trending**: Sort the board by which posts have gotten the most votes recently. Most activity at the top.
> - **Top**: Sort by raw vote totals. Most votes at the top. Least votes at the bottom.
> - **MRR**: This option will sort posts by total MRR (Monthly Recurring Revenue) value. (NOTE: If multiple users from the same company vote on one post, the MRR value will not increase. The company's value is only counted once per post.) 
> - **Newest**: Sort the board in chronological order, newest posts first.
> - **Oldest**: Sort the board in chronological order, oldest posts first.

(VRChat seems not to use MRR. So I omit this option.)


### meaning of Status

Statuses are configured per company on Canny. As of 2026-05, VRChat uses these statuses (in Canny's order):

- **Open** (Initial type) — initial state for newly posted feedback
- **Tracked** (Active type) — VRChat is tracking the post
- **Interested** (Active type) — VRChat has expressed interest
- **In Progress** (Active type) — VRChat is actively working on this
- **Needs More Information** (Active type) — clarification is needed from the poster
- **Available in Future Release** (Complete type) — implemented in the open beta build (typically mentioned in the open beta release notes). VRChat tends to keep this status even after the corresponding live release ships, so it does not strictly mean "not yet in live".
- **Complete** (Complete type) — done
- **Closed** (Closed type) — VRChat will not work on this

The list and meanings are at VRChat's discretion and can change. Refer to VRChat's announcements for authoritative information. See [Canny's help on status](https://help.canny.io/en/articles/673583-changing-the-status-of-a-post) for general background on how the status system works.
