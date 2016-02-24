const obscrawler = new Obscrawler({
    urlFilter: UrlFilters.chain(
        UrlFilters.domainUrlFilter,
        UrlFilters.anchorUrlFilter,
        UrlFilters.extensionUrlFilter,
        UrlFilters.knownUrlFilter
    )
});

chrome.browserAction.onClicked.addListener(() => obscrawler.toggle());
