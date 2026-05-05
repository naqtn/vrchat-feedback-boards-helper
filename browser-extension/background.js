// background.js
'use strict';

console.log('hello from background.js');


const defaultSettings = {
    fetchActive: true,
    showAuthorName: true,
    showCreatedDate: true,
    markMyPosts: true,
    markPostsByAuthorNames: false,
    visibilityFilter: 'SHOW_ALL',
    authorNames: [],
};

const getSettingsFromStorage = (callback) => {
    chrome.storage.local.get({'settings': defaultSettings}, (data) => {
        callback(data.settings);
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
