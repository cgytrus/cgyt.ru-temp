function reqUrl(url) { return `https://api.cgyt.ru/music/v2${url}`; }
async function reqLib(method, url, data, dataType, auth) {
    const res = await fetch(reqUrl(url), {
        method,
        cache: 'no-cache',
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: {
            'Authorization': `Bearer ${auth || document.cookie}`,
            'Content-Type': dataType
        },
        body: data
    });
    if (!res.ok) {
        throw `${res.status} ${res.statusText}\n${await res.text()}`;
    }
    return res;
}

const api = {
    auth: async token => await (await reqLib('GET', `/auth`, undefined, undefined, token)).text(),
    getLibrary: async () => await (await reqLib('GET', '/library')).json(),
    getDrafts: async () => await (await reqLib('GET', '/drafts')).json(),
    draft: {
        create: async () => parseInt(await (await reqLib('POST', '/draft')).text()),
        getMeta: async draftId => await (await reqLib('GET', `/draft/${draftId}/meta`)).json(),
        updateMeta: async (draftId, data) => await reqLib('PUT', `/draft/${draftId}/meta`, JSON.stringify(data), 'application/json'),
        updateArt: async (draftId, image, mime) => await reqLib('PUT', `/draft/${draftId}/art`, image, mime),
        getFiles: async draftId => await (await reqLib('GET', `/draft/${draftId}/files`)).json(),
        file: {
            create: async (draftId, link, proxy) => parseInt(await (await reqLib('POST', `/draft/${draftId}/file`, { link, proxy }, 'application/json')).text()),
            get: async (draftId, fileId) => await (await reqLib('GET', `/draft/${draftId}/file/${fileId}`)).json(),
            getSpectrogram: async (draftId, fileId) => await (await reqLib('GET', `/draft/${draftId}/file/${fileId}/spectrogram`)).blob(),
            delete: async (draftId, fileId) => await reqLib('DELETE', `/draft/${draftId}/file/${fileId}`),
        },
        finalize: async (draftId, fileId) => await reqLib('POST', `/draft/${draftId}/finalize/${fileId}`),
        delete: async draftId => await reqLib('DELETE', `/draft/${draftId}`)
    }
};

async function login() {
    if (await api.auth(undefined) == '') {
        document.cookie += '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        location.reload();
        return;
    }
    const res = prompt('this is only for myself !!!!! ur not supposde to see dis ,,,,,, :<');
    if (res === null)
        return;
    const ver = await api.auth(res);
    if (ver != '') {
        alert(ver);
        return;
    }
    document.cookie = res;
    location.reload();
}
