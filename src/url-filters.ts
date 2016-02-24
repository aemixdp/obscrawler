type UrlFilter = (args: {
    url: Url,
    domain: string,
    cutAnchors: boolean,
    ignoredExtensions: string[],
    knownUrls: UrlSet
}) => Url;

namespace UrlFilters {
    export const knownUrlFilter: UrlFilter = ({url, knownUrls}) =>
        knownUrls.contains(url) ? null : url;
    export const extensionUrlFilter: UrlFilter = ({url, ignoredExtensions}) => {
        if (!url) return null;
        const extensions = ignoredExtensions
            .map(s => s.trim()).filter(s => s.length > 0)
            .map(s => '.' + s);
        for (const ext of extensions) {
            if (url.raw.lastIndexOf(ext) == url.raw.length - ext.length) {
                return null;
            }
        }
        return url;
    };
    export const anchorUrlFilter: UrlFilter = ({url}) => {
        if (!url) return null;
        let i = url.raw.length - 1;
        while (i > 0) {
            if (url.raw.charAt(i) == '#')
                break;
            i -= 1;
        }
        return i > 0 ? Url.parse(url.raw.substr(0, i)) : url;
    };
    export const domainUrlFilter: UrlFilter = ({url, domain}) => {
        if (!domain) return url;
        return url.domain == domain ? url : null;
    };
    export function chain(...filters: Array<UrlFilter>): UrlFilter {
        for (let i = 1; i < filters.length; ++i) {
            const filter = filters[i];
            filters[i] = (args) =>
                filter({
                    url: filters[i-1](args),
                    domain: args.domain,
                    cutAnchors: args.cutAnchors,
                    ignoredExtensions: args.ignoredExtensions,
                    knownUrls: args.knownUrls
                });
        }
        return filters[filters.length - 1];
    }
}
