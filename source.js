'use strict';

////////////////////////////////////////
// Setup

const cannySiteData = [
    {
        name: 'VRChat feedback boards',
        baseURL: 'https://feedback.vrchat.com/',
        boards: [
            { urlName: "feature-requests", name: "Feature Requests", },
            { urlName: "bug-reports", name: "Client Bug Reports", },
            { urlName: "sdk-bug-reports", name: "SDK Bug Reports", },
            { urlName: "website-bug-reports", name: "Website Bug Reports", },
            { urlName: "open-beta", name: "Open Beta", },
            { urlName: "avatar-30", name: "Avatars 3.0", },
            { urlName: "quest-creators", name: "Quest Creators", },
            { urlName: "vrchat-plus-feedback", name: "VRChat Plus Feedback", },
            { urlName: "vrchat-udon-closed-alpha-bugs", name: "Udon Alpha Bugs", },
            { urlName: "vrchat-udon-closed-alpha-feedback", name: "Udon Alpha Feedback", },
            { urlName: "udon-graph-upgrade-closed-testing", name: "Udon Closed Alpha Testing", },
            { urlName: "udon-networking-update", name: "Udon Networking Update", },
        ],
    },
    {
        name: 'Canny feedback',
        baseURL: 'https://feedback.canny.io/',
        invisible: true,
        boards: [
            { urlName: "feature-requests", name: "Feature Requests", },
            { urlName: "integrations", name: "Integrations", invisible: true, },
            { urlName: "languages", name: "Languages", },
        ],
    }
];

const params = (new URL(document.location)).searchParams;

const config = {
    maximumRecentlyOpenedItems: 5,
    experiment: (params.get('experiment') !== null),
};

const validateConfig = (config) => {
    if (config.maximumRecentlyOpenedItems <= 0) {
        throw new RangeError("config.maximumRecentlyOpenedItems must be positive value");
    }
};
validateConfig(config);

////////////////////////////////////////
// HTML Elements

// Query form
const boardSelect = document.getElementById('boardSelect');
const searchText = document.getElementById('searchText');
const statusSelect = document.getElementById('statusSelect');
const sortSelect = document.getElementById('sortSelect');
const myCheckbox = document.getElementById('myCheckbox');

const popupGuide = document.getElementById('popupGuide');

document.getElementById('openFixButton').addEventListener('click', () => openCanny(false));
document.getElementById('openNewButton').addEventListener('click', () => openCanny(true));
document.getElementById('openBoardsButton').addEventListener('click', () => openCannyAllBoards());
document.getElementById('popupGuideClose').addEventListener('click', () => { popupGuide.classList.add('hidden'); });

// Stocked Query
document.getElementById('clearStockedQueryButton').addEventListener('click', (e) => clearStockedQuery(e));
const undoDeleteStockedQueryButton = document.getElementById('undoDeleteStockedQueryButton');
undoDeleteStockedQueryButton.addEventListener('click', (e) => undoDeleteStockedQuery(e));


////////////////////////////////////////
// List.js supplement
// 
// Require
// * {valueNames: [ { data: ['index'] } ]} in options for List instance
// * index value is unique.
// * using List.js with table tag
//
// TODO Rename 'index' to another word. 'tmp-id'? (now I use remove method. so it's not a index anymore.)

const addEventListenerIfNotYet = (listElement, selectorFragment, type, listener) => {
    for (const elmt of listElement.querySelectorAll(`${selectorFragment}:not([data-${type}-attached])`)) {
        elmt.addEventListener(type, listener);
        elmt.setAttribute(`data-${type}-attached`, true);
    }
};

const getListItemFromEvent = (event, list) => {
    const tr = event.target.closest('tr');
    const index = tr.getAttribute('data-index');
    const item = list.get('index', index)[0];
    return item;
};

const getListItemValuesFromEvent = (event, list) => {
    return getListItemFromEvent(event, list).values();
};

/**
 * removeItemsFromTail
 * @param list List.js instance
 * @param count how many items to remove. zero or negative is allowed and it does nothing.
 */
const removeItemsFromTail = (list, count) => {
    while (0 < count--) {
        const itm = list.items[list.items.length - 1];
        const idx = itm.values()['index'];
        list.remove('index', idx);
    }
};

const sortByIndex = (ai, bi) => {
    const av = ai.values()['index'];
    const bv = bi.values()['index'];
    return (av === bv) ? 0 : (av < bv) ? -1 : +1;
}

////////////////////////////////////////
// Recently Opened List

