import pdfWorkerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createStore, get, set, del, clear, entries } from 'idb-keyval';
const store = createStore('billora-documents', 'originals');
export const saveDocument = (key: string, file: Blob) => set(key, file, store);
export const readDocument = (key: string) => get<Blob>(key, store);
export const deleteDocument = (key: string) => del(key, store);
export const clearDocuments = () => clear(store);
export const documentEntries = () => entries<string, Blob>(store);

export async function extractPDF(file: File): Promise<string> {
  const pdf = await import('pdfjs-dist');
  pdf.GlobalWorkerOptions.workerSrc = pdfWorkerURL;
  const task = pdf.getDocument({ data: await file.arrayBuffer() });
  const document = await task.promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= Math.min(document.numPages, 20); i++) {
      const page = await document.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    }
    return pages.join('\n');
  } finally {
    await task.destroy();
  }
}
