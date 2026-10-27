import type { PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist';
import type { Worker as OCRWorker } from 'tesseract.js';

export type OCRProgress = {
  stage: 'loading' | 'rendering' | 'recognising' | 'complete';
  page: number;
  totalPages: number;
  progress: number;
  status: string;
};
export type OCRPage = { page: number; text: string; confidence: number };
export type LocalOCRResult = {
  pages: OCRPage[];
  text: string;
  totalPages: number;
  truncated: boolean;
};
export type LocalOCROptions = {
  signal?: AbortSignal;
  maxPages?: number;
  onProgress?: (progress: OCRProgress) => void;
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_PIXELS = 4_000_000;
const MAX_TEXT_PER_PAGE = 150_000;
const clamp = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0);
const cancelled = () => new DOMException('Reading the scanned PDF was cancelled.', 'AbortError');

function checkCancellation(signal?: AbortSignal) {
  if (signal?.aborted) throw cancelled();
}

function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const abort = () => reject(cancelled());
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
    if (signal.aborted) abort();
  });
}

/** Call only after explicit consent: this loads the English OCR worker and language model. */
export async function recogniseScannedPDF(
  file: Blob,
  { signal, maxPages = 5, onProgress }: LocalOCROptions = {},
): Promise<LocalOCRResult> {
  checkCancellation(signal);
  if (typeof document === 'undefined') throw new Error('Local OCR requires a browser.');
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 5)
    throw new Error('Read between one and five PDF pages at a time.');
  if (!file.size || file.size > MAX_FILE_SIZE) throw new Error('Choose a PDF smaller than 15 MB.');
  if (new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()) !== '%PDF-')
    throw new Error('Choose a valid PDF municipal statement.');
  checkCancellation(signal);

  let worker: OCRWorker | undefined;
  let pdfTask: PDFDocumentLoadingTask | undefined;
  let renderTask: RenderTask | undefined;
  let workerStop: Promise<unknown> | undefined;
  let pdfStop: Promise<unknown> | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let pageNumber = 0;
  let pageCount = 0;
  let live = true;
  const emit = (stage: OCRProgress['stage'], progress: number, status: string) => {
    if (live && !signal?.aborted)
      onProgress?.({
        stage,
        page: pageNumber,
        totalPages: pageCount,
        progress: clamp(progress),
        status,
      });
  };
  const stopWorker = () => {
    if (worker && !workerStop) workerStop = worker.terminate();
    return workerStop ?? Promise.resolve();
  };
  const stopPDF = () => {
    if (pdfTask && !pdfStop) pdfStop = pdfTask.destroy();
    return pdfStop ?? Promise.resolve();
  };
  const abort = () => {
    renderTask?.cancel();
    void stopWorker().catch(() => {});
    void stopPDF().catch(() => {});
  };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    emit('loading', 0, 'Preparing local PDF reader');
    const [pdf, { default: workerURL }, tesseract] = await abortable(
      Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
        import('tesseract.js'),
      ]),
      signal,
    );
    checkCancellation(signal);
    pdf.GlobalWorkerOptions.workerSrc = workerURL;
    const data = await abortable(file.arrayBuffer(), signal);
    checkCancellation(signal);
    pdfTask = pdf.getDocument({ data });
    const pdfDocument = await abortable(pdfTask.promise, signal);
    checkCancellation(signal);
    pageCount = Math.min(pdfDocument.numPages, maxPages);
    const loadingWorker = tesseract
      .createWorker('eng', tesseract.OEM.LSTM_ONLY, {
        logger: (message) => {
          if (!pageNumber) emit('loading', clamp(message.progress) * 0.1, message.status);
          else
            emit(
              'recognising',
              0.1 + (0.9 * (pageNumber - 1 + 0.15 + 0.85 * clamp(message.progress))) / pageCount,
              message.status,
            );
        },
      })
      .then((created) => {
        worker = created;
        // Initialisation has no AbortSignal API. Terminate even if it finishes after cancellation.
        if (!live || signal?.aborted) void stopWorker().catch(() => {});
        return created;
      });
    worker = await abortable(loadingWorker, signal);
    checkCancellation(signal);
    const pages: OCRPage[] = [];
    for (pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      checkCancellation(signal);
      emit(
        'rendering',
        0.1 + (0.9 * (pageNumber - 1)) / pageCount,
        'Rendering page on this device',
      );
      const page = await abortable(pdfDocument.getPage(pageNumber), signal);
      try {
        const natural = page.getViewport({ scale: 1 });
        if (![natural.width, natural.height].every((value) => Number.isFinite(value) && value > 0))
          throw new Error('This PDF page has unsupported dimensions. Enter its figures manually.');
        const scale = Math.min(
          2,
          Math.sqrt(MAX_PIXELS / natural.width / natural.height),
          2400 / Math.max(natural.width, natural.height),
        );
        const viewport = page.getViewport({ scale });
        canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('This browser could not prepare a page for local OCR.');
        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          background: '#ffffff',
        });
        await abortable(renderTask.promise, signal);
        renderTask = undefined;
        checkCancellation(signal);
        const { data: result } = await abortable(worker.recognize(canvas), signal);
        checkCancellation(signal);
        if (result.text.length > MAX_TEXT_PER_PAGE)
          throw new Error(
            'This page contains too much text for local review. Enter its figures manually.',
          );
        pages.push({
          page: pageNumber,
          text: result.text.trim(),
          confidence: Number.isFinite(result.confidence)
            ? Math.max(0, Math.min(100, result.confidence))
            : 0,
        });
      } finally {
        page.cleanup();
        if (canvas) canvas.width = canvas.height = 0;
        canvas = undefined;
      }
    }
    pageNumber = pageCount;
    emit('complete', 1, 'Local reading complete. Review every suggested figure.');
    return {
      pages,
      text: pages.map((page) => `Page ${page.page}\n${page.text}`).join('\n\n'),
      totalPages: pdfDocument.numPages,
      truncated: pdfDocument.numPages > pageCount,
    };
  } catch (error) {
    if (signal?.aborted) throw cancelled();
    throw error;
  } finally {
    live = false;
    signal?.removeEventListener('abort', abort);
    renderTask?.cancel();
    if (canvas) canvas.width = canvas.height = 0;
    await Promise.allSettled([stopWorker(), stopPDF()]);
  }
}
