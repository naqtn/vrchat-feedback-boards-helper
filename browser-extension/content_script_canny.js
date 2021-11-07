// content_script_canny.js
'use strict';
console.log('Hi from content_script_canny.js');

const PageType = {
    UNKNOWN: 'PAGE_TYPE_UNKNOWN',
    CANNY_BOARD: 'PAGE_TYPE_CANNY_BOARD',
    CANNY_POST: 'PAGE_TYPE_CANNY_POST',
};
Object.freeze(PageType);


// This must not conflict with the site.
const settingsKey = 'feedback-boards-helper-settings-9336cbd2-d106-4850-942e-3b1ff754a437';

const getInitialSettings = () => {
    const storageVal = sessionStorage.getItem(settingsKey);
    if (storageVal) {
        try {
            return JSON.parse(storageVal);
        } catch (SyntaxError) {
            // empty
        }
    }
    // TODO try to load from chrome.storage
    return {
        isMarkMyPosts: false,
        isHideOthersPosts: false,
        isShowAuthorName: true,
        isCreatedDate: true,
        isFilterByAuthorNames: false,
        isMarkPostsByAuthorNames: false,
        authorNames: [],
    };
}

const currentSettings = getInitialSettings();

const storeSettings = (partialSettingsObject) => {
    Object.assign(currentSettings, partialSettingsObject);
    const str = JSON.stringify(currentSettings);
    sessionStorage.setItem(settingsKey, str);
};

/**
 * Detect the type of current page.
 */
const detectPageType = () => {
    // pathname is like this:
    // Board :        "/feature-requests"
    // Post :         "/feature-requests/p/some-post-title"
    // Notifications: "/notifications"
    const pathElements = window.location.pathname.split('/');
    switch (pathElements.length) {
        case 2:
            return PageType.CANNY_BOARD;
        case 4:
            if (pathElements[2] === 'p') {
                return PageType.CANNY_POST;
            }
            break;
        default:
            break;
    }
    return PageType.UNKNOWN;
};


/**
 * Find Canny Post links under specified element.
 * 
 * Post link is a string formatted like this: "/{Board_urlName}/p/{Post_urlName}"
 * PageType of current page should be PageType.CANNY_BOARD.
 */
const findCannyPostLinks = (element) => {
    const result = [];
    const postLinks = element.querySelectorAll('a.postLink');
    for (const post of postLinks) {
        const href = post.getAttribute('href');
        console.log('Found a post link. href=', href);
        result.push(href);
    }
    return result;
};


/**
 * Find Canny data script from current page.
 * 
 * Browser extension can't access page window.
 * console.log('window.__data=', window.__data); => undefined
 * So try to pickup data from script tag
 */
const findCannyDataScript = () => {
    for (const scriptTag of document.scripts) {
        const script = scriptTag.innerText;
        if ((0 <= script.indexOf('window.__data'))
            && (0 <= script.indexOf('__canny__'))) {

            console.log('found the data script');
            return script;
        }
    }
    return null;
};

const postInfoCache = new Map();
const storePostInfo = (postInfo) => {
    const key = postInfo.postLink;
    postInfoCache.set(key, postInfo);
};

/**
 * @returns PostInfo. undefined if not exist.
 */
const queryPostInfo = (postLink) => {
    return postInfoCache.get(postLink);
};

/**
 * Extract Canny Post info object from Canny Data object
 * 
 * PageType of the page where specified dataObject comes from should be PageType.CANNY_POST.
 */
