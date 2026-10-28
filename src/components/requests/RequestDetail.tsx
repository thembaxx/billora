import { useState } from 'react';
import { ArrowDownIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import type { ServiceRequest } from '../../types';
import { download } from '../../lib/data';
import {
  isReady,
  requestEvent,
  requestKinds,
  requestPack,
  requestStatus,
  type RequestMutation,
} from '../../lib/requests';
import { RequestTracking } from './RequestTracking';

export function RequestDetail({
  request: r,
  onMutate,
  onEdit,
  onDelete,
  notify,
}: {
  request: ServiceRequest;
  onMutate: RequestMutation;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  notify: (text: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  async function pack() {
    setBusy(true);
    setError('');
    try {
      const blob = await requestPack(r);
      download(blob, `billora-request-${r.localReference}.zip`, 'application/zip');
      onMutate(r.id, (current) => ({
        ...current,
        events: [
          ...current.events,
          requestEvent('Request ZIP prepared locally with available evidence. Nothing submitted.'),
        ],
      }));
      notify('Request pack downloaded. Review it and add your contact details before submitting.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not prepare this request pack.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="request-detail">
      <header className="request-detail-heading">
        <div>
          <span className={`request-badge ${r.status}`}>{requestStatus[r.status]}</span>
          <h3>{requestKinds[r.kind].label}</h3>
          <p>
            {r.property.name} · {r.property.municipality}
          </p>
        </div>
        <span className="request-local-ref">
          <small>Billora local reference</small>
          <strong className="numeric">{r.localReference}</strong>
          <small>Not a municipal reference</small>
        </span>
      </header>
      <div className="request-summary-copy">
        <h4>What happened</h4>
        <p>{r.description || 'Describe the issue to continue preparing this draft.'}</p>
        <h4>Requested assistance</h4>
        <p>{r.desiredOutcome || 'Add what you would like the municipality to help with.'}</p>
        <small>
          {r.evidence.length} supporting file{r.evidence.length === 1 ? '' : 's'}
          {r.statement
            ? ` · ${r.statement.source === 'sample' ? 'Sample' : 'Reviewed'} statement linked`
            : ''}{' '}
          · Stored on this device
        </small>
      </div>
      <div className="request-action-row">
        {(r.status === 'draft' || r.status === 'ready') && (
          <button className="button secondary" onClick={onEdit}>
            <PencilSimpleIcon size={18} />
            {r.status === 'draft' ? 'Continue preparing' : 'Edit draft'}
          </button>
        )}
        {isReady(r) && (
          <button className="button primary" disabled={busy} onClick={() => void pack()}>
            <ArrowDownIcon size={18} />
            {busy ? 'Preparing your ZIP…' : 'Download request pack'}
          </button>
        )}
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <p className="request-help">
        The ZIP includes a letter draft, a readable case record, linked statement PDF if available,
        comparison figures and both saved PDFs for comparison queries, and attached evidence. Review
        personal information before sharing. This request pack is not a workspace backup, and
        Billora does not submit it.
      </p>
      <RequestTracking request={r} onMutate={onMutate} notify={notify} />
      <div className="request-delete">
        {confirmDelete ? (
          <>
            <p>
              Delete this request, its timeline and its attached evidence from this device? Linked
              original statement PDFs stay in your statement library. Download the request pack
              first if you need a copy.
            </p>
            <div className="request-action-row">
              <button
                className="button danger small"
                disabled={busy}
                onClick={() =>
                  void (async () => {
                    setBusy(true);
                    try {
                      await onDelete();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Could not delete this request.');
                      setBusy(false);
                    }
                  })()
                }
              >
                Delete request
              </button>
              <button className="text-button muted" onClick={() => setConfirmDelete(false)}>
                Keep request
              </button>
            </div>
          </>
        ) : (
          <button className="text-button muted" onClick={() => setConfirmDelete(true)}>
            <TrashIcon size={16} />
            Delete this local request
          </button>
        )}
      </div>
    </div>
  );
}
