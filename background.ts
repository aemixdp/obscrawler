const WARMUP_TIMEOUT = 5000;
const DUMMY_PAGE = "https://www.google.com.ua/";

class ChaoticBag<T> {
    constructor(private storage: Array<T> = []) {}
    put(item: T): void {
        if (this.storage.length == 0) {
            this.storage.push(item);
        } else {
            const swapIndex = Math.floor(this.storage.length * Math.random());
            const otherItem = this.storage[swapIndex];
            this.storage[swapIndex] = item;
            this.storage.push(otherItem);
        }
    }
    get(): T {
        return this.storage.length > 1
            ? this.storage.pop()
            : this.storage[0];
    }
}

class UrlMap<V> {
    private storage: Object;
    constructor() {
        this.storage = new Object(null);
    }
    get(url: string): V {
        return this.storage[url];
    }
    set(url: string, value: V): void {
        this.storage[url] = value;
    }
}

class Obscrawler {
    private workerHandle: number;
    private minTimeout: number;
    private maxTimeout: number;
    private tabIds: Array<number>;
    private tabDiscoveredUrls: Array<ChaoticBag<string>>;
    private initialUrls: Array<string>;
    private visitedUrls: UrlMap<boolean>;
    constructor (options: {
        minTimeout: number,
        maxTimeout: number,
        initialUrls: Array<string>
    }) {
        this.minTimeout = options.minTimeout;
        this.maxTimeout = options.maxTimeout;
        this.tabIds = [];
        this.tabDiscoveredUrls = [];
        this.initialUrls = options.initialUrls;
        this.visitedUrls = new UrlMap<boolean>();
    }
    public start() {
        for (const url of this.initialUrls) {
            chrome.tabs.create({ url: DUMMY_PAGE }, (tab) => {
                const bag = new ChaoticBag<string>();
                bag.put(url);
                this.visitedUrls.set(url, true);
                this.tabIds.push(tab.id);
                this.tabDiscoveredUrls.push(bag);
            });
        }
        this.workerHandle = setTimeout(() => this.crawl(), WARMUP_TIMEOUT);
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
        const discoveredUrls = this.tabDiscoveredUrls[tabIndex];
        const newUrl = discoveredUrls.get();
        chrome.tabs.update(tabId, { url: newUrl }, () => {
            chrome.tabs.sendMessage(tabId, { action: 'getUrls' }, (response) => {
                for (const url of response) {
                    if (!this.visitedUrls.get(url)) {
                        discoveredUrls.put(url);
                        this.visitedUrls.set(url, true);
                    }
                }
            });
        });
        const timeoutDiff = this.maxTimeout - this.minTimeout;
        const timeout = this.minTimeout + timeoutDiff * Math.random();
        this.workerHandle = setTimeout(() => this.crawl(), timeout);
    }
}

const obscrawler = new Obscrawler({
    minTimeout: 10000,
    maxTimeout: 25000,
    initialUrls: ["http://dou.ua/", "https://2ch.hk/"]
});

chrome.browserAction.onClicked.addListener(() => {
    obscrawler.toggle();
});
