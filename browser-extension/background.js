// background.js
'use strict';

console.log('hello from background.js');

chrome.extension.onMessage.addListener(
    (request, sender, sendResponse) => {
        switch (request.type) {
            case 'showPageAction': {
                // We need to call this to show popup on Chrome
                // https://stackoverflow.com/a/35885914/3180048
                // (Chrome alters icon image between disabled (grayed out image) and enabled automatically
                // as show_matches specified in the manifest. 
                // But it seems not to change click listener. Chrome ver 95.0)
                chrome.pageAction.show(sender.tab.id);
                break;
            }
        }
    });
