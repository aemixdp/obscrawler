const CHECK_READY_STATE_TIMEOUT = 100;

function getUrls() {
    const results = [];
    const elems = document.querySelectorAll('a');
    for (const key in elems) {
        const href = (elems[key] as HTMLAnchorElement).href;
        if (href) {
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
    }
});
