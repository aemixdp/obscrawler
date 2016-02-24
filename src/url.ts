class Url {
    constructor(
        public raw: string,
        public domain: string,
        public path: string[]
    ) {}
    static parse(url: string): Url {
        const schemalessUrl = url.replace(/https?:\/\//, '');
        let sepIndex = schemalessUrl.indexOf('/');
        const domain = schemalessUrl.substring(0, sepIndex);
        const path = [];
        while (sepIndex != -1) {
            const newSepIndex = schemalessUrl.indexOf('/', sepIndex + 1);
            const part = schemalessUrl.substring(sepIndex + 1,
                newSepIndex == -1 ? undefined : newSepIndex);
            if (part.length > 0)
                path.push(part);
            sepIndex = newSepIndex;
        }
        return new Url(url, domain, path);
    }
}