const extractPostInfoFromDataObject = (dataObj, postLink) => {
    // From the Post point of view,
    // the structure of dataObj is like this:
    // posts[{board_id_string}][{urlName}].authorID
    const posts = dataObj.posts;
    const keys1 = Object.keys(posts);
    if (keys1.length !== 1) {
        console.log('unexpected posts length');
    } else {
        const boardId = keys1[0];
        const boardObj = posts[boardId];
        const keys2 = Object.keys(boardObj);
        if (keys2.length !== 1) {
            console.log('unexpected post object structure');
        } else {
            const post_urlName = keys2[0];
            const postObject = boardObj[post_urlName];

            console.log('postObject.authorID=', postObject.authorID);
            console.log('postObject.author.name=', postObject.author.name);
            console.log('dataObj.viewer._id=', dataObj.viewer._id);

            // This is PostInfo definition:
            return {
                postLink: postLink,
                urlName: post_urlName,
                created: postObject.created,
                statusChanged: postObject.statusChanged,
                authorID: postObject.authorID,
                authorName: postObject.author.name,
                isAuthorIsViewer: (postObject.authorID === dataObj.viewer._id),
            };
        }
    }
    return null;
};

/**
 * Fetch Post info
 * Returns Promise. It passes Post info if resolved.
 */
const fetchPostInfo = (postLink) => {
    return new Promise((resolve, reject) => {
        const relativeBase = window.location.origin;
        const urlStr = relativeBase + postLink;
        const initObj = {
            method: 'GET',
        };
        console.log('try to fetch url=', urlStr);
        fetch(urlStr, initObj)
            .then((response) => {
                console.log('response', response);
                if (!response.ok) {
                    reject(`HTTP error. status=${response.status}`);
                }
                return response.text();
            }, () => {
                reject('fetch failed');
            })
            .then((text) => {
                // console.log('fetched text=', text);

                // Extract embed data script.
                // We simply cut as a text instead of HTML parsing.
                // Though this may change on Canny side and not stable,
                // we choose easy way to implement right now.
                const scriptRex = new RegExp('<script charSet="UTF-8">window.__data = (.*?);</script>');
                const found = text.match(scriptRex);
                console.log('match found=', found);
                if (found.length !== 2) {
                    reject('failed to extract data from Canny post');
                } else {
                    return found[1];
                }
            })
            .then((dataObjectSource) => {
                // try JSON.parse instead of "eval in sandbox" or parsing.
                const modified = dataObjectSource.replaceAll(':undefined,', ':null,');
                // console.log('string to parse modified=', modified);
                const dataObj = JSON.parse(modified);
                console.log('parsed dataObj=', dataObj);
                const postInfo = extractPostInfoFromDataObject(dataObj, postLink);
                if (postInfo) {
                    resolve(postInfo);
                } else {
                    reject('fail to extractPostInfoFromDataObject');
                }

            });
    });
};


/**
 * Ensure an injected PostInfo div exists
 */
const ensurePostInfoExtDiv = (postListItem) => {
    const found = postListItem.querySelector('.ext_postInfoExt');
    if (found) {
        return found;
    }
    const newOne = document.createElement('div');
    newOne.classList.add('ext_postInfoExt');
    newOne.innerHTML = '<span class="ext_name"></span><span class="ext_created"></span>';
    const postTitle = postListItem.querySelector('.postTitle');
    const insertPoint = postTitle.parentNode;

    insertPoint.appendChild(newOne);
    return newOne;
};

/**
 * Decorate current Board page with specified Post info
 */
const decorateBoardPageWithPostInfo = (postInfo) => {
    const query = `a.postLink[href="${postInfo.postLink}"]`;
    // console.log('decorateBoardPageWithPostInfo query=', query);
    const links = document.querySelectorAll(query);
    for (const postLink of links) {
        const postListItem = postLink.closest('.postListItem');
        // postListItem could be null. (for instance, this postLink is in Notification popup) 
        if (postListItem) {

            // additional info
            const postInfoExt = ensurePostInfoExtDiv(postListItem);
            const nameSpan = postInfoExt.querySelector('.ext_name');
            nameSpan.innerText = (currentSettings.isShowAuthorName) ? postInfo.authorName : '';
            const createdSpan = postInfoExt.querySelector('.ext_created');
            if (currentSettings.isCreatedDate) {
                if (!postInfo.createdDateString) {
                    const date = new Date(postInfo.created);
                    postInfo.createdDateString = date.toLocaleDateString();
                }
                createdSpan.innerText = postInfo.createdDateString;
            } else {
                createdSpan.innerText = '';
            }

            // mine or others
            if (postInfo.isAuthorIsViewer) {
                if (currentSettings.isMarkMyPosts) {
                    postListItem.classList.add('markMyPost');
                } else {
                    postListItem.classList.remove('markMyPost');
                }
            } else {
                if (currentSettings.isHideOthersPosts) {
                    postListItem.classList.add('hidePost');
                } else {
                    postListItem.classList.remove('hidePost');
                }
            }

            // specified authors
            const authorIncluded = currentSettings.authorNames.includes(postInfo.authorName);
            if (currentSettings.isFilterByAuthorNames) {
                if (authorIncluded) {
                    postListItem.classList.remove('hidePost');
                } else {
                    postListItem.classList.add('hidePost');
                }
            } else {
                postListItem.classList.remove('hidePost');
            }
            if (currentSettings.isMarkPostsByAuthorNames) {
                if (authorIncluded) {
                    postListItem.classList.add('markAuthorPost');
                } else {
                    postListItem.classList.remove('markAuthorPost');
                }
            } else {
                postListItem.classList.remove('markAuthorPost');
            }

        }
    }
};


