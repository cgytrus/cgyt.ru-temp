const searchParams = new URLSearchParams(location.search);
const draftId = searchParams.get('id');

async function deleteDraft() {
    await api.draft.delete(draftId);
    location.href = `${location.origin}/music`;
}

async function finishMeta(form) {
    document.getElementById('meta-submit').disabled = true;
    document.getElementById('meta-lookup').disabled = true;
    const data = {
        title: form.title.value == '' ? undefined : form.title.value,
        artist: form.artist.value == '' ? undefined : form.artist.value,
        album: form.album.value == '' ? undefined : form.album.value,
        albumArtist: form.albumArtist.value == '' ? undefined : form.albumArtist.value,
        year: form.year.value == '' ? undefined : form.year.valueAsNumber,
        trackNumber: form.trackNumber.value == '' ? undefined : form.trackNumber.valueAsNumber,
        trackCount: form.trackCount.value == '' ? undefined : form.trackCount.valueAsNumber,
        discNumber: form.discNumber.value == '' ? undefined : form.discNumber.valueAsNumber,
        discCount: form.discCount.value == '' ? undefined : form.discCount.valueAsNumber,
        links: form.links.value == '' ? undefined : form.links.value.split(/\r?\n/)
    };
    try {
        await api.draft.updateMeta(draftId, data);
    }
    catch (error) {
        document.getElementById('meta-error').innerText = error;
    }
    await fetchMeta();
    document.getElementById('meta-submit').disabled = false;
    document.getElementById('meta-lookup').disabled = false;
}

async function lookupMeta(form) {
    document.getElementById('meta-submit').disabled = true;
    document.getElementById('meta-lookup').disabled = true;
    document.getElementById('art-file-submit').disabled = true;
    document.getElementById('art-link-submit').disabled = true;
    try {
        const params = new URLSearchParams({
            artist_name: form.artist.value == '' ? undefined : form.artist.value,
            recording_name: form.title.value == '' ? undefined : form.title.value,
            release_name: form.album.value == '' ? undefined : form.album.value
        });
        // lol
        const initLookup = await (await fetch(`https://api.listenbrainz.org/1/metadata/lookup/?${params}`)).json();
        const lookup = await (await fetch(`https://musicbrainz.org/ws/2/release/${initLookup.release_mbid}?inc=artists+recordings&fmt=json`)).json();
        form.title.value = initLookup.recording_name || form.title.value;
        form.artist.value = initLookup.artist_credit_name || form.artist.value;
        form.album.value = lookup.title || form.album.value;
        form.albumArtist.value = lookup['artist-credit']?.map(x => x.name)?.join(' & ') || form.albumArtist.value;
        form.year.value = lookup.date?.split('-')?.[0] || form.year.value;
        form.trackNumber.value = lookup.media?.[0]?.tracks?.find(x => x.recording.id == initLookup.recording_mbid)?.number || form.trackNumber.value;
        form.trackCount.value = lookup.media?.[0]?.['track-count'] || form.trackCount.value;
        if (lookup['cover-art-archive']?.front)
            document.getElementById('art-link-art').value = `https://coverartarchive.org/release/${initLookup.release_mbid}/front`;
    }
    catch (error) {
        document.getElementById('meta-error').innerText = error;
    }
    document.getElementById('meta-submit').disabled = false;
    document.getElementById('meta-lookup').disabled = false;
    document.getElementById('art-file-submit').disabled = false;
    document.getElementById('art-link-submit').disabled = false;
}

async function finishFileArt(form) {
    document.getElementById('art-file-submit').disabled = true;
    document.getElementById('art-link-submit').disabled = true;
    try {
        await api.draft.art.upload(draftId, form.art.files[0], form.art.files[0].type);
    }
    catch (error) {
        document.getElementById('art-file-error').innerText = error;
    }
    document.getElementById('art-file-submit').disabled = false;
    document.getElementById('art-link-submit').disabled = false;
    await fetchArts();
}

async function finishLinkArt(form) {
    document.getElementById('art-file-submit').disabled = true;
    document.getElementById('art-link-submit').disabled = true;
    try {
        await api.draft.art.upload(draftId, form.art.value, 'text/plain');
    }
    catch (error) {
        document.getElementById('art-link-error').innerText = error;
    }
    document.getElementById('art-file-submit').disabled = false;
    document.getElementById('art-link-submit').disabled = false;
    await fetchArts();
}

