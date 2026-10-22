import { useRef, useState } from 'react';
import { ArrowDownIcon, PaperclipIcon, TrashIcon } from '@phosphor-icons/react';
import type { ServiceRequest } from '../../types';
import { deleteRequestFile, readRequestFile, saveRequestFile } from '../../lib/request-files';
import { requestKinds, type RequestMutation } from '../../lib/requests';
import { download } from '../../lib/data';

export function RequestEvidence({
  request,
  onMutate,
  onBusy,
}: {
  request: ServiceRequest;
  onMutate: RequestMutation;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const picker = useRef<HTMLInputElement>(null);
  async function attach(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    onBusy(true);
    setError('');
    let count = request.evidence.length;
    let total = request.evidence.reduce((sum, f) => sum + f.size, 0);
    try {
      for (const file of Array.from(files)) {
        if (
          !/\.(pdf|jpe?g|png|webp)$/i.test(file.name) ||
          (file.type &&
            !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type))
        )
          throw new Error('Choose a PDF, JPG, PNG or WebP file.');
        if (file.size > 10 * 1024 * 1024 || total + file.size > 30 * 1024 * 1024 || count >= 6)
          throw new Error('Use up to 6 evidence files, 10 MB per file and 30 MB in total.');
        const id = crypto.randomUUID();
        await saveRequestFile(id, file);
        const saved = onMutate(request.id, (current) => ({
          ...current,
          confirmed: false,
          status: 'draft',
          evidence: [
            ...current.evidence,
            { id, name: file.name, type: file.type, size: file.size },
          ],
        }));
        if (!saved) {
          await deleteRequestFile(id);
          throw new Error('The evidence could not be linked to this request. Please try again.');
        }
        count++;
        total += file.size;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your browser could not save this evidence.');
    } finally {
      setBusy(false);
      onBusy(false);
      if (picker.current) picker.current.value = '';
    }
  }
  async function remove(id: string) {
    setBusy(true);
    onBusy(true);
    try {
      await deleteRequestFile(id);
      onMutate(request.id, (current) => ({
        ...current,
        confirmed: false,
        status: 'draft',
        evidence: current.evidence.filter((f) => f.id !== id),
      }));
    } catch {
      setError('The evidence file could not be removed. Please try again.');
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  const toggle = (id: string, checked: boolean) =>
    onMutate(request.id, (current) => ({
      ...current,
      confirmed: false,
      status: 'draft',
      checked: checked
        ? [...current.checked.filter((v) => v !== id), id]
        : current.checked.filter((v) => v !== id),
    }));
  return (
    <div className="request-evidence">
      <p className="request-help">
        A general checklist for {requestKinds[request.kind].label.toLowerCase()}. Check the official
        portal for the municipality’s current forms and requirements.
      </p>
      <div className="request-checklist">
        <label>
          <input
            type="checkbox"
            checked={request.checked.includes('authority')}
            onChange={(e) => toggle('authority', e.target.checked)}
            required
          />
          <span>
            I’m authorised to use these records and manage this request.
            <small>Required before preparing a request pack.</small>
          </span>
        </label>
        {requestKinds[request.kind].evidence.map((item) => (
          <label key={item.id}>
            <input
              type="checkbox"
              checked={request.checked.includes(item.id)}
              onChange={(e) => toggle(item.id, e.target.checked)}
            />
            <span>
              {item.label}
              <small>Optional in Billora · check when available.</small>
            </span>
          </label>
        ))}
      </div>
      <div className="request-upload">
        <PaperclipIcon size={24} />
        <div>
          <h4>Keep supporting evidence together.</h4>
          <p>
            PDF, JPG, PNG or WebP · 10 MB each · 6 files / 30 MB total. Saved only on this device.
          </p>
        </div>
        <button
          className="button secondary small"
          type="button"
          onClick={() => picker.current?.click()}
          disabled={busy}
        >
          {busy ? 'Saving locally…' : 'Add evidence'}
        </button>
        <input
          ref={picker}
          className="sr-only"
          type="file"
          multiple
          disabled={busy}
          accept="application/pdf,image/jpeg,image/png,image/webp"
          aria-label="Attach request evidence"
          tabIndex={-1}
          onChange={(e) => void attach(e.target.files)}
        />
      </div>
      {request.evidence.length > 0 && (
        <ul className="request-file-list">
          {request.evidence.map((f) => (
            <li key={f.id}>
              <span>
                <strong>{f.name}</strong>
                <small className="numeric">{Math.ceil(f.size / 1024)} KB · saved locally</small>
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label={`Download ${f.name}`}
                onClick={() =>
                  void (async () => {
                    try {
                      const blob = await readRequestFile(f.id);
                      if (!blob)
                        throw new Error(
                          'This evidence is no longer on this device. Attach it again.',
                        );
                      download(blob, f.name);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Could not download this file.');
                    }
                  })()
                }
              >
                <ArrowDownIcon size={18} />
              </button>
              <button
                type="button"
                disabled={busy}
                className="icon-button"
                aria-label={`Remove ${f.name}`}
                onClick={() => void remove(f.id)}
              >
                <TrashIcon size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
