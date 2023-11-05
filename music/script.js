const username = 'cgytrus';

function reqLib(method, url, data, auth) {
    return fetch(`https://api.cgyt.ru/music/v1${url}`, {
        method,
        cache: 'no-cache',
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: {
            'Authorization': `Bearer ${auth === undefined ? document.cookie : auth}`,
            'Content-Type': data === undefined ? undefined : 'application/json'
        },
        body: data === undefined ? undefined : JSON.stringify(data),
    });
}

const user = {
    verify: async token => await (await reqLib('GET', `/user/verify`, undefined, token)).text(),
    getTracks: async username => await (await reqLib('GET', `/user/${username}/tracks`)).json(),
    getPlaylists: async username => await (await reqLib('GET', `/user/${username}/playlists`)).json()
};

const track = {
    get: async id => await (await reqLib('GET', `/track/${id}`)).json(),
    getLyrics: async id => await (await reqLib('GET', `/track/${id}/lyrics`)).text(),
    download: async id => await reqLib('GET', `/track/${id}/download`),
    add: async data => await (await reqLib('POST', '/track', data)).json(),
    edit: async (id, data) => await reqLib('PUT', `/track/${id}`, data),
    remove: async id => await reqLib('DELETE', `/track/${id}`)
};

const playlist = {
    get: async id => await (await reqLib('GET', `/playlist/${id}`)).json(),
    create: async data => await (await reqLib('POST', '/playlist', data)).json(),
    edit: async (id, data) => await reqLib('PUT', `/playlist/${id}`, data),
    delete: async id => await reqLib('DELETE', `/playlist/${id}`)
};

async function login() {
    const res = prompt('token');
    if (res === null)
        return;
    const ver = await user.verify(res);
    if (ver != '') {
        alert(ver);
        return;
    }
    document.cookie = res;
    location.reload();
}

let currentGlobalEdit = false;
function getGlobalEditClass() {
    return currentGlobalEdit ? 'priv-edit-show' : 'priv-edit';
}
function switchGlobalEdit() {
    const prevClass = getGlobalEditClass();
    currentGlobalEdit = !currentGlobalEdit;
    const newClass = getGlobalEditClass();

    let allElems = [];
    let elems = document.getElementsByClassName(prevClass);
    for (let i = 0; i < elems.length; i++)
        allElems.push(elems.item(i));
    allElems.forEach(elem => {
        if (elem.classList.contains(prevClass))
            elem.classList.remove(prevClass);
        if (!elem.classList.contains(newClass))
            elem.classList.add(newClass);
    })
}

function toggleShowAddUi(id) {
    const elem = document.getElementById(id);
    if (elem.attributeStyleMap.has('display'))
        elem.attributeStyleMap.delete('display');
    else
        elem.attributeStyleMap.set('display', 'none');
}

function addPlaylist() { throw 'too early'; }
async function addFakePlaylist() {
    addPlaylist({ id: 0, title: 'all', tracks: await user.getTracks(username) });
}
async function addAllPlaylists() {
    await addFakePlaylist();
    for (const list of await user.getPlaylists(username)) {
        addPlaylist(await playlist.get(list));
    }
}

let editingTrackId = 0;
async function finishAddTrack(form) {
    document.getElementById('add-track-submit').disabled = true;
    document.getElementById('add-track-title').required = editingTrackId == 0;
    document.getElementById('add-track-artist').required = editingTrackId == 0;
    document.getElementById('add-track-listen').required = editingTrackId == 0;
    const data = {
        title: form.title.value == '' ? undefined : form.title.value,
        artist: form.artist.value == '' ? undefined : form.artist.value,
        album: form.album.value == '' ? undefined : form.album.value,
        albumArtist: form.albumArtist.value == '' ? undefined : form.albumArtist.value,
        art: form.art.files.length == 0 ? (editingTrackId == 0 ? '' : undefined) : base64ArrayBuffer(await form.art.files[0].arrayBuffer()),
        year: form.year.value == '' ? undefined : form.year.valueAsNumber,
        genre: form.genre.value == '' ? undefined : form.genre.value,
        trackNumber: form.trackNumber.value == '' ? undefined : form.trackNumber.valueAsNumber,
        trackCount: form.trackCount.value == '' ? undefined : form.trackCount.valueAsNumber,
        discNumber: form.discNumber.value == '' ? undefined : form.discNumber.valueAsNumber,
        discCount: form.discCount.value == '' ? undefined : form.discCount.valueAsNumber,
        lyrics: form.lyrics.files.length == 0 ? (editingTrackId == 0 ? '' : undefined) : await form.lyrics.files[0].text(),
        listen: form.listen.value == '' ? undefined : form.listen.value,
        download: form.download.value == '' ? undefined : form.download.value
    };
    if (editingTrackId == 0)
        await track.add(data);
    else
        await track.edit(editingTrackId, data);
    addAllPlaylists();
    toggleShowAddUi('add-track');
    document.getElementById('add-track-submit').disabled = false;
}

