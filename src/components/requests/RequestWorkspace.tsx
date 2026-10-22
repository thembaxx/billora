import { useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, ClipboardTextIcon, PlusIcon } from '@phosphor-icons/react';
import type { Property, ServiceRequest, Statement, Workspace } from '../../types';
import { followUpDue, requestKinds, requestStatus, type RequestMutation } from '../../lib/requests';
import { Modal } from '../Modal';
import { RequestEditor } from './RequestEditor';
import { RequestDetail } from './RequestDetail';

export function RequestWorkspace({
  data,
  initial,
  onCreate,
  onMutate,
  onDelete,
  onClose,
  onAddProperty,
  notify,
  hidden,
}: {
  data: Workspace;
  initial: { id: string; edit: boolean } | null;
  onCreate: (property: Property, statement?: Statement) => ServiceRequest | null;
  onMutate: RequestMutation;
  onDelete: (id: string) => Promise<boolean>;
  onClose: () => void;
  onAddProperty: () => void;
  notify: (message: string) => void;
  hidden: boolean;
}) {
  const [selectedId, setSelectedId] = useState(initial?.id || '');
  const [editing, setEditing] = useState(initial?.edit || false);
  const [filter, setFilter] = useState('open');
  const selected = data.requests.find((r) => r.id === selectedId);
  const rows = [...data.requests]
    .filter(
      (r) =>
        filter === 'all' ||
        (filter === 'open'
          ? r.status !== 'resolved'
          : filter === 'due'
            ? followUpDue(r)
            : r.status === filter),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  function create() {
    if (!data.properties.length) return;
    const request = onCreate(data.properties[0]);
    if (request) {
      setSelectedId(request.id);
      setEditing(true);
    }
  }
  return (
    <Modal
      title="A clear next step."
      description="Prepare municipal requests and keep your own follow-up record."
      wide
      onClose={onClose}
    >
      <div className="request-workspace">
        <div className="request-local-notice">
          <ClipboardTextIcon size={20} />
          <p>
            <strong>Saved on this device.</strong> Billora does not submit requests. References and
            status updates are recorded by you.{' '}
            <a href="/legal/data/" target="_blank" rel="noreferrer">
              Data policy<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
        {selected ? (
          <>
            <div className="request-back-row">
              <button
                className="text-button muted"
                onClick={() => {
                  setSelectedId('');
                  setEditing(false);
                }}
              >
                <ArrowLeftIcon size={16} />
                All requests
              </button>
              <span className="numeric">{selected.localReference}</span>
            </div>
            {editing ? (
              <RequestEditor
                request={selected}
                data={data}
                onMutate={onMutate}
                hidden={hidden}
                onDone={() => setEditing(false)}
              />
            ) : (
              <RequestDetail
                key={selected.id}
                request={selected}
                onMutate={onMutate}
                onEdit={() => setEditing(true)}
                onDelete={async () => {
                  if (await onDelete(selected.id)) {
                    setSelectedId('');
                    setEditing(false);
                  } else throw new Error('The request could not be removed. Please try again.');
                }}
                notify={notify}
              />
            )}
          </>
        ) : (
          <>
            <div className="request-list-heading">
              <div>
                <span className="eyebrow">YOUR SERVICE REQUESTS</span>
                <h3>A little more organised.</h3>
                <p>
                  {data.requests.length} local request{data.requests.length === 1 ? '' : 's'} ·{' '}
                  {data.requests.filter(followUpDue).length} personal follow-ups due
                </p>
              </div>
              {data.properties.length > 0 && (
                <button className="button primary small" onClick={create}>
                  <PlusIcon size={17} />
                  New request
                </button>
              )}
            </div>
            {data.requests.length > 0 && (
              <label className="request-filter">
                Show
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="Filter service requests"
                >
                  <option value="open">Open requests</option>
                  <option value="all">All requests</option>
                  <option value="due">Personal follow-ups due</option>
                  <option value="draft">Drafts</option>
                  <option value="resolved">Resolved by you</option>
                </select>
              </label>
            )}
            {rows.length ? (
              <ul className="request-list">
                {rows.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => {
                        setSelectedId(r.id);
                        setEditing(false);
                      }}
                    >
                      <span className="request-list-icon">
                        <ClipboardTextIcon size={22} weight="duotone" />
                      </span>
                      <span className="request-list-copy">
                        <strong>
                          {requestKinds[r.kind].label} · {r.property.name}
                        </strong>
                        <small>{r.property.municipality}</small>
                        <span className={`request-badge ${r.status}`}>
                          {requestStatus[r.status]}
                        </span>
                        {followUpDue(r) && (
                          <small className="request-due">
                            Your follow-up is due · {r.submission?.followUpOn}
                          </small>
                        )}
                      </span>
                      <ArrowRightIcon size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="request-empty">
                <ClipboardTextIcon size={46} weight="duotone" />
                <h3>
                  {data.requests.length
                    ? 'A little breathing room.'
                    : 'From an issue to a clear request.'}
                </h3>
                <p>
                  {data.requests.length
                    ? 'There are no requests in this view. Try another filter.'
                    : 'Describe what happened, gather evidence and prepare a pack for the official channel. You can finish later, even offline.'}
                </p>
                {!data.properties.length && (
                  <button className="button primary" onClick={onAddProperty}>
                    Add a property first <PlusIcon size={17} />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
