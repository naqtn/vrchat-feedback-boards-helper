// popup.js

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
                for (const valElement of value) {
                    const newOne = insertUsingTemplate(multipleRoot);
                    const o = {};
                    o[key] = valElement;
                    fillTheForm(o, newOne);
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

let activeTabId;
/**
 * fillTheFormWithActiveTabCurrentSettings
 * set activeTabId as side the effect.
 */
const fillTheFormWithActiveTabCurrentSettings = () => {
    activeTabId = null;
    chrome.tabs.query({ active: true, currentWindow: true }, tabsQueryCallback);
}
const tabsQueryCallback = (tabs) => {
    const [tab] = tabs; 
    chrome.tabs.sendMessage(tab.id, { type: 'getCurrentSettings' },
        // we need callback chain because it seems not to support Promise (Chrome v95) for tabs.sendMessage 
        (response) => {
            if (!response) {
                // If this tab is not accessible from this extension, 
                // sendMessage will fail. and response becomes undefined value.
                return;
            }

            activeTabId = tab.id;
            fillTheForm(response, document);
            document.getElementById('notWorkNowMessage').classList.add('displayNone');
            document.getElementById('settingsInputs').classList.remove('displayNone');
        });
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

    const newOne = itemTemplate.cloneNode(true);
    multipleRoot.appendChild(newOne);

    return newOne;
};

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

    if (activeTabId) {
        // console.log('on change', settings);
        chrome.tabs.sendMessage(activeTabId, { type: 'applySettings', data: settings });
    }
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


fillTheFormWithActiveTabCurrentSettings();