async function fetchMeta() {
    try {
        const data = await api.draft.getMeta(draftId);
        const form = document.getElementById('meta');
        form.title.value = data.title;
        form.artist.value = data.artist;
        form.album.value = data.album;
        form.albumArtist.value = data.albumArtist;
        form.year.valueAsNumber = data.year;
        form.trackNumber.valueAsNumber = data.trackNumber;
        form.trackCount.valueAsNumber = data.trackCount;
        form.discNumber.valueAsNumber = data.discNumber;
        form.discCount.valueAsNumber = data.discCount;
        form.links.value = data.links.join('\n');
        const linksElem = document.getElementById('links');
        linksElem.replaceChildren();
        for (const link of data.links) {
            const linkItemElem = document.createElement('div');

            const createFileButton = document.createElement('span');
            createFileButton.textContent = '➕';
            createFileButton.style = 'cursor: pointer;';
            createFileButton.onclick = async () => {
                try {
                    const fileId = await api.draft.file.create(draftId, link, false);
                    await fetchFile(fileId);
                }
                catch (error) {
                    document.getElementById('links-error').innerText = error;
                }
            };
            linkItemElem.append(createFileButton);

            const createFileCobaltButton = document.createElement('span');
            createFileCobaltButton.textContent = '✨';
            createFileCobaltButton.style = 'cursor: pointer;';
            createFileCobaltButton.onclick = async () => {
                try {
                    const fileId = await api.draft.file.create(draftId, link, true);
                    await fetchFile(fileId);
                }
                catch (error) {
                    document.getElementById('links-error').innerText = error;
                }
            };
            linkItemElem.append(createFileCobaltButton);

            const title = document.createElement('span');
            title.textContent = link;
            linkItemElem.append(title);

            linksElem.append(linkItemElem);
        }
    }
    catch (error) {
        document.getElementById('meta-error').innerText = error;
    }
}

async function fetchFiles() {
    const filesElem = document.getElementById('files');
    filesElem.replaceChildren();

    let files;
    try {
        files = await api.draft.getFiles(draftId);
    }
    catch (error) {
        document.getElementById('files-error').innerText = error;
        return;
    }

    for (const fileId of files) {
        await fetchFile(fileId);
    }
}
async function fetchFile(fileId) {
    let fileElem = document.getElementById(`file-${fileId}`);
    if (!fileElem) {
        fileElem = document.createElement('div');
        fileElem.id = `file-${fileId}`;
        document.getElementById('files').append(fileElem);
    }

    const fileErrorElem = document.createElement('span');
    fileErrorElem.className = 'error';

    let file;
    try {
        file = await api.draft.file.get(draftId, fileId);
    }
    catch (error) {
        fileElem.replaceChildren(fileErrorElem, document.createElement('br'));
        return;
    }

    const newChildren = [];

    const deleteButton = document.createElement('span');
    deleteButton.textContent = '❌';
    deleteButton.style = 'cursor: pointer;';
    deleteButton.onclick = async () => {
        try {
            await api.draft.file.delete(draftId, fileId);
        }
        catch (error) {
            fileErrorElem.innerText = error;
            return;
        }
        fileElem.remove();
    };
    newChildren.push(deleteButton);

    if (file.status == 'ready') {
        const finalizeButton = document.createElement('span');
        finalizeButton.textContent = '✅';
        finalizeButton.style = 'cursor: pointer;';
        finalizeButton.onclick = async () => {
            try {
                await api.draft.finalize(draftId, fileId);
            }
            catch (error) {
                fileErrorElem.innerText = error;
                return;
            }
            location.href = `${location.origin}/music`;
        };
        newChildren.push(finalizeButton);
    }

    const title = document.createElement('span');
    title.textContent = `(${fileId}) ${file.link}`;
    newChildren.push(title);
    newChildren.push(document.createElement('br'));

    if (file.status == 'ready') {
        const info = document.createElement('span');
        info.textContent = `${file.format} ${file.codec} ${file.size / 1024.0}KiB ${file.duration} ${file.sampleRate}Hz ${file.bitrate / 1000.0}Kbps`;
        newChildren.push(info);
        newChildren.push(document.createElement('br'));

        const spectrogram = document.createElement('img');
        spectrogram.alt = 'spectrogram';
        newChildren.push(spectrogram);
        newChildren.push(document.createElement('br'));

        try {
            spectrogram.src = URL.createObjectURL(await api.draft.file.getSpectrogram(draftId, fileId));
        }
        catch (error) {
            fileErrorElem.innerText = error;
        }
    }
    else if (file.status == 'downloading') {
        const info = document.createElement('span');
        if (file.progress.state == 'error') {
            info.textContent = file.progress.state;
            fileErrorElem.innerText = file.progress.data;
        }
        else {
            info.textContent = `${file.progress.state} ${Math.floor(file.progress.progress * 100.0)} `;
            if (file.progress.data)
                info.textContent += file.progress.data;
            if (file.output)
                info.textContent += `\n${file.output}`;
            setTimeout(() => { fetchFile(fileId) }, 500);
        }
        newChildren.push(info);
        newChildren.push(document.createElement('br'));
    }
    else {
        fileErrorElem.innerText = 'unknow status: ' + file.status;
    }

    if (file.output.length > 0) {
        const out = document.createElement('details');
        const outSummary = document.createElement('summary');
        outSummary.textContent = 'output';
        out.append(outSummary);
        out.className = 'debug';
        for (const line of file.output) {
            out.append(line);
            out.append(document.createElement('br'));
        }
        newChildren.push(out);
        newChildren.push(document.createElement('br'));
    }

    newChildren.push(fileErrorElem);
    newChildren.push(document.createElement('br'));
    fileElem.replaceChildren(...newChildren);
}

