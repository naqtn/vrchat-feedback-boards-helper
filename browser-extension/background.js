// background.js
'use strict';

console.log('hello from background.js');


// We need to call this to show popup on Chrome
// https://stackoverflow.com/a/35885914/3180048
// (Chrome alters icon image between disabled (grayed out image) and enabled automatically
// as show_matches specified in the manifest. 
// But it seems not to change click listener. Chrome ver 95.0)
const showPageAction = (tabId) => {
    chrome.pageAction.show(tabId);
};


const currentSettings = {}; // cache
const defaultSettings = {
    fetchActive: false,
    showAuthorName: true,
    showCreatedDate: true,
    markMyPosts: false,
    markPostsByAuthorNames: false,
    visibilityFilter: 'SHOW_ALL',
    authorNames: ['foo', 'quux'],
};

const getSettingsFromStorage = (callback) => {
    chrome.storage.local.get({'settings': defaultSettings}, (data) => {
        Object.assign(currentSettings, data.settings);
        callback(currentSettings);
    });
};

const setSettingsToStorage = (settings) => {
    Object.assign(currentSettings, settings);
    chrome.storage.local.set({'settings': currentSettings});
};

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        switch (message.type) {
            case 'showPageAction': {
                showPageAction(sender.tab.id);
                break;
            }
            case 'getSettingsFromStorage': {
                getSettingsFromStorage(sendResponse);
                return true; // callback asynchronously
            }
            case 'setSettingsToStorage': {
                setSettingsToStorage(message.data);
                break;
            }
        }
        return false; // Default is synchronous. Don't keep sendResponse.
    });
