# Cookbook for VRChat's Canny feedback site

[日本語版](COOKBOOK-ja.md)

If you use VRChat's feedback site (feedback.vrchat.com, built on Canny) often, you may have hit cases where finding the right post is harder than expected. This cookbook collects practical patterns for those cases.

The patterns below use one or both of:
- The browser extension (works on any Canny site)
- The VRChat search web page

Both are introduced at https://github.com/naqtn/vrchat-feedback-boards-helper.

## Find a topic without noise from other boards

When you search for a topic on one board, results from other boards show up too (cross-board text search is a Canny feature that VRChat has enabled on its site). For example, looking for "avatar" on the Localization board to find translation-related posts also returns posts about avatar bugs and avatar creation from other boards.

In the browser extension, turn on "Hide posts from other boards".

The list now shows only posts from the board you are on. The unrelated avatar-bug posts disappear.

## Find a post you wrote in the past

You remember writing a post about something, but you cannot find it. Canny's "My Own" filter shows posts you wrote together with posts you only voted on, and the post list does not display author names, so you cannot tell which is which.

In the browser extension, change the filter setting to "Only posts that I wrote".

The list now contains only your own writings. There may still be many, but reading text you wrote yourself is faster than scanning unfamiliar titles and snippets.

## Find an old post

You are looking for a post you remember from some time ago, but it sits deep in the list. Canny's default sort puts trending and recent posts first, and an "Oldest" sort option is not offered.

On the web page, set Sort to Oldest.

The list now starts from the earliest matching posts. Combined with a date display (see "Narrow down by date" below), you can quickly home in on the time period you remember.

## Highlight posts by people you trust

When you scan a board's new-post stream, it is hard to tell at a glance which posts are worth reading carefully. Useful posts get mixed in with less informative ones.

In the browser extension, add the names of posters you find consistently useful to "Author Names" and enable "Mark posts by specific authors". Their posts get a colored highlight in the list.

If you want to filter even more strongly, switch to "Only posts by specified authors" instead. The "Author Names" list also helps in another situation: when you remember who wrote a specific post but cannot locate it, add their name there to narrow the list.

## Watch a topic over time

There is a topic you want to keep checking on over weeks or months, for example to follow how a particular feature is being reported on. Re-entering the same search conditions every time is tedious.

On the web page, save your search conditions with a short memo.

Load the saved condition any time and run the same search. Browser bookmarks work too, but the saved-conditions list shows your memos and is easier to manage when you have several.

## Narrow down by date

You remember roughly when a post was made, but Canny's text search results are not sorted by date, and the post list does not show dates.

On the web page, set Sort to Newest or Oldest. In the browser extension, turn on "Show the date each post is created". The list now shows the date alongside each entry.

You can scroll to the time range you remember and skip posts outside it. (Canny's UI does not let you combine text search with sort, but the VRChat search web page does.)

## Find posts that VRChat decided not to act on

You want to look up posts that VRChat has marked as won't-fix or otherwise closed. Canny's filter UI does not let you select Closed as a status.

On the web page, set Status to Closed and search.

This is useful as background research, for example before posting a new request, to check whether the same idea has already been declined.

## Find posts still waiting for evaluation

You want to find posts that have not received a status update yet. Canny's filter UI does not let you select Open as a status either.

On the web page, set Status to Open and search.

The web page also accepts multiple statuses at the same time, so you can search for Open together with Tracked, Interested, and similar in-progress statuses if you want broader coverage.

## Putting it all together: finding an old, unresolved post

You remember a post about a topic that has not yet been resolved, but you cannot find it. The challenge combines several difficulties: it is old (so it is deep in the list), the post may be in any of several non-final statuses (Open, Tracked, Interested, In Progress, Needs More Information), and text search returns posts from other boards too.

On the web page:
- Set Sort to Oldest
- Check the status options listed above (the web page supports selecting multiple statuses)
- Run the search

Open the results in the browser with the extension turned on:
- "Hide posts from other boards" to drop unrelated noise
- "Show the date each post is created" so you can skip posts that are clearly too new
- If you remember the author, register them under "Author Names" and use "Mark posts by specific authors"
- If you might have written it yourself, enable "Mark my posts"

Even hard-to-find old posts become tractable when the tools are combined.
