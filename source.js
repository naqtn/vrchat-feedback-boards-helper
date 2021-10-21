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

////////////////////////////////////////
// Query form elements
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
    listClass: 'recentlyOpenedList',
    item: 'recentlyOpenedItemTemplate',
};

const recentlyOpenedList = new List('recentlyOpenedContainer', recentlyOpenedOptions);
recentlyOpenedList.clear(); // remove template row

const addToRecentlyOpened = (queryObject, url) => {
    // Add pathname because board name is in it.
    // In the future, if the search params can contain board names for multiple board search on Canny side,
    // consider remove this part.
    const queryString = url.pathname + url.search;
    const index = recentlyOpenedList.items.length;
    const hobj = { queryString, queryObject, index };
    console.log({ hobj });
    recentlyOpenedList.add(hobj);
};

// attach event listeners for newly created elements
recentlyOpenedList.on('updated', (list) => {
    for (const elmt of list.list.querySelectorAll('input[name=loadToTheForm]:not([data-attached])')) {
        elmt.addEventListener('click', loadToTheForm);
        elmt.setAttribute('data-attached', true);
    }
});

const loadToTheForm = (event) => {
    const tr = event.target.closest('tr');
    const index = tr.getAttribute('data-index');
    const item = recentlyOpenedList.get('index', index)[0];
    const hobj = item.values();

    loadQueryObjectToForm(hobj.queryObject);
    return false;
};

document.getElementById('clearRecentlyOpenedButton').addEventListener('click', () => {
    recentlyOpenedList.clear();
    // TODO write to storage
});


////////////////////////////////////////
// Query form functions
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
    // TODO update recently opened
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

const composeQueryObjectFromForm = (boardOptElment) => {
    const qobj = {};

    const optgroup = boardOptElment.parentElement;
    qobj.baseURL = optgroup.getAttribute('data-baseURL');
    qobj.boardURLName = boardOptElment.value;

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

    // enable experiment UI
    const params = (new URL(document.location)).searchParams;
    if (params.get('experiment') !== null) {
        document.getElementById('experimentalFeaturesDiv').classList.remove('hidden');
    }
}
initialize();
