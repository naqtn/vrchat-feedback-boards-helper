// background.js
'use strict';

console.log('hello from background.js');


const defaultSettings = {
    fetchActive: true,
    showAuthorName: true,
    showCreatedDate: true,
    markMyPosts: true,
    markPostsByAuthorNames: false,
    authorFilter: 'SHOW_ALL',
    hideForeignBoardPosts: false,
    authorNames: [],
};

// 1.1.0 renamed visibilityFilter -> authorFilter (the umbrella term
// "visibility filter" now covers both author-based and board-based filters).
// Migrate the value if the user is upgrading from an earlier version.
// This block can be removed several versions after 1.1.0 is widely adopted.
const migrateLegacyKeys = (settings) => {
    if (settings.visibilityFilter !== undefined && settings.authorFilter === undefined) {
        settings.authorFilter = settings.visibilityFilter;
    }
    delete settings.visibilityFilter;
    return settings;
};

const getSettingsFromStorage = (callback) => {
    chrome.storage.local.get({'settings': defaultSettings}, (data) => {
        const settings = migrateLegacyKeys(data.settings);
        callback(settings);
    });
};

// Read-modify-write: under MV3 the service worker may have been idle and
// any in-memory cache cannot be trusted, so storage is the source of truth.
const setSettingsToStorage = (settings) => {
    chrome.storage.local.get({'settings': defaultSettings}, (data) => {
        const merged = Object.assign({}, data.settings, settings);
        chrome.storage.local.set({'settings': merged});
    });
};

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        switch (message.type) {
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
