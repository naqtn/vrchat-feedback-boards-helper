
const debugTextarea = document.getElementById('debugTextarea');

const fillTheForm = (settings) => {
    for (const key of Object.keys(settings)) {
        const [input] = document.getElementsByName(key);
        if (input) {
            const value = settings[key];
            if (input.type === 'checkbox') {
                input.checked = value;
            } else {
                input.value = value;
            }
        }
    }
};

let activeTabId;
/**
 * fillTheFormWithActiveTabCurrentSettings
 * set activeTabId as side the effect.
 */
const fillTheFormWithActiveTabCurrentSettings = async () => {
    activeTabId = null;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { type: 'getCurrentSettings' },
        // we need callback chain because it seems not to support Promise (Chrome v95) for tabs.sendMessage 
        (response) => {
            if (!response) {
                // If this tab is not accessible from this extension, 
                // sendMessage will fail. and response becomes undefined value.
                debugTextarea.value += '\nlastError=' + JSON.stringify(chrome.runtime.lastError);
                debugTextarea.value += '\ntab=' + JSON.stringify(tab);
                return;
            }
            debugTextarea.value = 'response=' + JSON.stringify(response);
            activeTabId = tab.id;
            fillTheForm(response);
        });
};

document.getElementById('settingsInputs').addEventListener('change', (event) => {
    console.log('event', event);
    // apply immediately
    const target = event.target;
    const settings = {};
    settings[target.name] = (target.type === 'checkbox')? target.checked: target.value;

    if (activeTabId) {
        chrome.tabs.sendMessage(activeTabId, { type: 'applySettings', data: settings });
    }
});

document.getElementById('testButton').addEventListener('click', async () => {
    console.log('testButton clicked');
});
fillTheFormWithActiveTabCurrentSettings();
