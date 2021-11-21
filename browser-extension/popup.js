// popup.js

////////////////////////////////////////////////////////////////////////////////
// Simple object-form mapper

/*
NOTE: Simple object-form mapper spec.

- If the property value is not an Array, we handle as followings:
  - The property value is handled under an input element.
  - This input element name attribute should equal with the property key;
  - If the property value is a boolean, it assumes input type is 'checkbox'.
- If the property value is an Array, we handle as followings:
  - The property value is handled under an element. We call it rootElement.
  - The rootElement should have 'data-multiple-name=${key}' attribute.
  - The rootElement 'multiple-template' attribute points a template element by its id.
  - The template is cloned and inserted into rootElement, 
    when it needs new HTML element for Array element.
  - Elements under the rootElement can have 'data-multiple-root' attribute.
    - 'data-multiple-root' attribute points the rootElement by its tag name.
  - Elements under the rootElement can have 'data-multiple-operation' attribute.
    - The attribute 'remove' means clicking the element remove that branch where the element is.
- If each input element fires "update" event, it can build partial object.
  - If the input element represents on of Array element, it must have 'data-multiple-root' attribute.

*/

const fillTheForm = (settings, formIshElement) => {
    console.log('fillTheForm settings=', settings);
    for (const key of Object.keys(settings)) {
        const value = settings[key];
        if (Array.isArray(value)) {
            const multipleRoot = formIshElement.querySelector(`[data-multiple-name=${key}]`);
            if (multipleRoot) {
                removeAllChild(multipleRoot);
                for (const valElement of value) {
                    const newOne = insertUsingTemplate(multipleRoot);
                    const o = {};
                    o[key] = valElement;
                    fillTheForm(o, newOne); // fill recursively
                }
            }

        } else {
            const input = formIshElement.querySelector(`[name=${key}]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = value;
                } else {
                    input.value = value;
                }
            }
        }
    }
};

const findChildToDescendant = (element, descendant) => {
    let el = descendant;
    while (el) {
        const parent = el.parentNode;
        if (parent === element) {
            return el;
        }
        el = parent;
    }
    return null;
};

const insertUsingTemplate = (multipleRoot) => {
    const templateId = multipleRoot.dataset.multipleTemplate;
    const itemTemplate = document.getElementById(templateId);

    const newOne = itemTemplate.content.cloneNode(true);
    multipleRoot.appendChild(newOne);

    return newOne;
};

const removeAllChild = (multipleRoot) => {
    // simply remove all child. it doesn't care cloned one.
    while (multipleRoot.firstChild) {
        multipleRoot.removeChild(multipleRoot.firstChild);
    }
};


// callback from object-form mapper
let applySettingsCallback = null;

const settingsInputs = document.getElementById('settingsInputs');
settingsInputs.addEventListener('change', (event) => {
    const target = event.target;
    const settings = {};

    const multipleRoot = target.dataset.multipleRoot;
    if (multipleRoot) {
        const rootElement = target.closest(multipleRoot);
        const name = rootElement.dataset.multipleName;
        const elements = rootElement.querySelectorAll(`[name=${name}]`);

        const values = [];
        for (const e of elements) {
            values.push(e.value);
        }
        settings[name] = values;
    } else {
        settings[target.name] = (target.type === 'checkbox') ? target.checked : target.value;
    }
    applySettingsCallback(settings);
});
settingsInputs.addEventListener('click', (event) => {
    const target = event.target;
    switch (target.dataset.multipleOperation) {
        case 'remove':
            const multipleRoot = target.dataset.multipleRoot;
            const rootElement = target.closest(multipleRoot);
            const child = findChildToDescendant(rootElement, target);
            rootElement.removeChild(child);
            rootElement.dispatchEvent(new Event('change', { bubbles: true }));
            break;
    }
});

document.getElementById('addNameEntryButton').addEventListener('click', () => {
    const authorNameList = document.getElementById('authorNameList');
    insertUsingTemplate(authorNameList);
});

const activateSettingInputs = (settings) => {
    fillTheForm(settings, document);
    document.getElementById('notWorkNowMessage').classList.add('displayNone');
    document.getElementById('settingsInputs').classList.remove('displayNone');
};


////////////////////////////////////////////////////////////////////////////////
// Connect with active tab (show as popup page)

let activeTabId;
/**
 * Fill the form with current settings of active tab.
 * Also set activeTabId as side the effect.
 */
const getCurrentSettingsFromActiveTab = (callback) => {
    activeTabId = null;

    // On Chrome extension V2, we need callback instead of Promise 
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const [tab] = tabs;

        // we need callback chain because it seems not to support Promise (Chrome v95) for tabs.sendMessage 
        chrome.tabs.sendMessage(tab.id, { type: 'getCurrentSettings' }, (response) => {
            if (!response) {
                // If this tab is not accessible from this extension, 
                // sendMessage will fail. and response becomes undefined value.
                return;
            }
            activeTabId = tab.id;
            callback(response);
        });
    });
};
const applySettingsToActiveTab = (settings) => {
    if (activeTabId) {
        // console.log('on change', settings);
        chrome.tabs.sendMessage(activeTabId, { type: 'applySettings', data: settings });
    } else {
        console.log('activeTabId is invalid');
    }
};

const startAsPopupPage = () => {
    applySettingsCallback = applySettingsToActiveTab;
    getCurrentSettingsFromActiveTab(activateSettingInputs);
};

document.getElementById('storeAsDefaultsButton').addEventListener('click', () => {
    chrome.tabs.sendMessage(activeTabId, { type: 'getCurrentSettings' }, (response) => {
        if (!response) {
            console.error('storeAsDefaultsButton getCurrentSettings failed');
            return;
        }
        chrome.runtime.sendMessage({ type: 'setSettingsToStorage', data: response });
    });
    return false;
});

document.getElementById('reloadFromDefaultsButton').addEventListener('click', () => {
    chrome.runtime.sendMessage({ 'type': 'getSettingsFromStorage' }, (response) => {
        if (!response) {
            console.error('reloadFromDefaultsButton getSettingsFromStorage failed. ', runtime.lastError);
            return;
        }
        applySettingsToActiveTab(response); // to content script
        fillTheForm(response, document); // to UI
    });
    return false;
});

document.getElementById('openOptionsPageButton').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    return false;
});


////////////////////////////////////////////////////////////////////////////////
// Connect with storage (show as option page)

const applySettingsToStorage = (settings) => {
    chrome.runtime.sendMessage({ type: 'setSettingsToStorage', data: settings });
};

const getCurrentSettingsFromStorage = (callback) => {
    // send request to background
    chrome.runtime.sendMessage({ type: 'getSettingsFromStorage' },
        (response) => {
            if (!response) {
                console.log('getCurrentSettingsFromStorage failed. ', runtime.lastError);
                // REFINE call back with error message to show error explicitly.
                return;
            }
            callback(response);
        });
};

const startAsOptionsPage = () => {

    // adjust page contents
    document.getElementById('pageTitle').innerText = 'Stored default settings';
    // we want to reuse settingsInputsBody only for options page
    // so hide other brothers
    const theForm = document.getElementById('settingsInputsBody');
    for (const el of theForm.parentNode.childNodes) {
        if (el !== theForm) {
            console.log(el);
            if (el.classList) {
                el.classList.add('displayNone');
            }
        }
    }

    applySettingsCallback = applySettingsToStorage;
    getCurrentSettingsFromStorage(activateSettingInputs);
    setupIframeSizeRequester();
};

// based on https://stackoverflow.com/a/69225735/3180048
const setupIframeSizeRequester = () => {
    const theElement = document.body.parentElement;
    const config = { attributes: false, childList: true, subtree: true };

    let lastHeight = null;
    let lastWidth = null;
    const callback = (mutationsList, observer) => {
        const style = getComputedStyle(theElement);
        const h = parseFloat(style.height) + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        // FIXME It doesn't adjust width. document.body.parentElement.offsetWidth is small than document.body.offsetWidth
        const w = parseFloat(document.body.offsetWidth) + parseFloat(style.marginLeft) + parseFloat(style.marginRight);

        if ((lastHeight !== h) || (lastWidth !== w)) {
            window.parent.postMessage({ 'type': 'frameResized', 'data': { width: w, height: h } });
            lastHeight = h;
            lastWidth = w;
        }
    };

    const mutationObserver = new MutationObserver(callback);
    mutationObserver.observe(theElement, config);
    callback(); // request initial size
};


////////////////////////////////////////////////////////////////////////////////
if (window.name === 'POPUP_IN_OPTIONS') {
    // I'm inside iframe of option page
    startAsOptionsPage();
} else {
    startAsPopupPage();
}

