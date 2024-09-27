function tryEmbed(url) {
    return tryEmbedYouTube(url);
}

function tryEmbedYouTube(url) {
    const match = url.match(/http(?:|s):\/\/(?:youtu\.be\/|(?:|www\.|music\.)youtube\.com\/watch\?(?:|.*&)v=)([0-9a-zA-Z_-]*).*/);
    if (match === null)
        return null;
    const id = match[1];
    let start = 0;
    const simpleTimeMatch = url.match(/http(?:|s):\/\/(?:youtu\.be\/.*?|(?:|www\.|music\.)youtube\.com\/watch)\?(?:|.*&)t=([0-9]+)(?:$|&).*/);
    if (simpleTimeMatch !== null)
        start = simpleTimeMatch[1];
    else {
        const complexTimeMatch = url.match(/http(?:|s):\/\/(?:youtu\.be\/.*?|(?:|www\.|music\.)youtube\.com\/watch)\?(?:|.*&)t=(?:|([0-9]+)d)(?:|([0-9]+)h)(?:|([0-9]+)m)(?:|([0-9]+)s)(?:$|&).*/);
        if (complexTimeMatch !== null) {
            start = 0;
            if (complexTimeMatch[1] !== undefined)
                start += parseInt(complexTimeMatch[1]) * 60 * 60 * 24;
            if (complexTimeMatch[2] !== undefined)
                start += parseInt(complexTimeMatch[2]) * 60 * 60;
            if (complexTimeMatch[3] !== undefined)
                start += parseInt(complexTimeMatch[3]) * 60;
            if (complexTimeMatch[4] !== undefined)
                start += parseInt(complexTimeMatch[4]);
        }
    }
    const iframe = document.createElement('iframe');
    iframe.width = '300px';
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&fs=0&start=${start}`;
    iframe.style = 'border: none;';
    return iframe;
}