async function fetchArts() {
    const artsElem = document.getElementById('arts');
    artsElem.replaceChildren();

    let arts;
    try {
        arts = await api.draft.getArts(draftId);
    }
    catch (error) {
        document.getElementById('arts-error').innerText = error;
        return;
    }

    for (const artId of arts) {
        await fetchArt(artId);
    }
}
async function fetchArt(artId) {
    let artElem = document.getElementById(`art-${artId}`);
    if (artElem) {
        artElem.replaceChildren();
    }
    else {
        artElem = document.createElement('div');
        artElem.id = `art-${artId}`;
        document.getElementById('arts').append(artElem);
    }

    const artErrorElem = document.createElement('span');
    artErrorElem.className = 'error';

    let art;
    try {
        art = await api.draft.art.get(draftId, artId);
    }
    catch (error) {
        artElem.append(artErrorElem);
        artElem.append(document.createElement('br'));
        return;
    }

    if (artId !== '') {
        const deleteButton = document.createElement('span');
        deleteButton.textContent = '❌';
        deleteButton.style = 'cursor: pointer;';
        deleteButton.onclick = async () => {
            try {
                await api.draft.art.delete(draftId, artId);
            }
            catch (error) {
                artErrorElem.innerText = error;
                return;
            }
            artElem.remove();
        };
        artElem.append(deleteButton);

        const selectButton = document.createElement('span');
        selectButton.textContent = '✅';
        selectButton.style = 'cursor: pointer;';
        selectButton.onclick = async () => {
            try {
                await api.draft.art.select(draftId, artId);
            }
            catch (error) {
                artErrorElem.innerText = error;
                return;
            }
            await fetchArts();
        };
        artElem.append(selectButton);

        const title = document.createElement('span');
        title.textContent = `${artId}`;
        artElem.append(title);
        artElem.append(document.createElement('br'));
    }

    const info = document.createElement('span');
    info.textContent = `${art.size / 1024.0}KiB`;
    artElem.append(info);
    artElem.append(document.createElement('br'));

    const image = document.createElement('img');
    image.alt = `art ${artId}`;
    image.style = 'width: 256px;'
    image.onload = () => {
        info.textContent = `${art.size / 1024.0}KiB ${image.naturalWidth}x${image.naturalHeight}`;
    };
    artElem.append(image);
    artElem.append(document.createElement('br'));

    try {
        image.src = URL.createObjectURL(art);
    }
    catch (error) {
        artErrorElem.innerText = error;
    }

    artElem.append(artErrorElem);
    artElem.append(document.createElement('br'));
}

document.addEventListener('DOMContentLoaded', async () => {
    const loggedIn = await api.auth(undefined) == '';

    if (!loggedIn)
        return;

    console.log('logged in !!!~ uwu');
    document.getElementById('login-switch').textContent = '🔓';

    await fetchMeta();
    await fetchFiles();
    await fetchArts();
});
