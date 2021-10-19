'use strict';

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

const boardSelect = document.getElementById('boardSelect');
const searchText = document.getElementById('searchText');
const statusSelect = document.getElementById('statusSelect');
const sortSelect = document.getElementById('sortSelect');
const myCheckbox = document.getElementById('myCheckbox');

const popupGuide = document.getElementById('popupGuide');
const popupGuideClose = document.getElementById('popupGuideClose');

document.getElementById('openFixButton').addEventListener('click', () => openCanny(false));
document.getElementById('openNewButton').addEventListener('click', () => openCanny(true));
document.getElementById('openBoardsButton').addEventListener('click', () => openCannyAllBoards());
popupGuideClose.addEventListener('click', () => { popupGuide.classList.add('hidden'); });


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
    const url = composeCannyUrl(opts[0]);
    const win = window.open(url, isNewWin ? '_blank' : 'cannyWindow');
}

const openCannyAllBoards = () => {
    let maybeBlocked = false;
    for (const opt of boardSelect.options) {
        const url = composeCannyUrl(opt);
        const board = opt.value;
        const win = window.open(url, board);
        if (win === null) {
            // maybe, because of pop-up blocking
            maybeBlocked = true;
        }
    }
    if (maybeBlocked) {
        popupGuide.classList.remove('hidden');
        popupGuide.focus();
    }
}

// QueryObject example
//
// const aQueryObject = {
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
}

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

    const url = qobj.baseURL + qobj.boardURLName + '?' + params;
    return url;
}

const composeCannyUrl = (boardOptElment) => {
    const qobj = composeQueryObjectFromForm(boardOptElment);
    const curl = convertQueryObjectToURL(qobj);
    return curl;
};

const initialize = () => {
    setupBoardSelect(boardSelect, cannySiteData);
}
initialize();
