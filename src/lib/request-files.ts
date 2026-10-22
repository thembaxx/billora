import { createStore, get, set, del, clear } from 'idb-keyval';

const store = createStore('billora-request-evidence', 'files');
export const saveRequestFile = (id: string, file: Blob) => set(id, file, store);
export const readRequestFile = (id: string) => get<Blob>(id, store);
export const deleteRequestFile = (id: string) => del(id, store);
export const clearRequestFiles = () => clear(store);
