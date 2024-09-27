document.addEventListener('DOMContentLoaded', async () => {
    const loggedIn = await api.auth(undefined) == '';

    if (loggedIn) {
        console.log('logged in !!!~ uwu');
        document.getElementById('login-switch').textContent = '🔓';
    }

    const playlistsElem = document.getElementById('playlists');
    const trackElem = document.getElementById('track');
    const trackEmbedsElem = document.getElementById('track-embeds');
    const trackTitleElem = document.getElementById('track-title');
    const trackAlbumElem = document.getElementById('track-album');
    const trackYearElem = document.getElementById('track-year');
    const trackNumberElem = document.getElementById('track-number');
    const trackLinksElem = document.getElementById('track-links');

    function addPlaylist(listId, listName, listTracks) {
        const listElemId = `playlist-${listId}`;
        let listElem = document.getElementById(listElemId);
        if (listElem === null) {
            listElem = document.createElement('details');
            listElem.id = listElemId;
            playlistsElem.append(listElem);
        }
        while (listElem.hasChildNodes())
            listElem.firstChild.remove();

        const summary = document.createElement('summary');
        summary.textContent = `${listName} (${listTracks.length})`;
        listElem.append(summary);

        for (let i = 0; i < listTracks.length; i++) {
            const tr = listTracks[i];
            const trackItemElem = document.createElement('div');
            listElem.append(trackItemElem);

            const title = document.createElement('a');
            if (listName == 'drafts') {
                title.textContent = `${tr}`;
                title.href = `/music/draft?id=${tr}`;
            }
            else {
                title.textContent = tr.artist ? `${tr.artist} - ${tr.title}` : `🔒 ${tr.title}`;
                title.href = '#';
                title.onclick = () => {
                    trackEmbedsElem.replaceChildren();
                    let embedAutoplay = true;
                    for (const link of tr.links) {
                        const embed = tryEmbed(link, embedAutoplay);
                        if (!embed)
                            continue;
                        trackEmbedsElem.append(embed);
                        trackEmbedsElem.append(document.createElement('br'));
                        embedAutoplay = false;
                    }

                    trackTitleElem.textContent = tr.artist ? `${tr.artist} - ${tr.title}` : `🔒 ${tr.title}`;
                    trackAlbumElem.textContent = tr.albumArtist == tr.artist ?
                        tr.album :
                        `${tr.albumArtist} - ${tr.album}`;
                    trackYearElem.textContent = tr.year == 0 ? 'no year' : tr.year;
                    trackNumberElem.textContent = `${tr.trackNumber}/${tr.trackCount}`;
                    if (tr.discCount > 1)
                        trackNumberElem.textContent += ` (${tr.discNumber}/${tr.discCount})`;
                    trackLinksElem.replaceChildren();
                    for (const link of tr.links) {
                        const linkElem = document.createElement('a');
                        linkElem.href = link;
                        linkElem.target = '_blank';
                        trackLinksElem.append(linkElem);
                        trackLinksElem.append(document.createElement('br'));
                    }

                    trackElem.classList.remove('display-none-firefox-sucks');
                };
            }
            trackItemElem.append(title);
        }

        if (!loggedIn)
            return;

        if (listName == 'drafts') {
            const createDraftButton = document.createElement('span');
            createDraftButton.textContent = '➕';
            createDraftButton.style = 'cursor: pointer;';
            createDraftButton.onclick = async () => {
                const draftId = await api.draft.create();
                location.href = `${location.origin}/music/draft?id=${draftId}`;
            };
            summary.append(createDraftButton);
        }
    }

    if (loggedIn)
        addPlaylist('drafts', 'drafts', await api.getDrafts());

    const library = await api.getLibrary();
    addPlaylist('tracks', 'all songs', library.tracks);
    for (const id in library.playlists) {
        if (!Object.hasOwnProperty.call(library.playlists, id))
            continue;
        const playlist = library.playlists[id];
        if (!loggedIn && playlist.hasUnrecognized)
            continue;
        const names = [];
        for (const name in playlist.names) {
            if (!Object.hasOwnProperty.call(playlist.names, name))
                continue;
            const types = playlist.names[name];
            const hideTypes = types.includes('file');
            if (hideTypes) {
                names.push(name);
            }
            else {
                const processedTypes = [];
                for (const type of types) {
                    if (type == 'file')
                        continue;
                    if (type == 'poweramp') {
                        processedTypes.push('Poweramp');
                        continue;
                    }
                    processedTypes.push(type);
                }
                names.push(`${name} [ ${processedTypes.join(', ')} ]`);
            }
        }
        let listName = names.length == 0 ? `#${id}` : names.join(' / ');
        if (playlist.hasUnrecognized)
            listName = `🔒 ${listName}`;
        addPlaylist(id, listName, playlist.tracks);
    }
});
