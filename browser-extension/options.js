// options.js

const setupIframeSizeResponder = (iframeId) => {
    const popupIframe = document.getElementById(iframeId);
    window.addEventListener('message', (evt) => {
        const message = evt.data;
        // console.log('Got message=', message);

        switch (message.type) {
            case 'frameResized': {
                const style = getComputedStyle(popupIframe);
                const w = message.data.width;
                const h = message.data.height;
                popupIframe.style.width = w + 'px';
                popupIframe.style.height = h + 'px';
                break;
            }
        }
    });
};

setupIframeSizeResponder('popupIframe');