// hboj: History Object
//
// const aHistoryObjectExample = {
//     index: 2, // temporary 'id'
//     queryString: '/open-beta?status=planned',  // to identify query for human, not for the program
//     queryObject: {/* see Query Object */},
//     memo: "Check open beta",
//     /* lastOpened: ...etc. */
// }

var recentlyOpenedOptions = {
    valueNames: [
        { data: ['index'] },
        'queryString',
    ],
    item: 'recentlyOpenedItemTemplate',
    listClass: 'recentlyOpenedList'
};

const recentlyOpenedList = new List('recentlyOpenedContainer', recentlyOpenedOptions);
let recentlyOpenedListLastIndex = 0;

const addToRecentlyOpened = (queryObject, url) => {
    // Add pathname because board name is in it.
    // In the future, if the search params can contain board names for multiple board search on Canny side,
    // consider remove this part.
    const queryString = url.pathname + url.search;
    const hobj = { queryString, queryObject };
    hobj['index'] = ++recentlyOpenedListLastIndex;

    if (recentlyOpenedListLastIndex === 1) {
        recentlyOpenedList.clear(); // remove 'no entries' row
    }

    // limit items count to configured maximum
    removeItemsFromTail(recentlyOpenedList,
        recentlyOpenedList.items.length - config.maximumRecentlyOpenedItems - 1); // -1 is a room for new.
    recentlyOpenedList.add(hobj);
    recentlyOpenedList.sort('', { sortFunction: sortByIndex, order: 'desc' });

    // TODO write to session storage (and load at initialization)
};

recentlyOpenedList.on('updated', (list) => {
    // attach event listeners for newly created elements
    addEventListenerIfNotYet(list.list, 'input[name=loadButton]', 'click', loadToForm);
    addEventListenerIfNotYet(list.list, 'input[name=stockButton]', 'click', stockItem);
});

const loadToForm = (event) => {
    const hobj = getListItemValuesFromEvent(event, recentlyOpenedList);
    loadQueryObjectToForm(hobj.queryObject);
    return false;
};

const stockItem = (event) => {
    const hobj = getListItemValuesFromEvent(event, recentlyOpenedList);
    addToStockedQuery(hobj);
    return false;
};

////////////////////////////////////////
// Stocked Query

const storageKeyOf = (type) => {
    return `${document.location.pathname}/${type}`;
}
const saveStockedStorageType = 'StockedQuery.v1';

var stockedQueryOptions = {
    valueNames: [
        { data: ['index'] },
        'queryString',
        'label',
    ],
    item: 'stockedQueryItemTemplate',
};

const stockedQueryList = new List('stockedQueryContainer', stockedQueryOptions);
let stockedQueryListLastIndex = 0;

const deletedStockedQuery = [];

const addToStockedQueryInternal = (historyObject) => {
    historyObject['index'] = ++stockedQueryListLastIndex;

    if (stockedQueryListLastIndex === 1) {
        stockedQueryList.clear(); // remove 'no entries' row
    }

    stockedQueryList.add(historyObject);
    stockedQueryList.sort('', { sortFunction: sortByIndex, order: 'desc' });
};

const addToStockedQuery = (historyObject) => {
    // clone it because we need another index for this list.
    const hobj = JSON.parse(JSON.stringify(historyObject));
    hobj.label ??= '';

    addToStockedQueryInternal(hobj);
    saveStockedQuery();
};

const startCellEdit = (event) => {
    const dispElmt = event.currentTarget;
    const tdElmt = dispElmt.parentElement;
    const editElmt = tdElmt.querySelector('[name=editInput]');
    dispElmt.classList.add('hidden');
    editElmt.classList.remove('hidden');

    const hobj = getListItemValuesFromEvent(event, stockedQueryList);
    editElmt.value = hobj.label;
    editElmt.setAttribute('data-escaped', 'false');
    editElmt.focus();

    return false;
};

const completeCellEdit = (event) => {
    const editElmt = event.currentTarget;
    const tdElmt = editElmt.parentElement;
    const dispElmt = tdElmt.querySelector('[name=displayLook]');
    dispElmt.classList.remove('hidden');
    editElmt.classList.add('hidden');

    if (editElmt.getAttribute('data-escaped') === 'false') {
        const item = getListItemFromEvent(event, stockedQueryList);
        const hobj = item.values();
        hobj.label = editElmt.value;
        item.values(hobj);

        saveStockedQuery();
    }
    return false;
};