async function finishAddPlaylist(form) {
    document.getElementById('add-playlist-submit').disabled = true;
    let tracks = [];
    const checkboxes = document.getElementsByClassName('track-checkbox');
    for (let i = 0; i < checkboxes.length; i++) {
        tracks.push(parseInt(checkboxes.item(i).id.split('-')[1]));
        checkboxes.item(i).checked = false;
    }
    addPlaylist(await playlist.create({
        title: form.title.value,
        tracks
    }));
    toggleShowAddUi('add-playlist');
    document.getElementById('add-playlist-submit').disabled = false;
}

function downloadText(filename, text) {
    download(filename, `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
}
function download(filename, href) {
    const element = document.createElement('a');
    element.href = href;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    element.remove();
}

document.addEventListener('DOMContentLoaded', async () => {
    const loggedIn = await user.verify(undefined) == '';

    if (loggedIn) {
        console.log('logged in !!!~ uwu');

        document.getElementById('global-edit-switch').attributeStyleMap.delete('display');

        const addPlaylistButton = document.createElement('span');
        addPlaylistButton.textContent = '➕';
        addPlaylistButton.classList.add(getGlobalEditClass());
        addPlaylistButton.style = 'cursor: pointer;';
        addPlaylistButton.onclick = async () => {
            toggleShowAddUi('add-playlist');
        };
        document.getElementById('inner').append(addPlaylistButton);
    }

    const playlistsElem = document.getElementById('playlists');
    const trackElem = document.getElementById('track');
    const trackEmbedElem = document.getElementById('track-embed');
    const trackTitleElem = document.getElementById('track-title');
    const trackAlbumElem = document.getElementById('track-album');
    const trackGenreElem = document.getElementById('track-genre');
    const trackYearElem = document.getElementById('track-year');
    const trackNumberElem = document.getElementById('track-number');
    const trackListenElem = document.getElementById('track-listen');
    const trackDownloadElem = document.getElementById('track-download');

    addPlaylist = (list) => {
        const listElemId = `playlist-${list.id}`;
        let listElem = document.getElementById(listElemId);
        if (listElem === null) {
            listElem = document.createElement('details');
            listElem.id = listElemId;
            playlistsElem.append(listElem);
        }
        while (listElem.hasChildNodes())
            listElem.firstChild.remove();

        const summary = document.createElement('summary');
        summary.textContent = list.title;
        listElem.append(summary);

        for (let i = 0; i < list.tracks.length; i++) {
            const tr = list.tracks[i];
            const trackItemElem = document.createElement('div');
            listElem.append(trackItemElem);

            const title = document.createElement('a');
            title.textContent = `${tr.artist} - ${tr.title}`;
            title.href = '#';
            title.onclick = () => {
                while (trackEmbedElem.hasChildNodes())
                    trackEmbedElem.firstChild.remove();
                const embed = tryEmbed(tr.listen);
                if (embed !== null)
                    trackEmbedElem.append(embed);

                trackTitleElem.textContent = `${tr.artist} - ${tr.title}`;
                trackAlbumElem.textContent = tr.albumArtist == tr.artist ?
                    tr.album :
                    `${tr.albumArtist} - ${tr.album}`;
                trackGenreElem.textContent = tr.genre == '' ? 'no genre' : tr.genre;
                trackYearElem.textContent = tr.year == 0 ? 'no year' : tr.year;
                trackNumberElem.textContent = `${tr.trackNumber}/${tr.trackCount}`;
                if (tr.discCount > 1)
                    trackNumberElem.textContent += ` (${tr.discNumber}/${tr.discCount})`;
                trackListenElem.href = tr.listen;
                trackDownloadElem.href = tr.download;
                if (tr.listen == tr.download)
                    trackDownloadElem.attributeStyleMap.set('display', 'none');
                else
                    trackDownloadElem.attributeStyleMap.delete('display');
                trackElem.attributeStyleMap.delete('display');
            };
            trackItemElem.append(title);

            if (tr.hasLyrics) {
                const lyricsButton = document.createElement('span');
                lyricsButton.textContent = '🗒️';
                lyricsButton.style = 'cursor: pointer;';
                lyricsButton.onclick = async () => {
                    const lyrics = await track.getLyrics(tr.id);
                    // i should make this more accurate but who cares
                    const extension = lyrics
                        .split('\n')
                        .every(line => line.trimStart() == '' || line.trimStart().startsWith('[')) ?
                            'lrc' :
                            'txt';
                    downloadText(`${tr.artist} - ${tr.title}.${extension}`, lyrics);
                };
                trackItemElem.append(lyricsButton);
            }

            if (!loggedIn)
                return;

            const downloadButton = document.createElement('span');
            downloadButton.textContent = '⬇️';
            downloadButton.style = 'cursor: pointer;';
            downloadButton.onclick = async () => {
                const res = await track.download(tr.id);
                download(
                    res.headers.get('Content-Disposition').match(/(?<=")(?:\\.|[^"\\])*(?=")/),
                    window.URL.createObjectURL(await res.blob())
                );
            };
            trackItemElem.append(downloadButton);

            if (list.id != 0) {
                const canMoveUp = i >= 1;
                const canMoveDown = i < list.tracks.length - 1;

                const moveUpButton = document.createElement('span');
                moveUpButton.textContent = canMoveUp ? '🔺' : '◾';
                moveUpButton.classList.add(getGlobalEditClass());
                if (canMoveUp) {
                    moveUpButton.style = 'cursor: pointer;';
                    moveUpButton.onclick = async () => {
                        list.tracks.splice(i, 1);
                        list.tracks.splice(i - 1, 0, tr);
                        await playlist.edit(list.id, {
                            tracks: list.tracks.map(t => t.id)
                        });
                        addPlaylist(await playlist.get(list.id));
                    };
                }
                trackItemElem.prepend(moveUpButton);

                const moveDownButton = document.createElement('span');
                moveDownButton.textContent = canMoveDown ? '🔻' : '◾';
                moveDownButton.classList.add(getGlobalEditClass());
                if (canMoveDown) {
                    moveDownButton.style = 'cursor: pointer;';
                    moveDownButton.onclick = async () => {
                        list.tracks.splice(i, 1);
                        list.tracks.splice(i + 1, 0, tr);
                        await playlist.edit(list.id, {
                            tracks: list.tracks.map(t => t.id)
                        });
                        addPlaylist(await playlist.get(list.id));
                    };
                }
                trackItemElem.prepend(moveDownButton);
            }

            const removeButton = document.createElement('span');
            removeButton.textContent = '❌';
            removeButton.classList.add(getGlobalEditClass());
            removeButton.style = 'cursor: pointer;';
            removeButton.onclick = async () => {
                if (list.id == 0) {
                    await track.remove(tr.id);
                    await addAllPlaylists();
                    return;
                }
                list.tracks.splice(i, 1);
                await playlist.edit(list.id, {
                    tracks: list.tracks.map(t => t.id)
                });
                addPlaylist(await playlist.get(list.id));
            };
            trackItemElem.prepend(removeButton);

            if (list.id == 0) {
                const checkbox = document.createElement('input');
                checkbox.id = `track-${tr.id}-checkbox`;
                checkbox.classList.add(getGlobalEditClass());
                checkbox.classList.add('track-checkbox');
                checkbox.type = 'checkbox';
                trackItemElem.prepend(checkbox);
            }

            const editButton = document.createElement('span');
            editButton.textContent = '✏️';
            editButton.classList.add(getGlobalEditClass());
            editButton.style = 'cursor: pointer;';
            editButton.onclick = async () => {
                editingTrackId = tr.id;
                toggleShowAddUi('add-track');
            };
            trackItemElem.append(editButton);
        }

        if (!loggedIn)
            return;

        const addTrackButton = document.createElement('span');
        addTrackButton.textContent = '➕';
        addTrackButton.classList.add(getGlobalEditClass());
        addTrackButton.style = 'cursor: pointer;';
        addTrackButton.onclick = async () => {
            if (list.id == 0) {
                editingTrackId = 0;
                toggleShowAddUi('add-track');
                return;
            }
            let tracks = list.tracks.map(t => t.id);
            const checkboxes = document.getElementsByClassName('track-checkbox');
            for (let i = 0; i < checkboxes.length; i++) {
                tracks.push(parseInt(checkboxes.item(i).id.split('-')[1]));
                checkboxes.item(i).checked = false;
            }
            await playlist.edit(list.id, {
                tracks
            });
            addPlaylist(await playlist.get(list.id));
        };
        summary.append(addTrackButton);

        if (list.id != 0) {
            const editNameButton = document.createElement('span');
            editNameButton.textContent = '✏️';
            editNameButton.classList.add(getGlobalEditClass());
            editNameButton.style = 'cursor: pointer;';
            editNameButton.onclick = async () => {
                await playlist.edit(list.id, {
                    title: prompt('new title dont cancel !!!!!!!!!!!!')
                });
                addPlaylist(await playlist.get(list.id));
            };
            summary.append(editNameButton);

            const deleteButton = document.createElement('span');
            deleteButton.textContent = '❌';
            deleteButton.classList.add(getGlobalEditClass());
            deleteButton.style = 'cursor: pointer;';
            deleteButton.onclick = async () => {
                await playlist.delete(list.id);
                document.getElementById(listElemId).remove();
            };
            summary.append(deleteButton);
        }
    }

    await addAllPlaylists();
});
