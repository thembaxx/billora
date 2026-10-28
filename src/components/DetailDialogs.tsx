import { useState } from 'react';
import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  CalendarPlusIcon,
  CheckCircleIcon,
  FileTextIcon,
  MapPinIcon,
  ShareNetworkIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import type { Property, Statement, Workspace } from '../types';
import { portals } from '../types';
import { calendarFile, dateLabel, download, money } from '../lib/data';
import { readDocument } from '../lib/documents';
import { Modal } from './Modal';

export function PropertyDetail({
  property,
  data,
  onClose,
  onStatement,
  onImport,
  onRequest,
  hidden,
}: {
  property: Property;
  data: Workspace;
  onClose: () => void;
  onStatement: (s: Statement) => void;
  onImport: () => void;
  onRequest: () => void;
  hidden: boolean;
}) {
  const statements = data.statements
    .filter((s) => s.propertyId === property.id)
    .sort((a, b) => b.period.localeCompare(a.period));
  const latest = statements[0];
  return (
    <Modal title={property.name} description={property.municipality} onClose={onClose}>
      <img
        className="detail-property-photo"
        src={property.kind === 'Home' ? '/images/home.webp' : '/images/apartment.webp'}
        alt={`${property.kind} property illustration`}
      />
      <p className="property-address">
        <MapPinIcon />
        {property.address}
      </p>
      <div className="detail-amount">
        <span>Latest {latest?.source === 'sample' ? 'sample' : 'imported'} balance</span>
        <strong className="numeric">{hidden ? 'R •••••' : money(latest?.amount || 0)}</strong>
        <small>
          Account {property.account || 'number not added'} ·{' '}
          {latest ? `Due ${dateLabel(latest.dueDate)}` : 'No statements yet'}
        </small>
      </div>
      <a
        className="button primary full"
        href={portals[property.municipality]}
        target="_blank"
        rel="noreferrer"
      >
        Open official municipal portal
        <ArrowUpRightIcon />
      </a>
      <p className="small-note centered">Billora doesn’t process payments or confirm settlement.</p>
      <button className="button secondary full" onClick={onRequest}>
        <FileTextIcon size={18} />
        Prepare a service request
      </button>
      <div className="card-heading detail-section-heading">
        <h3>Statement history</h3>
        <button className="text-button" onClick={onImport}>
          Import new
          <ArrowUpRightIcon />
        </button>
      </div>
      <div className="detail-history">
        {statements.slice(0, 6).map((s) => (
          <button onClick={() => onStatement(s)} key={s.id}>
            <FileTextIcon size={22} />
            <span>
              {dateLabel(s.period + '-01', { month: 'long', year: 'numeric' })}
              <small>{s.source === 'sample' ? 'Sample statement' : 'Reviewed import'}</small>
            </span>
            <strong className="numeric">{hidden ? 'R •••••' : money(s.amount)}</strong>
            <ArrowUpRightIcon />
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function StatementDetail({
  statement: s,
  property,
  onClose,
  onUpdate,
  onDelete,
  notify,
  hidden,
  onRequest,
}: {
  statement: Statement;
  property: Property;
  onClose: () => void;
  onUpdate: (s: Statement) => void;
  onDelete: () => void;
  notify: (v: string) => void;
  hidden: boolean;
  onRequest: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  async function original() {
    if (!s.fileId) return;
    setLoading(true);
    try {
      const blob = await readDocument(s.fileId);
      if (!blob) throw new Error('The original PDF is no longer available on this device.');
      download(blob, s.fileName || 'municipal-statement.pdf');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not open this PDF.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal
      title={`${dateLabel(s.period + '-01', { month: 'long', year: 'numeric' })} statement`}
      description={`${property.name} · ${property.municipality}`}
      onClose={onClose}
    >
      <div className="detail-amount">
        <span>
          {s.source === 'sample' ? 'Illustrative sample balance' : 'Reviewed imported balance'}
        </span>
        <strong className="numeric">{hidden ? 'R •••••' : money(s.amount)}</strong>
        <small>
          Due {dateLabel(s.dueDate, { day: 'numeric', month: 'long', year: 'numeric' })}
        </small>
      </div>
      <div className="detail-category-list">
        {Object.entries(s.categories).map(([key, v]) => (
          <div key={key}>
            <span>
              {key === 'services' ? 'Other / unallocated' : key[0].toUpperCase() + key.slice(1)}
            </span>
            <strong className="numeric">{hidden ? 'R •••••' : money(v)}</strong>
          </div>
        ))}
      </div>
      <div className="detail-actions">
        {s.fileId && (
          <button className="button secondary" onClick={() => void original()} disabled={loading}>
            <ArrowDownIcon />
            {loading ? 'Opening…' : 'Original PDF'}
          </button>
        )}
        <button
          className="button secondary"
          onClick={() => {
            download(
              calendarFile(s, property.name),
              `billora-reminder-${s.dueDate}.ics`,
              'text/calendar',
            );
            notify('Calendar reminder downloaded. Open it to add it to your calendar.');
          }}
        >
          <CalendarPlusIcon />
          Add reminder
        </button>
        <button className="button secondary" onClick={onRequest}>
          <FileTextIcon />
          Prepare service request
        </button>
        {typeof navigator.share === 'function' && (
          <button
            className="button secondary"
            onClick={() => {
              void navigator
                .share({
                  title: `Billora · ${property.name}`,
                  text: `${property.name}\n${s.period} municipal statement\n${hidden ? 'Amount hidden' : money(s.amount)} · Due ${dateLabel(s.dueDate)}\n${s.source === 'sample' ? 'Illustrative sample' : 'Imported'} balance. Not a live verified balance.`,
                })
                .catch((error) => {
                  if (error.name !== 'AbortError')
                    notify('The share sheet could not open. Try exporting your account data.');
                });
            }}
          >
            <ShareNetworkIcon />
            Share summary
          </button>
        )}
      </div>
      <a
        className="button primary full"
        href={portals[property.municipality]}
        target="_blank"
        rel="noreferrer"
      >
        Pay on official municipal portal
        <ArrowUpRightIcon />
      </a>
      <button
        className={`paid-note ${s.paidNote ? 'checked' : ''}`}
        onClick={() => onUpdate({ ...s, paidNote: !s.paidNote })}
        aria-pressed={!!s.paidNote}
      >
        <CheckCircleIcon size={21} weight={s.paidNote ? 'fill' : 'regular'} />
        {s.paidNote ? 'Personally marked as paid' : 'Mark as paid for my own records'}
      </button>
      <p className="small-note centered">
        A personal note only. Payment hasn’t been verified by Billora.
      </p>
      {s.source === 'imported' && (
        <div className="delete-section">
          {confirm ? (
            <>
              <p>
                Remove this statement from the library? Its original PDF is deleted unless it is
                linked to a saved request. Linked PDFs stay with that request until it is removed.
              </p>
              <div>
                <button className="button secondary" onClick={() => setConfirm(false)}>
                  Keep statement
                </button>
                <button className="button danger" onClick={onDelete}>
                  Remove statement
                </button>
              </div>
            </>
          ) : (
            <button className="text-button muted" onClick={() => setConfirm(true)}>
              <TrashIcon size={16} />
              Remove statement
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
