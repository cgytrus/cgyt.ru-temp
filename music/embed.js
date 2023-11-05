function tryEmbed(url) {
    return tryEmbedYouTube(url);
}

function tryEmbedYouTube(url) {
    const match = url.match(/http(?:|s):\/\/(?:youtu\.be\/|(?:|www\.)youtube\.com\/watch\?(?:|.*&)v=)([0-9a-zA-Z_-]*).*/);
    if (match === null)
        return null;
    const id = match[1];
    const iframe = document.createElement('iframe');
    iframe.width = '300px';
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&fs=0`;
    iframe.frameBorder = 'none';
    return iframe;
}
