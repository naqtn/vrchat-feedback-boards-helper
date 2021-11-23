# Canny extension for End-users

## Features

This extension adds following features on the post list pages of [Canny](https://canny.io/).

- Show author name of each post
- Show the date each post is created
- Mark your own posts that you originally wrote (represented as background color)
- Mark posts by author names
- Visibility filter for posts 
  - Only posts that you wrote (Hide other people's posts)
  - by author names (Only show posts written by specified authors)

## Warnings and Limitations

### Depends on Canny but is not affiliated

- ["Canny is a feedback tool that makes it easy for teams to understand what their customers are asking for. "](https://canny.io/blog/canny-for-sales/)
- This extension "Canny extension for end-uses" is not affiliated with Canny Inc.
- Do not confuse with
 [Canny Chrome Extension](https://chrome.google.com/webstore/detail/canny/ppljpoflocngelbkbmebgkpdbbjaejhi)
 ([help page](https://help.canny.io/en/articles/5633815-chrome-extension)) by Canny Inc.
- We developed this extension originally for feedback boards of [VRChat](https://vrchat.com) running on Canny.io. So it works also on "https://feedback.vrchat.com/".
- This extension might stop working because of changes on Canny's system in the future.

### Personal data
- This extension reads your identity value embedded in Canny's pages to mark posts you wrote.
- But it doesn't store/send your personal data to anywhere.

### Network usage
- This extension increases network load same as opening every posts on the post list you browse. 
- You can suppress this network activity by check-off "Allow network usage" in the settings.

## Contacts
- https://github.com/naqtn/vrchat-feedback-boards-helper/issues


## Installation on Chrome

Currently, this extension is in the early stage of development,
and it isn't hosted on the Chrome Web Store yet.
So you need Chrome extension developer mode to install.

Install steps:

0. download from [release](https://github.com/naqtn/vrchat-feedback-boards-helper/releases) or clone the repo.
1. Extract and copy files to anywhere you want.
2. Start Chrome.
3. Open `chrome://extensions/` URL to show the "Extension Management" page.
   (Alternatively, from "Chrome menu" > "More Tools" > "Extensions")
4. Enable "Developer Mode" by a switch on right upper of the page.
5. Press the "Load unpacked" button and select the directory that you choose on step 1.
6. If you already open VRChat feedback board (that is Canny), you may need reload it to apply newly installed this extension.


## Guides

### Changing settings
- Show popup and configure (Same manner as other extensions. See below for details)
- Settings will be applied immediately on browsing page.
- Currently you can't save settings. It sustains while the session only. (That is until you close the tab.)

### Chrome: How to show popup
1. While browsing Canny pages,
2. Click Chrome extensions button on toolbar. (Like a jigsaw puzzle piece icon on right upper of the window)
3. Choose this extension
4. Then a popup window appears.
5. Tips: You can pin the icon on the toolbar for a short cut.

### Firefox: How to show popup
1. While browsing Canny pages,
2. Click the icon of this extension that is displayed inside the browser address bar (right side of the bar).
3. Then a popup window appears.

