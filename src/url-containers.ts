class UrlMap<V> {
    private storage: Object;
    constructor() {
        this.storage = new Object(null);
    }
    get(url: Url): V {
        return this.storage[url && url.raw];
    }
    set(url: Url, value: V): void {
        this.storage[url.raw] = value;
    }
}

class UrlSet {
    private storage: UrlMap<boolean>;
    constructor() {
        this.storage = new UrlMap<boolean>();
    }
    add(url: Url): void {
        this.storage.set(url, true);
    }
    contains(url: Url): boolean {
        return this.storage.get(url);
    }
}