/**
 * Decorate current Board page with specified PostLinks asynchronously.
 */
const decorateBoardPageWithPostLinks = (postLinks) => {
    for (const link of postLinks) {

        const storedPostInfo = queryPostInfo(link);
        if (storedPostInfo) {
            decorateBoardPageWithPostInfo(storedPostInfo);
            continue;
        }

        fetchPostInfo(link)
            .then((postInfo) => {
                console.log('Got postInfo=', postInfo);
                storePostInfo(postInfo);
                decorateBoardPageWithPostInfo(postInfo);
            }, (reason) => {
                console.log('Failed to get postInfo link=', link);
            });
    }
};


const setupMutationObserver = () => {
    const targetNode = document.body; // document.querySelector('.posts');
    const config = { attributes: false, childList: true, subtree: true };

    const callback = (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            // console.log('mutation=', mutation);
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    // When you scroll down to "read more" `.postListItem` will be added.
                    // When you do browser-back whole elements under `.publicContainer` will be replaced.
                    // So, to simplify, we search from added div, whatever it is.
                    if (node.nodeName === 'DIV') {
                        const postLinks = findCannyPostLinks(node);
                        decorateBoardPageWithPostLinks(postLinks);
                    }
                }
            }
        }
    };
    const mutationObserver = new MutationObserver(callback);
    mutationObserver.observe(targetNode, config);
};

// To investigate DOM mutation while developing this extension
// 
// Board page mutation
// - scroll down: add <div class="postListItem">
// - change sort: remove and add <div class="postListItem"> under <div class="posts">
// - change board: remove and add <div class="boardHome"> under <div class="publicContainer">
const setupMutationObserverToInvestigate = () => {
    const targetNode = document.body;
    const config = { attributes: false, childList: true, subtree: true };

    const callback = (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            // console.log('mutation=', mutation);
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    console.log('added node=', node);
                }
                for (const node of mutation.removedNodes) {
                    console.log('removed node=', node);
                }
            }
        }
    };
    const mutationObserver = new MutationObserver(callback);
    mutationObserver.observe(targetNode, config);
};


/**
 * apply settings (change decoration style etc.)
 * settings param could be partial settings object
 */
const applySettings = (settings) => {
    console.log('applySettings settings=', settings);

    storeSettings(settings);

    const pageType = detectPageType();
    console.log('pageType=' + pageType);
    if (pageType === PageType.CANNY_BOARD) {
        const postLinks = findCannyPostLinks(document.body);
        decorateBoardPageWithPostLinks(postLinks);
    }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('onMessage content script message=', message);
    switch (message.type) {
        case 'getCurrentSettings':
            sendResponse(currentSettings);
            break;
        case 'applySettings':
            applySettings(message.data);
            break;
    }
});

const main = () => {
    console.log('content_script_canny.js main');

    // Setup initial settings.
    // Decorate items initially showed as a side effect.
    applySettings({});

    setupMutationObserver();

    // setupMutationObserverToInvestigate();
};
main();
