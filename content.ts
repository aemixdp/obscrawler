const CHECK_READY_STATE_TIMEOUT = 100;
const urlElemMap = new Object(null);

function getUrls() {
    const results = [];
    const elems = document.querySelectorAll('a');
    for (const key in elems) {
        const elem = elems[key] as HTMLAnchorElement;
        const href = elem.href;
        if (href) {
            urlElemMap[href] = elem;
            results.push(href);
        }
    }
    return results;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action == 'getUrls') {
        if (document.readyState == 'complete') {
            sendResponse(getUrls());
        } else {
            const handle = setInterval(() => {
                if (document.readyState == 'complete') {
                    clearInterval(handle);
                    sendResponse(getUrls());
                }
            }, CHECK_READY_STATE_TIMEOUT);
            return true;
        }
    } else if (msg.action == 'visitUrl') {
        const url = urlElemMap[msg.url];
        if (url) {
            url.click();
        } else {
            document.body.insertAdjacentHTML('beforeend',
                '<a id="obscrawler-dummy-link" href="' + msg.url + '">dummy link</a>');
            document.getElementById('obscrawler-dummy-link').click();
        }
        sendResponse({});
    }
});
