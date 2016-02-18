function getUrls() {
    const results = [];
    const elems = document.querySelectorAll('a');
    for (const key in elems) {
        results.push((elems[key] as HTMLAnchorElement).href);
    }
    return results;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    chrome.runtime.sendMessage('got msg: ', msg);
    if (msg.action == 'getUrls') {
        if (document.readyState == 'complete') {
            chrome.runtime.sendMessage('rs: complete');
            sendResponse(getUrls());
        } else {
            chrome.runtime.sendMessage('rs: incomplete');
            document.addEventListener('DOMContentLoaded', () => {
                chrome.runtime.sendMessage('DOMContentLoaded...');
                sendResponse(getUrls());
            }, false);
            return true;
        }
    }
});
