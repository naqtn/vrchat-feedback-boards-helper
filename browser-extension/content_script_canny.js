// content_script_canny.js
'use strict';
console.log('Hi from content_script_canny.js');


const cannyPageBase = 'https://feedback.vrchat.com';

const PageType = {
    UNKNOWN: 'PAGE_TYPE_UNKNOWN',
    CANNY_BOARD: 'PAGE_TYPE_CANNY_BOARD',
    CANNY_POST: 'PAGE_TYPE_CANNY_POST',
};
Object.freeze(PageType);

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

        const urlStr = cannyPageBase + postLink;
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
 * Decorate current Board page with specified Post info
 */
const decorateBoardPageWithPostInfo = (postInfo) => {
    const query = `a.postLink[href="${postInfo.postLink}"]`;
    console.log('decorateBoardPageWithPostInfo query=', query);
    const links = document.querySelectorAll(query);
    for (const postLink of links) {
        if (postLink && postInfo.isAuthorIsViewer) {
            const postListItem = postLink.closest('.postListItem');
            if (postListItem) { // could be null. (in Notification popup) 
            postListItem.style.cssText += 'background-color: lightblue';
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
                    const postLinks = findCannyPostLinks(node);
                    decorateBoardPageWithPostLinks(postLinks);
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


const main = () => {
    console.log('content_script_canny.js main');
    const pageType = detectPageType();
    console.log('pageType=' + pageType);

    if (pageType === PageType.CANNY_BOARD) {
        // Decorate items initially showed
        const postLinks = findCannyPostLinks(document.body);
        decorateBoardPageWithPostLinks(postLinks);
    }

    setupMutationObserver();

    // setupMutationObserverToInvestigate();
};
main();