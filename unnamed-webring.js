async function getWebringLinks(domain) {
    let domains = (await (await fetch('https://gist.githubusercontent.com/cgytrus/815ad706c1c3b32b77ee8f3e0e8b1b4f/raw/unnamed-webring.txt')).text()).split(/\r?\n/).filter(x => x.length > 0);
    for (let i = 0; i < domains.length; i++) {
        if (!domains[i].includes(domain))
            continue;
        let links = {
            prev: domains[(i - 1 + domains.length) % domains.length],
            next: domains[(i + 1) % domains.length]
        };
        links.prev = links.prev.startsWith("http") ? links.prev : `https://${links.prev}`;
        links.next = links.next.startsWith("http") ? links.next : `https://${links.next}`;
        return links;
    }
    return {};
}