const handleKeyCellEditing = (event) => {
    const editElmt = event.currentTarget;
    switch (event.key) {
        case 'Enter':
            editElmt.blur();
            break;
        case 'Escape':
            editElmt.setAttribute('data-escaped', 'true');
            editElmt.blur();
            break;
    }
};

const handleKeyCellDisplay = (event) => {
    const editElmt = event.currentTarget;
    switch (event.key) {
        // fall through
        case 'Enter':
        case 'Space': // Firefox
        case ' ': // Chrome
            event.preventDefault();
            startCellEdit(event);
            return true;
    }
    return false;
    // TODO? support ArrowDown, ArrowUp
};


const handleSearchButton = (event) => {
    const hobj = getListItemValuesFromEvent(event, stockedQueryList);
    loadQueryObjectToForm(hobj.queryObject);

    // TODO do same condition (reuse-window, new-window, all-boards)
    openCanny(false);

    return false;
};

stockedQueryList.on('updated', (list) => {
    addEventListenerIfNotYet(list.list, 'input[name=searchButton]', 'click', handleSearchButton);
    addEventListenerIfNotYet(list.list, 'input[name=loadButton]', 'click',
        (event) => {
            const hobj = getListItemValuesFromEvent(event, stockedQueryList);
            loadQueryObjectToForm(hobj.queryObject);
            return false;
        }
    );
    addEventListenerIfNotYet(list.list, 'input[name=deleteButton]', 'click',
        (event) => {
            const hobj = getListItemValuesFromEvent(event, stockedQueryList);
            stockedQueryList.remove('index', hobj['index']);
            deletedStockedQuery.push(hobj);
            updateUndoDeleteStockedQueryButton();
            saveStockedQuery();
            return false;
        }
    );
    addEventListenerIfNotYet(list.list, '[name=displayLook]', 'click', startCellEdit);
    addEventListenerIfNotYet(list.list, '[name=displayLook]', 'keydown', handleKeyCellDisplay);
    addEventListenerIfNotYet(list.list, '[name=editInput]', 'blur', completeCellEdit);
    addEventListenerIfNotYet(list.list, '[name=editInput]', 'keydown', handleKeyCellEditing);
});

const clearStockedQuery = (event) => {
    const undo = [];
    for (const item of stockedQueryList.items) {
        undo.push(item.values());
    }
    undo.reverse(); // because the list is desc sorted.
    deletedStockedQuery.push(undo);
    updateUndoDeleteStockedQueryButton();

    stockedQueryList.clear();
    // TODO reshow "no entries" indicator.

    const type = saveStockedStorageType;
    const key = storageKeyOf(type);
    localStorage.removeItem(key);

    return false;
};

const updateUndoDeleteStockedQueryButton = () => {
    undoDeleteStockedQueryButton.disabled = (deletedStockedQuery.length === 0);
};

const undoDeleteStockedQuery = (event) => {
    const deleted = deletedStockedQuery.pop();
    if (deleted) {
        if (deleted instanceof Array) {
            for (const o of deleted) {
                addToStockedQuery(o);
            }
        } else {
            addToStockedQuery(deleted);
        }
        updateUndoDeleteStockedQueryButton();
    }
    return false;
};


const saveStockedQuery = () => {
    const items = stockedQueryList.items;

    const data = [];
    for (const item of items) {
        data.push(item.values());
    }
    data.reverse(); // The list is sorted in desc order. Reverse it to original order to save. 
    const type = saveStockedStorageType;
    const persistObj = { type, data };

    const key = storageKeyOf(type);
    const value = JSON.stringify(persistObj);
    localStorage[key] = value;
};

const loadStockedQuery = () => {
    const type = saveStockedStorageType;
    const key = storageKeyOf(type);
    const value = localStorage[key];

    if (value) {
        const persistObj = JSON.parse(value);
        if (persistObj.type === type) {
            for (const hobj of persistObj.data) {
                addToStockedQueryInternal(hobj);
            }
        }
    }
}

////////////////////////////////////////
// Query form
// 
// HTML Structure:
// <select>
//   <optgroup data-baseURL="{URL base}">
//     <option value="{board urlName}">{board name}</option>

const setupBoardSelect = (aSelect, data) => {
    for (const site of data) {
        if (site.invisible) {
            continue;
        }
        const group = document.createElement("optgroup");
        group.label = site.name;
        group.setAttribute('data-baseURL', site.baseURL);

        for (const def of site.boards) {
            if (def.invisible) {
                continue;
            }
            const opt = document.createElement("option");
            opt.value = def.urlName;
            opt.text = def.name;
            group.appendChild(opt);
        }

        aSelect.appendChild(group);
    }
};

