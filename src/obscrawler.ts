const WARMUP_TIMEOUT = 5000;
const CHANGE_URL_TIMEOUT = 1000;
const DUMMY_PAGE = 'https://www.google.com.ua/';

class Obscrawler {
    private options: {
        cutAnchors: boolean,
        minTimeout: number,
        maxTimeout: number,
        ignoredExtensions: string[]
    };
    private workerHandle: number;
    private tabIds: number[];
    private tabAvailableUrls: ChaoticBag<Url>[];
    private tabUrlKeys: string[];
    private initialUrls: Url[];
    private knownUrls: UrlSet;
    private urlFilter: UrlFilter;
    constructor(options: { urlFilter: UrlFilter }) {
        this.urlFilter = options.urlFilter;
    }
    public start() {
        this.tabIds = [];
        this.tabAvailableUrls = [];
        this.tabUrlKeys = [];
        this.knownUrls = new UrlSet();
        chrome.storage.sync.get(DEFAULTS, (options: typeof DEFAULTS) =>
        chrome.storage.sync.get('url-keys', (urlKeysResult) => {
            if (Object.keys(urlKeysResult).length == 0) return;
            chrome.storage.sync.get(urlKeysResult['url-keys'], (urlsResult) => {
                this.options = {
                    cutAnchors: options['cut-anchors'],
                    minTimeout: options['min-timeout-seconds'] * 1000,
                    maxTimeout: options['max-timeout-seconds'] * 1000,
                    ignoredExtensions: options['ignored-extensions'].split(' ')
                };
                const urlKeys = urlKeysResult['url-keys'];
                this.initialUrls = urlKeys
                    .map(key => urlsResult[key])
                    .filter(url => url)
                    .map(Url.parse);
                for (const i in this.initialUrls) {
                    chrome.tabs.create({ url: DUMMY_PAGE }, (tab) => {
                        const bag = new ChaoticBag<Url>();
                        const url = this.initialUrls[i];
                        bag.put(url);
                        this.knownUrls.add(url);
                        this.tabIds.push(tab.id);
                        this.tabAvailableUrls.push(bag);
                        this.tabUrlKeys.push(urlKeys[i]);
                    });
                }
                this.workerHandle = setTimeout(() => this.crawl(), WARMUP_TIMEOUT);
            });
        }));
    }
    public stop() {
        clearTimeout(this.workerHandle);
        this.workerHandle = null;
        for (const tabId of this.tabIds) {
            chrome.tabs.remove(tabId);
        }
    }
    public toggle() {
        if (this.workerHandle) {
            this.stop();
        } else {
            this.start();
        }
    }
    private crawl(): void {
        if (this.tabIds.length == 0) return;
        const tabIndex = Math.floor(this.tabIds.length * Math.random());
        const tabId = this.tabIds[tabIndex];
        const availableUrls = this.tabAvailableUrls[tabIndex];
        const newUrl = availableUrls.get();
        console.log(newUrl);
        chrome.tabs.sendMessage(tabId, { action: 'visitUrl', url: newUrl.raw }, () => {
            const withTabUrlChanged = chrome.runtime.lastError
                ? (callback) => chrome.tabs.update(tabId, { url: newUrl.raw }, callback)
                : (callback) => callback();
            withTabUrlChanged(() => {
                setTimeout(() => {
                    chrome.tabs.sendMessage(tabId, { action: 'getUrls' }, (response) => {
                        if (chrome.runtime.lastError)
                            return console.error(chrome.runtime.lastError.message);
                        const restrictToDomainKey = this.tabUrlKeys[tabIndex] + '-restrict-to-domain'
                        chrome.storage.sync.get(restrictToDomainKey, (restrictToDomainResult) => {
                            const restrictToDomain = restrictToDomainResult[restrictToDomainKey];
                            for (const rawUrl of response) {
                                const filteredUrl = this.urlFilter({
                                    url: Url.parse(rawUrl),
                                    domain: restrictToDomain ? this.initialUrls[tabIndex].domain : null,
                                    cutAnchors: this.options.cutAnchors,
                                    ignoredExtensions: this.options.ignoredExtensions,
                                    knownUrls: this.knownUrls
                                });
                                if (filteredUrl) {
                                    availableUrls.put(filteredUrl);
                                    this.knownUrls.add(filteredUrl);
                                }
                            }
                        });
                    });
                }, CHANGE_URL_TIMEOUT);
            });
        });
        const timeoutDiff = this.options.maxTimeout - this.options.minTimeout;
        const timeout = this.options.minTimeout + timeoutDiff * Math.random();
        this.workerHandle = setTimeout(() => this.crawl(), timeout);
    }
}
