# vrchat-feedback-boards-helper

A helper tool for VRChat feedback boards on Canny.

Live on [https://naqtn.github.io/vrchat-feedback-boards-helper/](https://naqtn.github.io/vrchat-feedback-boards-helper/)

![screenshot of VRChat feedback boards helper](img/search-form.png)


## What's this?

[VRChat](https://hello.vrchat.com) runs the Feedback boards on [feedback.vrchat.com](https://feedback.vrchat.com/) to receive bug reports and feature requests and inform progresses of that. They uses the service of [Canny](https://canny.io/ "Canny: Customer Feedback Management Tool"). Sadly, searching UI of Canny is limited for end users. So, I made this little tool to improve it.

## What you can do

This tool provides query form and it opens Canny page for query result on other browser window (that is another tab).

What you can do with this tool are (I mean what you can't do on Canny's UI): 

- Specify search text and other conditions together. (Text and status filter etc. simultaneously) 
- Multiple selection of statuses for filtering.
- Limit result list to posts with "Open", "Closed" status. ("Open" has no reply from the dev. "Closed" is rejected one.)
- Use sort ordering "old". (most oldest post on the first)
- Reuse search condition clearly. (You can modify condition and try it again. You can get separated result pages to compare.)
- search from all Boards.


## Setup for "search from all Boards"

To use "search from all Boards" feature you must allow popup window for this tool.
Check your browser's setting of "pop up blocker" in security section.

Though the detail depends on what browser you use, common and easy way is

1. Press "search (from all Boards)" button.
2. Your browser may show alert icon on tool bar.
3. Click the icon to show dialog.
4. Check "allow" box and confirm it.

### Chrome dialog:
![popup blocking configuration dialog of Chrome](img/chrome-popup-en-noted-70pc.png)

### Firefox dialog:
![popup blocking configuration dialog of Firefox](img/firefox-popup-en-noted-70pc.png)


## Limitation

- It's impossible to list posts that you originally wrote. Canny doesn't support such query. https://feedback.canny.io/feature-requests/p/show-my-posts


## Appendix: Canny terminology

### Meaning of Sort

Cite from [Canny help "Board Filters"](https://help.canny.io/en/articles/3827588-board-filters)

> Trending: Sort the board by which posts have gotten the most votes recently. Most activity at the top.
>
> - **Top**: Sort by raw vote totals. Most votes at the top. Least votes at the bottom.
> - **MRR**: This option will sort posts by total MRR (Monthly Recurring Revenue) value. (NOTE: If multiple users from the same company vote on one post, the MRR value will not increase. The company's value is only counted once per post.) 
> - **Newest**: Sort the board in chronological order, newest posts first.
> - **Oldest**: Sort the board in chronological order, oldest posts first.

(VRChat seems not to use MRR.)


### meaning of Status

Cite from [Canny help "Changing the status of a post"](https://help.canny.io/en/articles/673583-changing-the-status-of-a-post)

> The available statuses are:
> 
> - **Open** (No status)
> - **Under Review** (We are considering this)
> - **Planned** (We are planning to work on this)
> - **In Progress** (We are actively working on this)
> - **Complete** (We are done working on this)
> - **Closed** (We will not work on this)

("On Hold" is defined internally but it isn't used now?)
