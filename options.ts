namespace DB {
    let globalUniqueId = 0;
    export function initialize() {
        chrome.storage.sync.get('id', (result) => {
            if (result['id']) {
                globalUniqueId = result['id'];
            } else {
                chrome.storage.sync.set({id: 1});
                globalUniqueId = 1;
            }
        });
    };
    export function removeUrlKey(urlKey: string) {
        chrome.storage.sync.get('url-keys', (result) => {
            const keys: Array<string> = result['url-keys'] || [];
            keys.splice(keys.indexOf(urlKey), 1);
            chrome.storage.sync.set({'url-keys': keys});
        });
    };
    export function addUrlKey(urlKey: string) {
        chrome.storage.sync.get('url-keys', (result) => {
            const keys: Array<string> = result['url-keys'] || [];
            keys.push(urlKey);
            chrome.storage.sync.set({'url-keys': keys});
        });
    };
    export function generateUrlKey() {
        const newUrlKey = 'url-' + globalUniqueId;
        globalUniqueId += 1;
        chrome.storage.sync.set({id: globalUniqueId});
        return newUrlKey;
    };
    export function get(key, callback) {
        chrome.storage.sync.get(key, (result) => {
            callback(result[key]);
        });
    };
    export function set(key, value) {
        let writes = {};
        writes[key] = value;
        chrome.storage.sync.set(writes);
    };
};

namespace UI {
    let rowTemplate: string;
    export let urlsElem: HTMLElement;
    export function initialize() {
        rowTemplate = document.getElementById('row-template').innerHTML;
        urlsElem = document.getElementById('initial-urls');
    }
    export function addUrlRow(urlKey) {
        urlsElem.insertAdjacentHTML('beforeend', rowTemplate);
        const newRowElem = urlsElem.querySelector('.row:last-child');
        const inputElem = newRowElem.querySelector('input') as HTMLInputElement;
        const checkboxElem = newRowElem.querySelector('input[type="checkbox"]') as HTMLInputElement
        inputElem.dataset['key'] = urlKey;
        checkboxElem.dataset['key'] = urlKey + '-restrict-to-domain';
        return {
            urlInputElem: inputElem,
            restrictToDomainCheckboxElem: checkboxElem
        };
    }
    export function findRedundantRows() {
        const rowElems = UI.urlsElem.querySelectorAll('.row');
        const redundantRowElems: Array<Node> = [];
        for (var i = rowElems.length - 1; i > 0; --i) {
            const rowElem = rowElems.item(i) as HTMLElement;
            const rowInputElem = rowElem.querySelector('input') as HTMLInputElement;
            if (rowInputElem.value.length == 0) {
                redundantRowElems.push(rowElem);
            } else {
                break;
            }
        }
        return redundantRowElems;
    }
    export namespace Utils {
        export function findParentWithClass(className: string, element: HTMLElement) {
            let cursor = element;
            while (cursor && cursor.className.indexOf(className) == -1) {
                cursor = cursor.parentElement;
            }
            return cursor;
        }
    }
};

DB.initialize();
UI.initialize();

// initialize options with saved data
(function() {
    const elems = document.getElementById('options').querySelectorAll('input');
    for (let i = 0; i < elems.length; ++i) {
        const elem = elems.item(i) as HTMLInputElement;
        if (elem.type == 'text') {
            DB.get(elem.dataset['key'],
                (value) => elem.value = value || '');
        } else if (elem.type == 'checkbox') {
            DB.get(elem.dataset['key'],
                (checked) => elem.checked = checked || false);
        }
    }
})();

// initialize urls table with saved data
chrome.storage.sync.get('url-keys', (result) => {
    let keys = result['url-keys'];
    if (!keys) {
        const newUrlKey = DB.generateUrlKey();
        DB.addUrlKey(newUrlKey);
        keys = [newUrlKey];
    }
    let lastInputElem: HTMLInputElement;
    for (const urlKey of keys) {
        const newUrlRow = UI.addUrlRow(urlKey);
        chrome.storage.sync.get(urlKey, (result) => {
            newUrlRow.urlInputElem.value = result[urlKey] || '';
        });
        const restrictToDomainKey = urlKey + '-restrict-to-domain';
        chrome.storage.sync.get(restrictToDomainKey, (result) => {
            newUrlRow.restrictToDomainCheckboxElem.checked = result[restrictToDomainKey] || false;
        });
        lastInputElem = newUrlRow.urlInputElem;
    }
    lastInputElem.className += ' leading-entry';
});

// url input edit
UI.urlsElem.addEventListener('keyup', (e) => {
    const target = e.target;
    if (target instanceof HTMLInputElement) {
        if (target.value.length > 0) {
            if (target.className.indexOf('leading-entry') == -1) return;
            target.className = 'url';
            const newUrlKey = DB.generateUrlKey();
            DB.addUrlKey(newUrlKey);
            const newUrlRow = UI.addUrlRow(newUrlKey);
            newUrlRow.urlInputElem.className += ' leading-entry';
        } else {
            const redundantRowElems = UI.findRedundantRows();
            for (var i = 0; i < redundantRowElems.length - 1; ++i) {
                const redundantRowElem = redundantRowElems[i] as HTMLElement;
                const urlInputElem = redundantRowElem.querySelector('.url') as HTMLElement;
                DB.removeUrlKey(urlInputElem.dataset['key']);
                UI.urlsElem.removeChild(redundantRowElem);
            }
            UI.urlsElem.querySelector('.row:last-child input').className += ' leading-entry';
        }
    }
});

// url deletion button click
UI.urlsElem.addEventListener('click', (e) => {
    const target = e.target;
    if (target instanceof HTMLSpanElement && target.className == 'delete') {
        const rowElem = UI.Utils.findParentWithClass('row', target);
        const urlKey = (rowElem.querySelector('.url') as HTMLElement).dataset['key'];
        DB.removeUrlKey(urlKey);
        UI.urlsElem.removeChild(rowElem);
    }
});

// persist data to DB on edits
function persistEdits(e) {
    const target = e.target;
    const key = target.dataset['key'];
    if (target instanceof HTMLInputElement && key) {
        if (target.type == 'text') {
            DB.set(key, target.value);
        } else if (target.type == 'checkbox') {
            DB.set(key, target.checked);
        }
    }
}

document.body.addEventListener('keyup', persistEdits);
document.body.addEventListener('click', persistEdits);
