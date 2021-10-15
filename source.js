'use strict';

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

const urlBase = 'https://feedback.vrchat.com/';

const openCanny = (isNewWin) => {
    const board = boardSelect.value;
    const url = composeCannyUrl(board);
    const win = window.open(url, isNewWin ? '_blank' : 'cannyWindow');
}

const openCannyAllBoards = () => {
    let maybeBlocked = false;
    for (const opt of boardSelect.options) {
        const board = opt.value;
        const url = composeCannyUrl(board);
        const win = window.open(url, board);
        if (win === null) {
            maybeBlocked = true;
        }
    }
    if (maybeBlocked) {
        popupGuide.classList.remove('hidden');
        popupGuideClose.focus();
    }
}


const composeCannyUrl = (board) => {
    const params = new URLSearchParams();

    const search = searchText.value;
    if (search !== '') {
        params.append('search', search);
    }

    const status = statusSelect.value;
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

    const url = urlBase + board + '?' + params;
    return url;
};
