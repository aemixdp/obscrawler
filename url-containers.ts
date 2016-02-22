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

class UrlSet {
    private storage: UrlMap<boolean>;
    constructor() {
        this.storage = new UrlMap<boolean>();
    }
    add(url: string): void {
        this.storage.set(url, true);
    }
    contains(url: string): boolean {
        return this.storage.get(url);
    }
}
