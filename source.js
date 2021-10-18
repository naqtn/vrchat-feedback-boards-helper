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


const composeCannyUrl = (boardOptElment) => {
    const board = boardOptElment.value;

    const params = new URLSearchParams();

    const search = searchText.value;
    if (search !== '') {
        params.append('search', search);
    }

    const statusChecks = statusSelect.getElementsByTagName('input');
    let status = '';
    for (const check of statusChecks) {
        if (check.checked) {
            // '_' separated multiple value
            status += ((status === '') ? '' : '_') + check.value;
        }
    }
    if (status !== '') {
        params.append('status', status);
    }

    const sort = sortSelect.value;
    if (sort !== '') {
        params.append('sort', sort);
    }

    const my = myCheckbox.checked;
    if (my) {
        params.append('filter', 'my');
    }

    const optgroup = boardOptElment.parentElement;
    const baseURL = optgroup.getAttribute('data-baseURL');
    const url = baseURL + board + '?' + params;
    return url;
};

const initialize = () => {
    setupBoardSelect(boardSelect, cannySiteData);
}
initialize();