const openCanny = (isNewWin) => {
    const opts = boardSelect.selectedOptions;
    if (opts.length !== 1) {
        return;
    }
    const qobj = composeQueryObjectFromForm(opts[0]);
    const url = convertQueryObjectToURL(qobj);
    const win = window.open(url, isNewWin ? '_blank' : 'cannyWindow');

    addToRecentlyOpened(qobj, url);
};

const openCannyAllBoards = () => {
    let maybeBlocked = false;
    for (const opt of boardSelect.options) {
        const qobj = composeQueryObjectFromForm(opt);
        const url = convertQueryObjectToURL(qobj);
        const board = opt.value;
        const win = window.open(url, board); // windows are always reused for all-boards-search
        if (win === null) {
            // maybe, because of pop-up blocking
            maybeBlocked = true;
        }
    }
    if (maybeBlocked) {
        popupGuide.classList.remove('hidden');
        popupGuide.focus();
    }
    // TODO update recently opened list
    // also add "allBoards: true" ? (reusable if we add "re-search" button)
}

////////////////////////////////////////
// Query Object
// 
// const aQueryObjectExample = {
//     search: 'FBT',
//     status: ['under-review', ],
//     sort: 'trending',
//     filter: ['my'],
//     baseURL: 'https://feedback.vrchat.com/',
//     boardURLName: "feature-requests",
// };

const composeQueryObjectFromForm = (boardOptElement) => {
    const qobj = {};

    const optgroup = boardOptElement.parentElement;
    qobj.baseURL = optgroup.getAttribute('data-baseURL');
    qobj.boardURLName = boardOptElement.value;

    const search = searchText.value;
    if (search !== '') {
        qobj.search = search;
    }

    const status = [];
    const statusChecks = statusSelect.getElementsByTagName('input');
    for (const check of statusChecks) {
        if (check.checked) {
            status.push(check.value);
        }
    }
    if (0 < status.length) {
        qobj.status = status;
    }

    const sort = sortSelect.value;
    if (sort !== '') {
        qobj.sort = sort;
    }

    const filter = [];
    if (myCheckbox.checked) {
        filter.push('my');
    }
    if (0 < filter.length) {
        qobj.filter = filter;
    }

    return qobj;
};

const loadQueryObjectToForm = (qobj) => {
    // Multiple option element can have the same boardURLName.
    // So we traverse from optgroup.
    const optgroupSel = `optgroup[data-baseURL="${qobj.baseURL}"]`;
    const optgroup = boardSelect.querySelector(optgroupSel);
    if (!optgroup) {
        console.error(optgroupSel + " not found.");
    } else {
        const optSel = `[value="${qobj.boardURLName}"]`;
        const opt = optgroup.querySelector(optSel);
        if (!opt) {
            console.error(optSel + " not found.");
        } else {
            opt.selected = true;
        }
    }

    searchText.value = qobj.search ? qobj.search : '';

    // statuses are multi-selectable
    const status = qobj.status ?? [];
    const statusChecks = statusSelect.getElementsByTagName('input');
    for (const check of statusChecks) {
        check.checked = (0 <= status.indexOf(check.value));
    }

    // sort is single
    const sort = qobj.sort ?? '';
    const opt = sortSelect.value = sort;

    const filter = qobj.filter ?? [];
    myCheckbox.checked = (0 <= filter.indexOf('my'));
};

const convertQueryObjectToURL = (qobj) => {
    const params = new URLSearchParams();

    if (qobj.search) {
        params.append('search', qobj.search);
    }

    if (qobj.status) {
        // '_' separated multiple value
        params.append('status', qobj.status.join('_'));
    }

    if (qobj.sort) {
        params.append('sort', qobj.sort);
    }

    if (qobj.filter) {
        // actually 'my' is the only possible value.
        // expecting multiple filter as future feature.
        params.append('filter', qobj.filter.join('_'));
    }

    const urlStr = qobj.boardURLName + '?' + params;
    return new URL(urlStr, qobj.baseURL);
};

////////////////////////////////////////
const initialize = () => {
    setupBoardSelect(boardSelect, cannySiteData);
    loadStockedQuery();

    if (config.experiment) {
        // enable experiment UI
        document.getElementById('experimentalFeaturesDiv').classList.remove('hidden');
    }
}
initialize();
