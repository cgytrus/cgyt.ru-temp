async function tryEmbed(url) {
    return tryEmbedYouTube(url) ||
        tryEmbedSoundCloud(url) ||
        tryEmbedBandcamp(url);
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
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=0&fs=0&start=${start}`;
    iframe.style = 'border: none;';
    return iframe;
}

function tryEmbedSoundCloud(url) {
    const match = url.match(/http(?:|s):\/\/(?:(?:|www\.)soundcloud\.com\/[a-z-]+\/[a-z-]+|api\.soundcloud\.com\/tracks\/[0-9]+)/);
    if (match === null)
        return null;
    const iframe = document.createElement('iframe');
    iframe.width = '300px';
    iframe.height = '300px';
    iframe.src = encodeURI(`https://w.soundcloud.com/player/?url=${url}&auto_play=false&color=%2304a71d&visual=true`);
    iframe.style = 'border: none;';
    return iframe;
}

async function tryEmbedBandcamp(url) {
    return null;
    //const match = url.match(/http(?:|s):\/\/(?:[a-z-]+\.bandcamp\.com\/track\/[a-z-]+)/);
    //if (match === null)
    //    return null;
    //try {
    //    const props = JSON.parse(DOMParser.parseFromString(await (await fetch(url)).text(), 'text/html').querySelector('meta[name="bc-page-properties"]').content);
    //    const type = props.item_type == 't' ? 'track' : props.item_type == 'a' ? 'album' : props.item_type;
    //    const id = props.item_id;
    //    const iframe = document.createElement('iframe');
    //    iframe.width = '300px';
    //    iframe.height = '420px';
    //    iframe.src = encodeURI(`https://bandcamp.com/EmbeddedPlayer/${type}=${id}/size=large/bgcol=333333/linkcol=2ebd35/tracklist=false/transparent=true/`);
    //    iframe.style = 'border: none;';
    //    return iframe;
    //}
    //catch (error) {
    //    console.error(error);
    //    return null;
    //}
}
