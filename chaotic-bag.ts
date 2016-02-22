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
