const searchParams = new URLSearchParams(location.search);
const draftId = searchParams.get('id');

async function deleteDraft() {
    await api.draft.delete(draftId);
    location.href = `${location.origin}/music`;
}

async function finishMeta(form) {
    document.getElementById('meta-submit').disabled = true;
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
}

async function finishFileArt(form) {
    document.getElementById('art-file-submit').disabled = true;
    document.getElementById('art-link-submit').disabled = true;
    try {
        await api.draft.updateArt(draftId, form.art.files[0].stream(), form.art.files[0].type);
    }
    catch (error) {
        document.getElementById('art-file-error').innerText = error;
    }
    document.getElementById('art-file-submit').disabled = false;
    document.getElementById('art-link-submit').disabled = false;
}

async function finishLinkArt(form) {
    document.getElementById('art-file-submit').disabled = true;
    document.getElementById('art-link-submit').disabled = true;
    try {
        await api.draft.updateArt(draftId, form.art.value, 'text/plain');
    }
    catch (error) {
        document.getElementById('art-link-error').innerText = error;
    }
    document.getElementById('art-file-submit').disabled = false;
    document.getElementById('art-link-submit').disabled = false;
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
                    const fileId = await api.draft.file.create(draftId, link);
                    await fetchFile(fileId);
                }
                catch (error) {
                    document.getElementById('links-error').innerText = error;
                }
            };
            linkItemElem.append(createFileButton);

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
    if (fileElem) {
        fileElem.replaceChildren();
    }
    else {
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
        fileElem.append(fileErrorElem);
        fileElem.append(document.createElement('br'));
        return;
    }

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
    fileElem.append(deleteButton);

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
        fileElem.append(finalizeButton);
    }

    const title = document.createElement('span');
    title.textContent = `(${fileId}) ${file.link}`;
    fileElem.append(title);
    fileElem.append(document.createElement('br'));

    if (file.status == 'ready') {
        const info = document.createElement('span');
        info.textContent = `${file.format} ${file.codec} ${file.size / 1024.0}KiB ${file.duration} ${file.sampleRate}Hz ${file.bitrate / 1000.0}Kbps`;
        fileElem.append(info);
        fileElem.append(document.createElement('br'));

        const spectrogram = document.createElement('img');
        spectrogram.alt = 'spectrogram';
        fileElem.append(spectrogram);
        fileElem.append(document.createElement('br'));

        try {
            spectrogram.src = URL.createObjectURL(await api.draft.file.getSpectrogram(draftId, fileId));
        }
        catch (error) {
            fileErrorElem.innerText = error;
        }
    }
    else if (file.status == 'downloading') {
        const info = document.createElement('span');
        info.textContent = `${file.progress.state} ${Math.floor(file.progress.progress * 100.0)}`;
        fileElem.append(info);
        fileElem.append(document.createElement('br'));

        setTimeout(() => { fetchFile(fileId) }, 500);
    }
    else {
        fileErrorElem.innerText = 'unknow status: ' + file.status;
    }

    fileElem.append(fileErrorElem);
    fileElem.append(document.createElement('br'));
}

document.addEventListener('DOMContentLoaded', async () => {
    const loggedIn = await api.auth(undefined) == '';

    if (!loggedIn)
        return;

    console.log('logged in !!!~ uwu');
    document.getElementById('login-switch').textContent = '🔓';

    await fetchMeta();
    await fetchFiles();
});
